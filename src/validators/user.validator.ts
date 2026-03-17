import { z } from "zod";

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be at most 50 characters"),
}).strict();

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
}).strict().refine(
    (data) => data.currentPassword !== data.newPassword,
    { message: "New Password must be different from current password" }
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;