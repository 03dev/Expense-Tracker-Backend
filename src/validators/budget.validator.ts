import { string, z } from "zod";

export const createBudgetSchema = z.object({
    amount: z
    .number()
    .positive("Amount must be greater than 0"),
    month: z
    .number()
    .min(1)
    .max(12),
    year: z
    .number()
    .min(2000)
    .max(2100),
    categoryId: z
    .string()
    .uuid("Invalid category ID"),
    icon: z
    .string()
    .min(1)
    .max(50)
    .optional()
}).strict();

export const updateBudgetSchema = z.object({
  amount: z
  .number()
  .positive("Amount must be greater than 0")
  .optional(),
  icon: z
  .string()
  .min(1)
  .max(50)
  .optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const budgetIdSchema = z.object({
    id: z
    .string()
    .uuid("Invalid buget ID")
})

export const getBudgetsSchema = z.object({
    month: z
    .coerce
    .number()
    .min(1)
    .max(12)
    .optional(),
    year: z
    .coerce
    .number()
    .min(2000)
    .max(2100)
    .optional()
}).strict().refine(
  (data) => {
    if (data.month !== undefined || data.year !== undefined) {
      return data.month !== undefined && data.year !== undefined;
    }
    return true;
  },
  { message: "month and year must both be provided together"}
);


export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type GetBudgetsInput = z.infer<typeof getBudgetsSchema>;
export type BudgetIdInput = z.infer<typeof budgetIdSchema>;