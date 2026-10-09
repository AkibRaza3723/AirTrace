import { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}

export function sendError(res: Response, message: string, statusCode = 400, details?: any) {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
}
