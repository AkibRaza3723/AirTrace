import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          details: error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        });
      }
      next(error);
    }
  };
}
