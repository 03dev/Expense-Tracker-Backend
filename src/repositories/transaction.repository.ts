// src/repositories/transaction.repository.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  TransactionQueryParams,
  CreateTransactionInput,
  UpdateTransactionInput,
} from "../validators/transaction.validator";
import { BaseRepository } from "./baseRepository";

const transactionSelect = {
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
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

class TransactionRepository extends BaseRepository<typeof prisma.transaction> {
  constructor() {
    super(prisma.transaction);
  }

  async createTransaction(userId: string, data: CreateTransactionInput) {
    return this.delegate.create({
      data: {
        ...data,
        userId,
      },
      select: transactionSelect,
    });
  }

  async getTransactions(userId: string, filters: TransactionQueryParams) {
    const tagsArray = filters.tags?.split(",").filter(Boolean) ?? [];

    const where: Prisma.TransactionWhereInput = {
      ...this.baseWhere(userId),
      ...(filters.type && { type: filters.type }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.merchant && {
        merchant: { contains: filters.merchant, mode: "insensitive" },
      }),
      ...(filters.isRecurring !== undefined && {
        isRecurring: filters.isRecurring,
      }),
      ...(tagsArray.length > 0 && { tags: { hasSome: tagsArray } }),
      ...((filters.startDate || filters.endDate) && {
        date: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) }),
        },
      }),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [transactions, total] = await Promise.all([
      this.delegate.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: filters.sortOrder },
        select: transactionSelect,
      }),
      this.delegate.count({ where }),
    ]);

    return {
      transactions,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async getTransactionById(transactionId: string, userId: string) {
    return this.delegate.findFirst({
      where: this.baseWhere(userId, { id: transactionId }),
      select: transactionSelect,
    });
  }

  async updateTransaction(
    id: string,
    userId: string,
    data: UpdateTransactionInput,
  ) {
    return this.delegate.update({
      where: {
        id_userId: {
          id,
          userId,
        },
      },
      data,
      select: transactionSelect,
    });
  }

  async clearReceiptUrl(id: string, userId: string) {
    return this.delegate.update({
      where: { id_userId: { id, userId } },
      data: { receiptUrl: null },
      select: transactionSelect,
    });
  }

  async deleteTransaction(id: string, userId: string) {
    await this.softDelete(userId, id);
    return { id };
  }

  async sumExpensesByCategory(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.delegate.aggregate({
      _sum: { amount: true },
      where: this.baseWhere(userId, {
        type: "EXPENSE",
        categoryId,
        date: { gte: startDate, lt: endDate },
      }),
    });
    return Number(result._sum.amount ?? 0);
  }
}

export const transactionRepository = new TransactionRepository();
