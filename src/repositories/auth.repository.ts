import { prisma } from "../config/prisma";

class AuthRepository {
  async createUser(data: {
    name: string;
    email: string;
    hashedPassword: string;
  }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        avatarUrl: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
      },
    });
  }

  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
      },
    });
  }

  async updateUser(
    userId: string,
    data: Partial<{
      isEmailVerified: boolean;
      isTwoFactorEnabled: boolean;
      avatarUrl: string;
    }>,
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isEmailVerified: true,
        isTwoFactorEnabled: true,
      },
    });
  }
}

export const authRepository = new AuthRepository();
