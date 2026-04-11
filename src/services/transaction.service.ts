import { NotFoundError } from "../errors/NotFoundError";
import { CategoryRepository } from "../repositories/category.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { NotificationType } from "@prisma/client";
import { TransactionQueryParams, CreateTransactionInput, UpdateTransactionInput } from "../validators/transaction.validator";
import { BudgetRepository } from "../repositories/budget.repository";
import { logger } from "../utils/logger";

const createTransactionService = async (userId: string, data: CreateTransactionInput) => {
    const category = await CategoryRepository.getCategoryById(data.categoryId, userId);

    if(!category) {
        throw new NotFoundError("Category not found");
    }

    const transaction = await TransactionRepository.createTransaction({
        ...data,
        date: new Date(data.date),
        userId
    });

    // create notification
    await NotificationRepository.createNotification({
    title: "Transaction Added",
    message: `${data.type === 'INCOME' ? '💰' : '💸'} ${data.type} of ₹${data.amount} ${data.merchant ? `at ${data.merchant}` : ''} recorded successfully`,
    type: NotificationType.TRANSACTION_CREATED,
    userId
  });

  await checkBudgetAlert(userId, data.categoryId, new Date(data.date));
  logger.info(`Transaction created`, { userId, amount: data.amount, type: data.type });

  return transaction;
}

const checkBudgetAlert = async (userId: string, categoryId: string, date: Date) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // find budget for this category/month/year
  const budget = await BudgetRepository.findExistingBudget(userId, categoryId, month, year);
  if(!budget) return;

  // calculate total expense for this category this month
  const category = await CategoryRepository.getCategoryById(categoryId, userId);
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const transactions = await TransactionRepository.getTransactions(userId, {
    categoryId,
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString(),
    page: 1,
    limit: 1000,
    sortOrder: 'desc'
  });

  const totalSpent = transactions.transactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const budgetAmount = Number(budget.amount);
  const percentage = (totalSpent / budgetAmount) * 100;

  // 80% alert
  if (percentage >= 80 && percentage < 100) {
    await NotificationRepository.createNotification({
      title: "Budget Alert ⚠️",
      message: `You've used ${percentage.toFixed(0)}% of your ${category?.name} budget this month`,
      type: NotificationType.BUDGET_ALERT,
      userId
    });
  }

  // Exceeded alert
  if (percentage >= 100) {
    await NotificationRepository.createNotification({
      title: "Budget Exceeded 🚨",
      message: `You've exceeded your ${category?.name} budget by ₹${(totalSpent - budgetAmount).toFixed(2)}`,
      type: NotificationType.BUDGET_EXCEEDED,
      userId
    });
  }
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

    // create notification
    await NotificationRepository.createNotification({
      title: "Transaction Deleted",
      message: `Transaction of ${transaction.amount} has been deleted`,
      type: NotificationType.TRANSACTION_DELETED,
      userId
    });

    logger.info(`Transaction deleted`, { userId, transactionId: id })
}

export const TransactionService = {
    createTransactionService,
    getTransactionsService,
    getTransactionByIdService,
    updateTransactionService,
    deleteTransactionService
}