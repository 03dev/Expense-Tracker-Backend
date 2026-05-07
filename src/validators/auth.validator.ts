import { z } from "zod";

export const registerSchema = z.object({
    name: z
    .string()
    .min(2, "Name must be at least 2 charachters")
    .max(50, "Name must be at most 50 characters"),
    email: z
    .string()
    .email("Invalid email address"),
    password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
}).strict();

export const loginSchema = z.object({
    email: z
    .string()
    .email("Invalid email address"),
    password: z
    .string()
    .min(1, "Password is required")
}).strict();

export const verifyEmailSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
}).strict();

export const verifyTwoFactorSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
}).strict();

export const resendVerificationSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;