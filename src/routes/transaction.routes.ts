import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createTransactionSchema, parseMessageSchema, transactionIdSchema, transactionQuerySchema, updateTransactionSchema } from "../validators/transaction.validator";
import { asyncHandler } from "../utils/asyncHandler";
import { TransactionController } from "../controllers/transaction.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post('/test', (req, res) => {
  res.json({ message: "router works" });
});

router.post('/parse-message', authMiddleware, validate({body: parseMessageSchema}), asyncHandler(TransactionController.parseMessageAndSave));

router.post('/', authMiddleware, upload.single("receipt"), validate({body: createTransactionSchema}), asyncHandler(TransactionController.createTransaction));

router.get('/', authMiddleware, validate({query: transactionQuerySchema}),asyncHandler(TransactionController.getTransactions));

router.get("/:id", authMiddleware, validate({params: transactionIdSchema}), asyncHandler(TransactionController.getTransactionById));

router.patch("/:id", authMiddleware, validate({params: transactionIdSchema, body: updateTransactionSchema}), asyncHandler(TransactionController.updateTransaction));

router.delete("/:id", authMiddleware, validate({params: transactionIdSchema}), asyncHandler(TransactionController.deleteTransaction));

router.delete("/:id/receipt", authMiddleware, validate({params: transactionIdSchema}), asyncHandler(TransactionController.deleteReceipt));

export default router;
