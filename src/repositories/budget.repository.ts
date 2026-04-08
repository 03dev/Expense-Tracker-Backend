import { prisma } from "../config/prisma"
import { GetBudgetsInput, UpdateBudgetInput } from "../validators/budget.validator";

const createBudget = async (userId: string, data: {amount: number, month: number, year: number, categoryId: string}) => {
    return prisma.budget.create({
        data: {
            amount: data.amount,
            month: data.month,
            year: data.year,
            categoryId: data.categoryId,
            userId
        },
        include: {
            category: true
        }
    });
}

const getBudgets = async (userId: string, filter: GetBudgetsInput) => {
    const budgets = await prisma.budget.findMany({
        where: {
            userId,
            month: filter.month,
            year: filter.year,
            deletedAt: null
        },
        include: {
            category: true
        }
    });

    return {
        budgets,
        total: budgets.length
    }
}

const getBudgetById = async (id: string, userId: string) => {
    return prisma.budget.findFirst({
        where: {
            id,
            userId,
            deletedAt: null
        },
        include: {
            category: true
        }
    });
}

const updateBudget = async (id: string, userId: string, data: UpdateBudgetInput) => {
    return prisma.budget.update({
        where: {
            id,
            userId
        },
        data: {
            amount: data.amount
        }
    });
}

const deleteBudget = async (id: string, userId: string) => {
    await prisma.budget.update({
        where: {
            id,
            userId
        },
        data: {
            deletedAt: new Date()
        }
    });
}

const findExistingBudget = async (userId: string, categoryId: string, month: number, year: number) => {
  return prisma.budget.findFirst({
    where: {
      userId,
      categoryId,
      month,
      year,
      deletedAt: null
    }
  });
}

export const BudgetRepository = {
    createBudget,
    getBudgets,
    getBudgetById,
    updateBudget,
    deleteBudget,
    findExistingBudget
}