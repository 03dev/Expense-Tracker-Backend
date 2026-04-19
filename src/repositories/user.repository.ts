import { prisma } from "../config/prisma"

const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    avatarUrl: true,
    createdAt: true,
    updatedAt: true
} as const;

const getUserWithPassword = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            password: true
        }
    });
}

const findUserById = async (userId: string) => {
    return prisma.user.findUnique({
        where: {
            id: userId
        },
        select: publicUserSelect
    });
}

const updateProfile = async (userId: string, name: string) => {
    return prisma.user.update({
        where: {
            id: userId
        },
        data: {
            name
        },
        select: publicUserSelect
    });
}

const updateAvatar = async (userId: string, avatarUrl: string) => {
    return prisma.user.update({
        where: {
            id: userId
        },
        data: {
            avatarUrl
        },
        select: publicUserSelect
    });
}

const updatePassword = async (userId: string, hashedPassword: string) => {
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            password: hashedPassword
        }
    });
}

export const UserRepository = {
    getUserWithPassword,
    findUserById,
    updateProfile,
    updateAvatar,
    updatePassword
}