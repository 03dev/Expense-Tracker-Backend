import { BadRequestError } from "../errors/BadRequestError";
import { AuthRepository } from "../repositories/auth.repository";
import { TokenUtils } from "../utils/token.utils";
import { UnauthorizedError } from "../errors/UnauthorizedError";

const registerService = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const existingUser = await AuthRepository.findUserByEmail(data.email);

  if (existingUser) {
    throw new BadRequestError("User already exists");
  }

  const hashedPassword = await TokenUtils.hashedFunction(data.password);
  const user = await AuthRepository.createUser({
    name: data.name,
    email: data.email,
    hashedPassword,
  });

  const tempRefreshToken = await AuthRepository.createRefreshToken(user.id);
  const accessToken = TokenUtils.generateAccessToken(user.id);
  const refreshToken = TokenUtils.generateRefreshToken(
    user.id,
    tempRefreshToken.id,
  );
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await AuthRepository.updateRefreshToken(
    tempRefreshToken.id,
    hashedRefreshToken,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const loginService = async (data: { email: string; password: string }) => {
  const user = await AuthRepository.findUserByEmail(data.email);

  if (!user) {
    throw new UnauthorizedError("Invalid user or password");
  }

  const isPasswordValid = await TokenUtils.compareFunction(
    data.password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tempRefreshToken = await AuthRepository.createRefreshToken(user.id);
  const accessToken = TokenUtils.generateAccessToken(user.id);
  const refreshToken = TokenUtils.generateRefreshToken(
    user.id,
    tempRefreshToken.id,
  );
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await AuthRepository.updateRefreshToken(
    tempRefreshToken.id,
    hashedRefreshToken,
  );

  return {
    accessToken,
    refreshToken,
  };
};


const logoutService = async (token: string) => {
  const decoded = TokenUtils.verifyRefreshToken(token);
  const storedToken = await AuthRepository.findRefreshToken(decoded.tokenId);
  if (!storedToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }
  const isValidToken = await TokenUtils.compareFunction(
    token,
    storedToken.token,
  );
  if (!isValidToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }
  await AuthRepository.deleteRefreshToken(storedToken.id);
};


const refreshTokenService = async (token: string) => {
  const decoded = TokenUtils.verifyRefreshToken(token);

  const storedToken = await AuthRepository.findRefreshToken(decoded.tokenId);

  if (!storedToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (storedToken.userId !== decoded.id) {
    throw new UnauthorizedError("Token mismatch");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  const isValidToken = await TokenUtils.compareFunction(
    token,
    storedToken.token,
  );

  if (!isValidToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  await AuthRepository.deleteRefreshToken(storedToken.id);
  const tempRefreshToken = await AuthRepository.createRefreshToken(decoded.id);
  const accessToken = TokenUtils.generateAccessToken(decoded.id);
  const refreshToken = TokenUtils.generateRefreshToken(
    decoded.id,
    tempRefreshToken.id,
  );
  const hashedRefreshToken = await TokenUtils.hashedFunction(refreshToken);
  await AuthRepository.updateRefreshToken(
    tempRefreshToken.id,
    hashedRefreshToken,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  registerService,
  loginService,
  logoutService,
  refreshTokenService
}