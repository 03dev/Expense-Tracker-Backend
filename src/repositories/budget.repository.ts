import { prisma } from "../config/prisma"
import { GetBudgetsInput, UpdateBudgetInput } from "../validators/budget.validator";

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
            name: true
        }
    }
} as const;

const createBudget = async (userId: string, data: {amount: number, month: number, year: number, categoryId: string, icon?: string}) => {
    return prisma.budget.create({
        data: {
            amount: data.amount,
            month: data.month,
            year: data.year,
            categoryId: data.categoryId,
            userId,
            icon: data.icon
        },
        select: budgetSelect
    });
}

const getBudgets = async (userId: string, filter: GetBudgetsInput) => {
    const where = {
        userId,
        month: filter.month,
        year: filter.year,
        deletedAt: null
    };
    
    const [budgets, total] = await prisma.$transaction([
        prisma.budget.findMany({
            where,
            select: budgetSelect,
            orderBy: {
                createdAt: "asc"
            }
        }),
        prisma.budget.count({where})
    ]);

    return { budgets, total };
}

const getBudgetById = async (id: string, userId: string) => {
    return prisma.budget.findFirst({
        where: {
            id,
            userId,
            deletedAt: null
        },
        select: budgetSelect
    });
}

const updateBudget = async (id: string, userId: string, data: {amount?: number; icon?: string}) => {
    return prisma.budget.update({
        where: {
            id,
            userId
        },
        data: {
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.icon !== undefined && { icon: data.icon})
        },
        select: budgetSelect
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
    },
    select: {
        id: true,
        amount: true
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