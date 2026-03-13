import { Prisma, TransactionType } from "../generated/prisma"
import { prisma } from "../config/prisma"
import { TransactionQueryParams } from "../validators/transaction.validator"

const createTransaction = async (data: {amount: number, type: TransactionType, note?: string, receiptUrl?: string, date: Date, userId: string, categoryId: string}) => {
    return prisma.transaction.create({
        data: {
            amount: data.amount,
            type: data.type,
            note: data.note,
            receiptUrl: data.receiptUrl,
            date: data.date,
            userId: data.userId,
            categoryId: data.categoryId
        }
    })
}

const getTransactions = async (userId: string, filters: TransactionQueryParams) => {
  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(filters.type && { type: filters.type }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.startDate && { date: { gte: new Date(filters.startDate) } }),
    ...(filters.endDate && { date: { lte: new Date(filters.endDate) } }),
  };

  const skip = (filters.page - 1) * filters.limit;

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: { date: filters.sortOrder },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) };
};

const getTransactionById = async (transactionId: string, userId: string) => {
    return prisma.transaction.findFirst({
        where: {
            id: transactionId,
            userId,
            deletedAt: null
        }
    })
}

const updateTransaction = async (data: {amount?: number, type?: TransactionType, note?: string, receiptUrl?: string, date?: Date, categoryId?: string, id: string, userId: string}) => {
    return prisma.transaction.update({
        where: {
            id: data.id,
            userId: data.userId
        },
        data: {
            amount: data.amount,
            type: data.type,
            note: data.note,
            receiptUrl: data.receiptUrl,
            date: data.date,
            categoryId: data.categoryId
        }
    });
}

const deleteTransaction = async (data: {id: string, userId: string}) => {
    return prisma.transaction.update({
        where: {
            id: data.id,
            userId: data.userId
        },
        data: {
            deletedAt: new Date()
        }
    });
}

export const TransactionRepository = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
}