import { prisma } from "../config/prisma";
import {
  CreateBudgetInput,
  GetBudgetsInput,
  UpdateBudgetInput,
} from "../validators/budget.validator";
import { BaseRepository } from "./baseRepository";

const budgetSelect = {
  id: true,
  amount: true,
  icon: true,
  month: true,
  year: true,
  categoryId: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

class BudgetRepository extends BaseRepository<typeof prisma.budget> {
  constructor() {
    super(prisma.budget);
  }

  async createBudget(userId: string, data: CreateBudgetInput) {
    return this.delegate.create({
      data: {
        ...data,
        userId,
      },
      select: budgetSelect,
    });
  }

  async getBudgets(userId: string, filter: GetBudgetsInput) {
    const budgets = await this.delegate.findMany({
      where: this.baseWhere(userId, {
        month: filter.month,
        year: filter.year,
      }),
      select: budgetSelect,
      orderBy: { createdAt: "asc" },
    });

    return { budgets, total: budgets.length };
  }

  async getBudgetById(id: string, userId: string) {
    return this.delegate.findFirst({
      where: this.baseWhere(userId, { id }),
      select: budgetSelect,
    });
  }

  async updateBudget(id: string, userId: string, data: UpdateBudgetInput) {
    return this.delegate.update({
      where: {
        id_userId: {
          id,
          userId,
        },
      },
      data,
      select: budgetSelect,
    });
  }

  async deleteBudget(id: string, userId: string) {
    await this.softDelete(userId, id);
    return { id };
  }

  async findExistingBudget(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
  ) {
    return this.delegate.findFirst({
      where: this.baseWhere(userId, { categoryId, month, year }),
      select: {
        id: true,
        amount: true,
      },
    });
  }

  async findDeletedBudget(userId: string, data: CreateBudgetInput) {
    return this.delegate.findFirst({
      where: {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
        deletedAt: { not: null },
      },
    });
  }

  async restoreBudget(id: string, userId: string, data: CreateBudgetInput) {
    const { amount, icon, month, year, categoryId } = data;
    return this.delegate.update({
      where: { id_userId: { id, userId } },
      data: { amount, icon, month, year, categoryId, deletedAt: null },
      select: budgetSelect,
    });
  }
}

export const budgetRepository = new BudgetRepository();
