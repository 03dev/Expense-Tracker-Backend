import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createTransactionSchema, transactionIdSchema, transactionQuerySchema, updateTransactionSchema } from "../validators/transaction.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { TransactionController } from "../controllers/transaction.controller";

const router = Router();

router.post('/', authMiddleware, validate({body: createTransactionSchema}), asyncHandler(TransactionController.createTransaction));

router.get('/', authMiddleware, validate({query: transactionQuerySchema}),asyncHandler(TransactionController.getTransactions));

router.get("/:id", authMiddleware, validate({params: transactionIdSchema}), asyncHandler(TransactionController.getTransactionById));

router.patch("/:id", authMiddleware, validate({params: transactionIdSchema, body: updateTransactionSchema}), asyncHandler(TransactionController.updateTransaction));

router.delete("/:id", authMiddleware, validate({params: transactionIdSchema}), asyncHandler(TransactionController.deleteTransaction));

export default router;
