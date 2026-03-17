import { prisma } from "../config/prisma"

const userDetails = async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId }
    });
}

const findUserById = async (userId: string) => {
    return prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            // password not included → never returned
        }
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
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            // password not included → never returned
        }
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
        select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
            // password not included → never returned
        }
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
    userDetails,
    findUserById,
    updateProfile,
    updateAvatar,
    updatePassword
}