import { prisma } from "../config/prisma";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

class UserRepository {
  async getUserWithPassword(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
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
      select: publicUserSelect,
    });
  }

  async findPublicUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  }

  async updateProfile(userId: string, name: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
      select: publicUserSelect,
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: publicUserSelect,
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true },
    });
  }
}

export const userRepository = new UserRepository();
