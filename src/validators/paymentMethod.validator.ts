import { z } from 'zod';

export const createPaymentMethodSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required"),
    type: z
        .enum(["BANK", "CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "WALLET"]),
    lastFourDigits: z
        .string()
        .length(4)
        .optional(),
    isDefault: z
        .boolean()
        .optional()
        .default(false),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

export const paymentMethodIdSchema = z.object({
    id: z
        .string()
        .uuid(),
})

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMehodInput = z.infer<typeof updatePaymentMethodSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodIdSchema>;