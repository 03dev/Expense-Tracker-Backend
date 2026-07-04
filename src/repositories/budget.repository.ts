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
    const dateFilter =
      filter.month !== undefined && filter.year !== undefined
        ? {
            gte: new Date(filter.year, filter.month - 1, 1),
            lt: new Date(filter.year, filter.month, 1),
          }
        : undefined;

    const [budgets, spentByCategory] = await Promise.all([
      this.delegate.findMany({
        where: this.baseWhere(userId, {
          month: filter.month,
          year: filter.year,
        }),
        select: budgetSelect,
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
          userId,
          type: "EXPENSE",
          deletedAt: null,
          ...(dateFilter && { date: dateFilter }),
        },
        _sum: { amount: true },
      }),
    ]);

    const spentMap = new Map(
      spentByCategory.map((s) => [s.categoryId, Number(s._sum.amount ?? 0)]),
    );

    const enriched = budgets.map((budget) => {
      const spent = spentMap.get(budget.categoryId) ?? 0;
      return {
        ...budget,
        spent,
        remaining: Number(budget.amount) - spent,
      };
    });

    return { budgets: enriched, total: enriched.length };
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

  async getBudgetHistory(userId: string) {
    const budgets = await this.delegate.findMany({
      where: { userId, deletedAt: null },
      select: {
        month: true,
        year: true,
      },
      distinct: ["month", "year"],
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return budgets;
  }
}

export const budgetRepository = new BudgetRepository();
