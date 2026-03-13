import { NotFoundError } from "../errors/NotFoundError";
import { CategoryRepository } from "../repositories/category.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { TransactionQueryParams, CreateTransactionInput, UpdateTransactionInput } from "../validators/transaction.validator";

const createTransactionService = async (userId: string, data: CreateTransactionInput) => {
    const category = await CategoryRepository.getCategoryById(data.categoryId, userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    return TransactionRepository.createTransaction({
        ...data,
        date: new Date(data.date),
        userId
    });
}

const getTransactionsService = async (userId: string, filters: TransactionQueryParams) => {
  return TransactionRepository.getTransactions(userId, filters);
}

const getTransactionByIdService = async (id: string, userId: string) => {
    const transaction = await TransactionRepository.getTransactionById(id, userId);

    if(!transaction) {
        throw new NotFoundError("No transaction found");
    }

    return transaction;
}

const updateTransactionService = async (id: string, userId: string, data: UpdateTransactionInput) => {
  const transaction = await TransactionRepository.getTransactionById(id, userId);
  if (!transaction) {
    throw new NotFoundError("No transaction found");
  }

  if (data.categoryId) {
    const category = await CategoryRepository.getCategoryById(data.categoryId, userId);
    if (!category) {
      throw new NotFoundError("No category found");
    }
  }

  return TransactionRepository.updateTransaction({
    ...data,
    date: data.date ? new Date(data.date) : undefined,
    id,
    userId
  });
}

const deleteTransactionService = async (id: string, userId: string) => {
    const transaction = await TransactionRepository.getTransactionById(id, userId);

    if(!transaction) {
        throw new NotFoundError("No transaction found");
    }

    await TransactionRepository.deleteTransaction({id, userId});
}

export const TransactionService = {
    createTransactionService,
    getTransactionsService,
    getTransactionByIdService,
    updateTransactionService,
    deleteTransactionService
}