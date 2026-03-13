import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"]),
  note: z
    .string()
    .max(500, "Note cannot exceed 500 characters")
    .optional(),
  receiptUrl: z
    .string()
    .url("Receipt must be a valid URL")
    .optional(),
  date: z
    .string()
    .datetime("Invalid date format"),
  categoryId: z
    .string()
    .uuid("Invalid category ID"),
}).strict();

export const transactionQuerySchema = z.object({
    page: z
        .coerce
        .number()
        .int()
        .positive()
        .min(1)
        .default(1),
    limit: z
        .coerce
        .number()
        .int()
        .positive()
        .min(1)
        .max(50)
        .default(10),
    sortOrder: z
        .enum(["asc", "desc"])
        .default("desc"),

    // filters
    type: z
        .enum(["INCOME", "EXPENSE"])
        .optional(),
    categoryId: z
        .string()
        .uuid("Invalid category ID")
        .optional(),
    startDate: z
        .string()
        .datetime("Invalid date format")
        .optional(),
    endDate: z
        .string()
        .datetime("Invalid date format")
        .optional(),
});

export const updateTransactionSchema = z.object({
    amount: z
        .number()
        .positive("Amount must be greater than 0")
        .optional(),
    type: z.enum(["INCOME", "EXPENSE"])
        .optional(),
    note: z
        .string()
        .max(500, "Note cannot exceed 500 characters")
        .optional(),
    receiptUrl: z
        .string()
        .url("Receipt must be a valid URL")
        .optional(),
    date: z
        .string()
        .datetime("Invalid date format")
        .optional(),
    categoryId: z
        .string()
        .uuid("Invalid category ID")
        .optional(),
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
);

export const transactionIdSchema = z.object({
    id: z
    .string()
    .uuid("Invalid transaction ID")
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQueryParams = z.infer<typeof transactionQuerySchema>;
export type TransactionIdInput = z.infer<typeof transactionIdSchema>;