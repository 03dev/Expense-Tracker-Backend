import { z } from "zod";

export const createCategorySchema = z.object({
    name: z
    .string()
    .min(1, "Category can't be empty")
    .trim(),
    parentId: z
    .string()
    .optional(),
    icon: z
    .string()
    .min(1)
    .max(50)
    .optional()
}).strict();

export const updateCategorySchema = z.object({
    name: z
    .string()
    .trim()
    .optional(),
    icon: z
    .string()
    .min(1)
    .max(50)
    .optional()
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided"}
);

export const categoryIdSchema = z.object({
    id: z
    .string()
    .uuid("Invalid category ID")
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdInput = z.infer<typeof categoryIdSchema>;