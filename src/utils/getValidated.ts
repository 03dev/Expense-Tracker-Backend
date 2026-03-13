import { AppRequest } from "../types/request.types";

export const getBody = <T>(req: AppRequest): T => {
  return req.validated?.body as T;
}

export const getParam = <T>(req: AppRequest): T => {
  return req.validated?.params as T;
}

export const getQuery = <T>(req: AppRequest): T => {
  return req.validated?.query as T;
}