import { NextFunction, Response } from "express";
import { AppRequest } from "../types/request.types";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const authMiddleware = async (req: AppRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError("Unauthorized: No access token provided"));
    }

    const accessToken = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET) as {id: string};

        req.user = { id: decoded.id };
        next();
    } catch (error) {
        next(new UnauthorizedError("Unauthorized: Invalid token"));
    }
}

export default authMiddleware;