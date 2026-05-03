import { BadRequestError } from "../errors/BadRequestError";
import { authRepository } from "../repositories/auth.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { verificationRepository } from "../repositories/verification.repository";
import { TokenUtils } from "../utils/token.utils";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { logger } from "../utils/logger";
import { createId } from "@paralleldrive/cuid2";
import { sendVerificationEmail, sendTwoFactorEmail } from "./email.service";
import { VerificationType } from "@prisma/client";

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const registerService = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const existingUser = await authRepository.findUserByEmail(data.email);
  if (existingUser) throw new BadRequestError("Email already in use");

  const hashedPassword = await TokenUtils.hashedFunction(data.password);
  const user = await authRepository.createUser({
    name: data.name,
    email: data.email,
    hashedPassword,
  });

  // Generate and send verification code
  const code = generateCode();
  await verificationRepository.createVerificationCode(
    user.id,
    code,
    VerificationType.EMAIL_VERIFICATION
  );
  try {
  await sendVerificationEmail(data.email, code);
} catch (err) {
  logger.error(`Failed to send verification email: ${err}`);
}

  logger.info(`New user registered: ${user.email}`);
  return { user, message: "Verification code sent to your email" };
};

const verifyEmailService = async (userId: string, code: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) throw new BadRequestError("User not found");
  if (user.isEmailVerified) throw new BadRequestError("Email already verified");

  const verificationCode = await verificationRepository.findVerificationCode(
    userId,
    code,
    VerificationType.EMAIL_VERIFICATION
  );
  if (!verificationCode) throw new BadRequestError("Invalid or expired code");

  await verificationRepository.deleteVerificationCode(verificationCode.id);
  await authRepository.updateUser(userId, { isEmailVerified: true });

  // Now generate tokens after verification
  const tokenId = createId();
  const accessToken = TokenUtils.generateAccessToken(userId);
  const refreshToken = TokenUtils.generateRefreshToken(userId, tokenId);
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await refreshTokenRepository.createRefreshToken(userId, hashedRefreshToken, tokenId);

  logger.info(`User email verified: ${user.email}`);
  return { user, accessToken, refreshToken };
};

const loginService = async (data: { email: string; password: string }) => {
  const user = await authRepository.findUserByEmail(data.email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const isPasswordValid = await TokenUtils.compareFunction(data.password, user.password);
  if (!isPasswordValid) throw new UnauthorizedError("Invalid email or password");

  if (!user.isEmailVerified) throw new UnauthorizedError("Please verify your email first");

  // If 2FA is enabled
  if (user.isTwoFactorEnabled) {
    const code = generateCode();
    await verificationRepository.createVerificationCode(
      user.id,
      code,
      VerificationType.TWO_FACTOR
    );
    await sendTwoFactorEmail(user.email, code);
    return { twoFactorRequired: true, userId: user.id };
  }

  const tokenId = createId();
  const accessToken = TokenUtils.generateAccessToken(user.id);
  const refreshToken = TokenUtils.generateRefreshToken(user.id, tokenId);
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await refreshTokenRepository.createRefreshToken(user.id, hashedRefreshToken, tokenId);

  logger.info(`User logged in: ${user.email}`);
  return {
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
  };
};

const verifyTwoFactorService = async (userId: string, code: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) throw new BadRequestError("User not found");

  const verificationCode = await verificationRepository.findVerificationCode(
    userId,
    code,
    VerificationType.TWO_FACTOR
  );
  if (!verificationCode) throw new BadRequestError("Invalid or expired code");

  await verificationRepository.deleteVerificationCode(verificationCode.id);

  const tokenId = createId();
  const accessToken = TokenUtils.generateAccessToken(userId);
  const refreshToken = TokenUtils.generateRefreshToken(userId, tokenId);
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await refreshTokenRepository.createRefreshToken(userId, hashedRefreshToken, tokenId);

  logger.info(`User 2FA verified: ${user.email}`);
  return {
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
  };
};

const logoutService = async (token: string) => {
  const decoded = TokenUtils.verifyRefreshToken(token);
  const storedToken = await refreshTokenRepository.findRefreshToken(decoded.tokenId);
  if (!storedToken) throw new UnauthorizedError("Invalid refresh token");
  const isValidToken = await TokenUtils.compareFunction(token, storedToken.token);
  if (!isValidToken) throw new UnauthorizedError("Invalid refresh token");
  await refreshTokenRepository.deleteRefreshToken(storedToken.id);
  logger.info(`User logged out`);
};

const refreshTokenService = async (token: string) => {
  const decoded = TokenUtils.verifyRefreshToken(token);
  const storedToken = await refreshTokenRepository.findRefreshToken(decoded.tokenId);
  if (!storedToken) throw new UnauthorizedError("Invalid refresh token");
  if (storedToken.userId !== decoded.id) throw new UnauthorizedError("Token mismatch");
  if (storedToken.expiresAt < new Date()) {
    await refreshTokenRepository.deleteRefreshToken(storedToken.id);
    throw new UnauthorizedError("Refresh token expired");
  }
  const isValidToken = await TokenUtils.compareFunction(token, storedToken.token);
  if (!isValidToken) throw new UnauthorizedError("Invalid refresh token");

  await refreshTokenRepository.deleteRefreshToken(storedToken.id);
  const tokenId = createId();
  const accessToken = TokenUtils.generateAccessToken(decoded.id);
  const newRefreshToken = TokenUtils.generateRefreshToken(decoded.id, tokenId);
  const hashedRefreshToken = await TokenUtils.hashedFunction(newRefreshToken);
  await refreshTokenRepository.createRefreshToken(decoded.id, hashedRefreshToken, tokenId);
  return { accessToken, refreshToken: newRefreshToken };
};

const toggleTwoFactorService = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) throw new BadRequestError("User not found");

  const updatedUser = await authRepository.updateUser(userId, {
    isTwoFactorEnabled: !user.isTwoFactorEnabled,
  });

  const status = updatedUser.isTwoFactorEnabled ? "enabled" : "disabled";
  logger.info(`User ${userId} two-factor authentication ${status}`);
  return { user: updatedUser, message: `Two-factor authentication ${status}` };
};

const resendVerificationCodeService = async (userId: string) => {
  const user = await authRepository.findUserById(userId);
  if (!user) throw new BadRequestError("User not found");
  if (user.isEmailVerified) throw new BadRequestError("Email already verified");

  const code = generateCode();
  await verificationRepository.createVerificationCode(
    userId,
    code,
    VerificationType.EMAIL_VERIFICATION
  );
  await sendVerificationEmail(user.email, code);

  return { message: "Verification code resent successfully" };
};

export const AuthServices = {
  registerService,
  verifyEmailService,
  loginService,
  verifyTwoFactorService,
  toggleTwoFactorService,
  logoutService,
  refreshTokenService,
  resendVerificationCodeService,
};