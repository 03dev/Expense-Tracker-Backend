// src/repositories/transaction.repository.ts
import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { TransactionQueryParams } from "../validators/transaction.validator";

const createTransaction = async (data: {
  amount: number;
  type: TransactionType;
  note?: string;
  receiptUrl?: string;
  merchant?: string;
  location?: string;
  isRecurring?: boolean;
  tags?: string[];
  date: Date;
  userId: string;
  categoryId: string;
}) => {
  return prisma.transaction.create({
    data: {
      amount: data.amount,
      type: data.type,
      note: data.note,
      receiptUrl: data.receiptUrl,
      merchant: data.merchant,
      location: data.location,
      isRecurring: data.isRecurring ?? false,
      tags: data.tags ?? [],
      date: data.date,
      userId: data.userId,
      categoryId: data.categoryId,
    }
  });
}

const getTransactions = async (userId: string, filters: TransactionQueryParams) => {
  const tagsArray = filters.tags?.split(',').filter(Boolean) ?? [];

  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(filters.type && { type: filters.type }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.merchant && { merchant: { contains: filters.merchant, mode: 'insensitive' } }),
    ...(filters.isRecurring !== undefined && { isRecurring: filters.isRecurring }),
    ...(tagsArray.length > 0 && { tags: { hasSome: tagsArray } }),
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
      select: {
        id: true,
        amount: true,
        type: true,
        date: true,
        note: true,
        merchant: true,
        location: true,
        isRecurring: true,
        tags: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit)
  };
};

const getTransactionById = async (transactionId: string, userId: string) => {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
      deletedAt: null
    },
    select: {
      id: true,
      amount: true,
      type: true,
      date: true,
      note: true,
      receiptUrl: true,
      merchant: true,
      location: true,
      isRecurring: true,
      tags: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

const updateTransaction = async (data: {
  id: string;
  userId: string;
  amount?: number;
  type?: TransactionType;
  note?: string;
  receiptUrl?: string;
  merchant?: string;
  location?: string;
  isRecurring?: boolean;
  tags?: string[];
  date?: Date;
  categoryId?: string;
}) => {
  return prisma.transaction.update({
    where: {
      id: data.id,
      userId: data.userId,
    },
    data: {
      amount: data.amount,
      type: data.type,
      note: data.note,
      receiptUrl: data.receiptUrl,
      merchant: data.merchant,
      location: data.location,
      isRecurring: data.isRecurring,
      tags: data.tags,
      date: data.date,
      categoryId: data.categoryId,
    },
    select: {
      id: true,
      amount: true,
      type: true,
      date: true,
      note: true,
      merchant: true,
      categoryId: true
    }
  });
}

const deleteTransaction = async (data: { id: string; userId: string }) => {
  return prisma.transaction.update({
    where: {
      id: data.id,
      userId: data.userId,
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