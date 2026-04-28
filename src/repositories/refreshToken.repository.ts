import { prisma } from "../config/prisma";
import { env } from "../config/env";

function parseExpiryMs(expiry: string): number {
  const value = parseInt(expiry, 10);
  const unit = expiry.slice(-1) as "s" | "m" | "h" | "d";
  const unitMs: Record<"s" | "m" | "h" | "d", number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * unitMs[unit];
}

class RefreshTokenRepository {
  async createRefreshToken(
    userId: string,
    hashedToken: string,
    tokenId: string,
  ) {
    return prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: hashedToken,
        userId,
        expiresAt: new Date(Date.now() + parseExpiryMs(env.REFRESH_TOKEN_EXPIRES_IN)),
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
      },
    });
  }

  async findRefreshToken(tokenId: string) {
    return prisma.refreshToken.findUnique({
      where: { id: tokenId },
      select: {
        id: true,
        token: true,
        userId: true,
        expiresAt: true,
      },
    });
  }

  async deleteRefreshToken(tokenId: string) {
    return prisma.refreshToken.delete({
      where: { id: tokenId },
    });
  }

  async deleteAllRefreshTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
