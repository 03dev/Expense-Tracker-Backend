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
      },
    });
  }
}

export const authRepository = new AuthRepository();
