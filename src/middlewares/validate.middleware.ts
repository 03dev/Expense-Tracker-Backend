import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BadRequestError } from "../errors/BadRequestError";
import { AppRequest } from "../types/request.types";

interface ValidateSchema {
    body?: z.ZodType;
    query?: z.ZodType;
    params?: z.ZodType;
}

export const validate = (schemas: ValidateSchema) => {
    return (req: AppRequest, res: Response, next: NextFunction) => {
        if(schemas.body) {
            const result = schemas.body.safeParse(req.body);
            if(!result.success) {
                throw new BadRequestError(
                    "Validation failed",
                    result.error.flatten().fieldErrors as Record<string, unknown>
                );
            }
            req.validated = {...req.validated, body: result.data};
        }

        if(schemas.query) {
            const result = schemas.query.safeParse(req.query);
            if(!result.success) {
                throw new BadRequestError(
                    "Invalid query parameters",
                    result.error.flatten().fieldErrors as Record<string, unknown>
                );
            }
            req.validated = {...req.validated, query: result.data};
        }

        if(schemas.params) {
            const result = schemas.params.safeParse(req.params);
            if(!result.success) {
                throw new BadRequestError(
                    "Invalid route parameters",
                    result.error.flatten().fieldErrors as Record<string, unknown>
                )
            }
            req.validated = {...req.validated, params: result.data}
        }
        
        next();
    };
};