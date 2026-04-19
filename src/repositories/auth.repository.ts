import { prisma } from "../config/prisma"

const createUser = async (data: {name: string, email: string, hashedPassword: string}) => {
    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.hashedPassword
        }
    })
}

const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: {
            email: email
        },
        select: {
            id: true,
            email: true,
            password:  true, // only when needed for auth
            name: true
        }
    })
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
            createdAt: true
        }
    })
}

const createRefreshToken = async (userId: string) => {
    return prisma.refreshToken.create({
        data: {
            token: "temp",
            userId,
            expiresAt: new Date(Date.now() + 7*24*60*60*1000)
        }
    })
}

const updateRefreshToken = async (tokenId: string, hashedtoken: string) => {
    return prisma.refreshToken.update({
        where: {
            id: tokenId
        },
        data: {
            token: hashedtoken
        }
    })
}

const findRefreshToken = async (tokenId: string) => {
    return prisma.refreshToken.findUnique({
        where: {
            id: tokenId
        }
    })
}

const deleteRefreshToken = (tokenId: string) => {
    return prisma.refreshToken.delete({
        where: {
            id: tokenId
        }
    })
}

const deleteAllRefreshTokens = async (userId: string) => {
    return prisma.refreshToken.deleteMany({
        where: {
            userId
        }
    })
}

export const AuthRepository = {
  createUser,
  findUserByEmail,
  createRefreshToken,
  updateRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
}