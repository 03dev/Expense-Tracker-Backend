import { env } from "../config/env";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError";

const hashedFunction = async (password: string) => {
    return bcrypt.hash(password, 10);
}

const compareFunction = async (password: string, hashedPassword: string) => {
    return bcrypt.compare(password, hashedPassword)
}

const generateAccessToken = (userId: string) => {
    return jwt.sign({ id: userId }, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN } as any);
}

const generateRefreshToken = (userId: string, tokenId: string) => {
    return jwt.sign({ id: userId, tokenId }, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN } as any)
}

const verifyRefreshToken = (token: string): { id: string; tokenId: string } => {
  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    return decoded as { id: string; tokenId: string };
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
}

export const TokenUtils = {
    hashedFunction,
    compareFunction,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
}