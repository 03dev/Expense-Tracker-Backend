import { Request } from "express";

export interface AppRequest extends Request {
    user?: {
        id: string
    }
    validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
    }
}

export interface AuthenticatedRequest extends AppRequest {
    user: {
        id: string
    }
}