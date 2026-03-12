import { prisma } from "../config/prisma"

const createCategory = async (data: { name: string; userId: string; parentId?: string }) => {
  return prisma.category.create({
    data: {
      name: data.name,
      userId: data.userId,
      parentId: data.parentId
    }
  })
}

const getCategories = async (userId: string) => {
  return prisma.category.findMany({
    where: {
      userId,
      deletedAt: null  // exclude soft deleted
    }
  })
}

const getCategoryById = async (uuid: string, userId: string) => {
    return prisma.category.findFirst({
      where: {
        id: uuid,
        userId,
        deletedAt: null // exclude soft deleted
      },
      include: {
        children: true // include subcategories
      }
    })
}

const updateCategory = async (uuid: string, userId: string, updatedName: string) => {
  return prisma.category.update({
    where:{
      id: uuid,
      userId,
      deletedAt: null // exculde soft deleted
    },
    data: {
      name: updatedName
    }
  })
}

const deleteCategory = async (uuid: string, userId: string) => {
  return prisma.category.update({
    where:{
      id: uuid,
      userId
    },
    data: {
      deletedAt: new Date()
    }
  })
}

export const CategoryRepository = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
}