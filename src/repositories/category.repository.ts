import { prisma } from "../config/prisma"

const categorySelect = {
  id: true,
  name: true,
  icon: true,
  parentId: true,
  userId: true
} as const;

const createCategory = async (userId: string, data: { name: string; parentId?: string; icon?: string }) => {
  return prisma.category.create({
    data: {
      name: data.name,
      userId,
      parentId: data.parentId,
      icon: data.icon
    },
    select: categorySelect
  })
}

const getCategories = async (userId: string) => {
  return prisma.category.findMany({
    where: {
      userId,
      deletedAt: null
    },
    select: {
      ...categorySelect,
      _count: {
        select: {
          transactions: {
            where: {
              deletedAt: null  // don't count soft deleted transactions
            }
          }
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
}

const getCategoryById = async (uuid: string, userId: string) => {
    return prisma.category.findFirst({
      where: {
        id: uuid,
        userId,
        deletedAt: null // exclude soft deleted
      },
      select: {
        ...categorySelect,
        children: {
          where: {
            deletedAt: null
          },
          select: categorySelect
        }
      }
    })
}

const updateCategory = async (uuid: string, userId: string, data: {name?: string; icon?: string}) => {
  return prisma.category.update({
    where:{
      id: uuid,
      userId,
      deletedAt: null // exculde soft deleted
    },
    data: {
      ...(data.name && { name: data.name}),
      ...(data.icon !== undefined && { icon: data.icon})
    },
    select: categorySelect
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

const findCategoryByUserIdAndName = async (userId: string, name: string) => {
  return prisma.category.findFirst({
    where: {
      userId,
      name,
      deletedAt: { not: null }
    }
  })
}

const restoreCategory = async (id: string, data: { name?: string; icon?: string }) => {
  return prisma.category.update({
    where: { id },
    data: {
      ...data,
      deletedAt: null
    }
  })
}

export const CategoryRepository = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  findCategoryByUserIdAndName,
  restoreCategory
}