import { prisma } from "../config/prisma";
import { VerificationType } from "@prisma/client";

class VerificationRepository {
  async createVerificationCode(userId: string, code: string, type: VerificationType) {
    // Delete any existing codes for this user and type first
    await prisma.verificationCode.deleteMany({
      where: { userId, type },
    });

    return prisma.verificationCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });
  }

  async findVerificationCode(userId: string, code: string, type: VerificationType) {
    return prisma.verificationCode.findFirst({
      where: {
        userId,
        code,
        type,
        expiresAt: { gt: new Date() }, // not expired
      },
    });
  }

  async deleteVerificationCode(id: string) {
    return prisma.verificationCode.delete({
      where: { id },
    });
  }
}

export const verificationRepository = new VerificationRepository();