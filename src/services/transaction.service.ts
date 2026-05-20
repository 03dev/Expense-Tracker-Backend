import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { categoryRepository } from "../repositories/category.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { transactionRepository } from "../repositories/transaction.repository";
import { budgetRepository } from "../repositories/budget.repository";
import { NotificationType } from "@prisma/client";
import {
  TransactionQueryParams,
  CreateTransactionInput,
  UpdateTransactionInput,
} from "../validators/transaction.validator";
import { logger } from "../utils/logger";
import { deleteImage, uploadImage } from "../utils/cloudinary.utils";
import { parseTransactionMessage } from "./messageParser.service";
import { matchCategory } from "./categoryMatcher.service";

const createTransactionService = async (userId: string, data: CreateTransactionInput, receiptBuffer?: Buffer) => {
  const category = await categoryRepository.getCategoryById(data.categoryId, userId);
  if (!category) throw new NotFoundError("Category not found");

  let receiptUrl: string | undefined;
  if (receiptBuffer) {
    receiptUrl = await uploadImage(receiptBuffer, "receipts", undefined, [{ quality: "auto" }]);
  }

  const transaction = await transactionRepository.createTransaction(userId, {
    ...data,
    ...(receiptUrl && { receiptUrl }),
  });

  await notificationRepository.createNotification(userId, {
    title: "Transaction Added",
    message: `${data.type === "INCOME" ? "💰" : "💸"} ${data.type} of ₹${data.amount}${data.merchant ? ` at ${data.merchant}` : ""} recorded`,
    type: NotificationType.TRANSACTION_CREATED,
  });

  // Budget alerts only apply to expense transactions
  if (data.type === "EXPENSE") {
    await checkBudgetAlert(
      userId,
      data.categoryId,
      category.name,
      Number(data.amount),
      new Date(data.date),
    );
  }

  logger.info(`Transaction created`, { userId, amount: data.amount, type: data.type });
  return transaction;
};

const checkBudgetAlert = async (
  userId: string,
  categoryId: string,
  categoryName: string,
  transactionAmount: number,
  date: Date,
) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const budget = await budgetRepository.findExistingBudget(userId, categoryId, month, year);
  if (!budget) return;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 1); // exclusive upper bound

  const totalSpent = await transactionRepository.sumExpensesByCategory(
    userId,
    categoryId,
    startOfMonth,
    endOfMonth,
  );

  const budgetAmount = Number(budget.amount);
  const percentage = (totalSpent / budgetAmount) * 100;
  // Infer the spend just before this transaction to detect threshold crossings
  const previousPercentage = ((totalSpent - transactionAmount) / budgetAmount) * 100;

  // Only notify when the threshold is crossed for the first time, not on every transaction above it
  if (previousPercentage < 80 && percentage >= 80 && percentage < 100) {
    await notificationRepository.createNotification(userId, {
      title: "Budget Alert",
      message: `You've used ${percentage.toFixed(0)}% of your ${categoryName} budget this month`,
      type: NotificationType.BUDGET_ALERT,
    });
  }

  if (previousPercentage < 100 && percentage >= 100) {
    await notificationRepository.createNotification(userId, {
      title: "Budget Exceeded",
      message: `You've exceeded your ${categoryName} budget by ₹${(totalSpent - budgetAmount).toFixed(2)}`,
      type: NotificationType.BUDGET_EXCEEDED,
    });
  }
};

const getTransactionsService = async (userId: string, filters: TransactionQueryParams) => {
  return transactionRepository.getTransactions(userId, filters);
};

const getTransactionByIdService = async (id: string, userId: string) => {
  const transaction = await transactionRepository.getTransactionById(id, userId);
  if (!transaction) throw new NotFoundError("Transaction not found");
  return transaction;
};

const updateTransactionService = async (
  id: string,
  userId: string,
  data: UpdateTransactionInput,
) => {
  const transaction = await transactionRepository.getTransactionById(id, userId);
  if (!transaction) throw new NotFoundError("Transaction not found");

  if (data.categoryId) {
    const category = await categoryRepository.getCategoryById(data.categoryId, userId);
    if (!category) throw new NotFoundError("Category not found");
  }

  return transactionRepository.updateTransaction(id, userId, data);
};

const deleteTransactionService = async (id: string, userId: string) => {
  const transaction = await transactionRepository.getTransactionById(id, userId);
  if (!transaction) throw new NotFoundError("Transaction not found");

  await transactionRepository.deleteTransaction(id, userId);

  await notificationRepository.createNotification(userId, {
    title: "Transaction Deleted",
    message: `Transaction of ₹${transaction.amount} has been deleted`,
    type: NotificationType.TRANSACTION_DELETED,
  });

  logger.info(`Transaction deleted`, { userId, transactionId: id });
};

const deleteReceiptService = async (transactionId: string, userId: string) => {
  const transaction = await transactionRepository.getTransactionById(transactionId, userId);
  if (!transaction) throw new NotFoundError("Transaction not found");
  if (!transaction.receiptUrl) throw new BadRequestError("No receipt to delete");

  await deleteImage(transaction.receiptUrl);
  return transactionRepository.clearReceiptUrl(transactionId, userId);
};

const parseMessageAndSaveService = async (
  userId: string,
  message: string
) => {
  // Step 1 — parse message with Gemini
  const parsed = await parseTransactionMessage(message);

  // Step 2 — match category to real id
  const categoryId = await matchCategory(userId, parsed.suggestedCategory);

  // Step 3 — save transaction
  const transaction = await transactionRepository.createTransaction(userId, {
  amount: parsed.amount,
  type: parsed.type,
  merchant: parsed.merchant ?? undefined,
  date: new Date(parsed.date).toISOString(),  // ← fix here only
  note: parsed.note,
  categoryId,
  isRecurring: false,
  tags: [],
});

  // Step 4 — create notification
  await notificationRepository.createNotification(userId, {
    title: "Transaction Added",
    message: `${parsed.type === "INCOME" ? "💰" : "💸"} ${parsed.type} of ₹${parsed.amount}${parsed.merchant ? ` at ${parsed.merchant}` : ""} recorded`,
    type: NotificationType.TRANSACTION_CREATED,
  });

  return transaction;
};

export const TransactionService = {
  createTransactionService,
  getTransactionsService,
  getTransactionByIdService,
  updateTransactionService,
  deleteTransactionService,
  deleteReceiptService,
  parseMessageAndSaveService,
};
