import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../config/env"

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    // Known, expected error (our AppError)
    if (err instanceof AppError && err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message, ...(err.details && { details: err.details }),
        });
    }

    // Unknown, unexpected error (bug, DB crash, etc.)
    console.error("UNEXPECTED ERROR: ", err);

    return res.status(500).json({
        success: false,
        message: env.NODE_ENV === "development" ? err.message : "Something went wrong",
        ...(env.NODE_ENV === "development" && { stack : err.stack }),
    });
};