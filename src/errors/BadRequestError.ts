import { AppError } from "./AppError";

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: Record<string, unknown>) {
    super(message, 400, true, details);
  }
}