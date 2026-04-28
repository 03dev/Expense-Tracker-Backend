import { prisma } from "../config/prisma";
import { BaseRepository } from "./baseRepository";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validator";

const categorySelect = {
  id: true,
  name: true,
  icon: true,
  parentId: true,
  userId: true,
} as const;
class CategoryRepository extends BaseRepository<typeof prisma.category> {
  constructor() {
    super(prisma.category);
  }

  async createCategory(userId: string, data: CreateCategoryInput) {
    return this.delegate.create({
      data: {
        ...data,
        userId,
      },
      select: categorySelect,
    });
  }

  async getCategories(userId: string) {
    return this.delegate.findMany({
      where: this.baseWhere(userId),
      select: {
        ...categorySelect,
        _count: {
          select: {
            transactions: {
              where: {
                deletedAt: null, // don't count soft deleted transactions
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async getCategoryById(id: string, userId: string) {
    return this.delegate.findFirst({
      where: this.baseWhere(userId, { id }),
      select: {
        ...categorySelect,
        children: {
          where: {
            deletedAt: null,
          },
          select: categorySelect,
        },
      },
    });
  }

  async updateCategory(id: string, userId: string, data: UpdateCategoryInput) {
    return this.delegate.update({
      where: {
        id_userId: {
          id,
          userId,
        },
      },
      data,
      select: categorySelect,
    });
  }

  async deleteCategory(id: string, userId: string) {
    await this.softDelete(userId, id);
    return { id };
  }

  async findDeletedCategoryByName(userId: string, name: string) {
    return this.delegate.findFirst({
      where: {
        userId,
        name,
        deletedAt: { not: null },
      },
    });
  }

  async restoreCategory(id: string, userId: string, data: { name?: string; icon?: string; parentId?: string | null }) {
    return this.delegate.update({
      where: { id_userId: { id, userId } },
      data: {
        ...data,
        deletedAt: null,
      },
      select: categorySelect,
    });
  }
}

export const categoryRepository = new CategoryRepository();
