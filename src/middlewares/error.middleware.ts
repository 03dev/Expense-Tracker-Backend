import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { env } from "../config/env"
import { logger } from "../utils/logger";
import { Prisma } from "@prisma/client";

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    // Handle prisma unique constraint error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if(err.code === "P2002") {
            return res.status(400).json({
                success: false,
                message: "A record with this information already exists"
            });
        }

        if (err.code === "P2025") {
            return res.status(404).json({
                success: false,
                message: "Record not found"
            });
        }

        if (err.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "Related record not found"
            })
        }
    }

    // Known, expected error (our AppError)
    if (err instanceof AppError && err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message, ...(err.details && { details: err.details }),
        });
    }

    // Unknown, unexpected error (bug, DB crash, etc.)
    // Log unexpected errors
    logger.error("UNEXPECTED ERROR 💥", err);

    return res.status(500).json({
        success: false,
        message: env.NODE_ENV === "development" ? err.message : "Something went wrong",
        ...(env.NODE_ENV === "development" && { stack : err.stack }),
    });
};