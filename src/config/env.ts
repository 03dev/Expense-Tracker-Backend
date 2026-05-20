import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  PORT: z.string().default("3000").transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // JWT
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "Invalid format, use: 15m, 1h, 7d")
    .default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "Invalid format")
    .default("7d"),

  // Gemini
  GEMINI_API_KEY: z
    .string()
    .min(1, "Gemini API key is required"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "Cloudinary cloud name is required"),
  CLOUDINARY_API_KEY: z
    .string()
    .min(1, "Cloudinary API key is required"),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "Cloudinary API secret is required"),
  
  // Redis
  REDIS_HOST: z
    .string()
    .default("localhost"),
  REDIS_PORT: z
    .string()
    .default("6379")
    .transform(Number),
  REDIS_PASSWORD: z
    .string()
    .optional(),  

  // Resend
  RESEND_API_KEY: z
    .string()
    .min(1, "Resend API key is required")
}); 

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // stops the server if env is invalid
}

export const env = parsed.data;
