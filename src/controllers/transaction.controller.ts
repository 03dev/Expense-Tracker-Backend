import { Response } from "express"
import { AuthenticatedRequest } from "../types/request.types"
import { getBody, getParams, getQuery } from "../utils/getValidated"
import { CreateTransactionInput, TransactionIdInput, TransactionQueryParams, UpdateTransactionInput } from "../validators/transaction.validator"
import { TransactionService } from "../services/transaction.service"
import { BadRequestError } from "../errors/BadRequestError"


const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
    const body = getBody<CreateTransactionInput>(req);
    const transaction = await TransactionService.createTransactionService(req.user.id, body, req.file?.buffer);

    return res.status(201).json({
        success: true,
        message: "Transaction created successfully",
        data: transaction
    });
}

const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
    const queryParams = getQuery<TransactionQueryParams>(req);
    const transactions = await TransactionService.getTransactionsService(req.user.id, queryParams);

    return res.status(200).json({
        success: true,
        message: "Transactions are fetched successfully",
        data: transactions
    });
}

const getTransactionById = async (req: AuthenticatedRequest, res: Response) => {
    const param = getParams<TransactionIdInput>(req);
    const transaction = await TransactionService.getTransactionByIdService(param.id, req.user.id);

    return res.status(200).json({
        success: true,
        message: "Transaction fetched successfully",
        data: transaction
    });
}

const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
    const param = getParams<TransactionIdInput>(req);
    const body = getBody<UpdateTransactionInput>(req);
    const transaction = await TransactionService.updateTransactionService(param.id, req.user.id, body);

    return res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: transaction
    });
}

const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
    const param = getParams<TransactionIdInput>(req);
    await TransactionService.deleteTransactionService(param.id, req.user.id);

    return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully"
    });
}

const deleteReceipt = async (req: AuthenticatedRequest, res: Response) => {
    const param = getParams<TransactionIdInput>(req);
    const transaction = await TransactionService.deleteReceiptService(param.id, req.user.id);
    return res.status(200).json({
        success: true,
        message: "Receipt deleted successfully",
        data: transaction
    });
}

const parseMessageAndSave = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message) {
    throw new BadRequestError("Message is required");
  }

  const transaction = await TransactionService.parseMessageAndSaveService(
    userId,
    message
  );

  res.status(201).json({
    success: true,
    message: "Transaction saved from message",
    data: transaction,
  });
};

export const TransactionController = {
    createTransaction,
    getTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    deleteReceipt,
    parseMessageAndSave,
}