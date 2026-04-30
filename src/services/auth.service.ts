import { BadRequestError } from "../errors/BadRequestError";
import { authRepository } from "../repositories/auth.repository";
import { refreshTokenRepository } from "../repositories/refreshToken.repository";
import { TokenUtils } from "../utils/token.utils";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { logger } from "../utils/logger";
import { createId } from "@paralleldrive/cuid2";

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

  const tokenId = createId();
  const accessToken = TokenUtils.generateAccessToken(user.id);
  const refreshToken = TokenUtils.generateRefreshToken(user.id, tokenId);
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await refreshTokenRepository.createRefreshToken(user.id, hashedRefreshToken, tokenId);

  logger.info(`New user registered: ${user.email}`);
  return { user, accessToken, refreshToken };
};

const loginService = async (data: { email: string; password: string }) => {
  const user = await authRepository.findUserByEmail(data.email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const isPasswordValid = await TokenUtils.compareFunction(data.password, user.password);
  if (!isPasswordValid) throw new UnauthorizedError("Invalid email or password");

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

  // Rotate: delete old token, issue a brand-new one
  await refreshTokenRepository.deleteRefreshToken(storedToken.id);
  const tokenId = createId();
  const accessToken = TokenUtils.generateAccessToken(decoded.id);
  const newRefreshToken = TokenUtils.generateRefreshToken(decoded.id, tokenId);
  const hashedRefreshToken = await TokenUtils.hashedFunction(newRefreshToken);
  await refreshTokenRepository.createRefreshToken(decoded.id, hashedRefreshToken, tokenId);

  return { accessToken, refreshToken: newRefreshToken };
};

export const AuthServices = {
  registerService,
  loginService,
  logoutService,
  refreshTokenService,
};
