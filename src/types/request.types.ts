import { Request } from "express";

export interface AppRequest extends Request {
    validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
    }
}