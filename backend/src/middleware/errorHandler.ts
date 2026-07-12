import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 400 && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(`[${err.statusCode}] ${req.method} ${req.originalUrl}:`, err.message, err.details ?? "");
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    return;
  }

  // Mongoose duplicate key error
  if (typeof err === "object" && err !== null && (err as any).code === 11000) {
    res.status(409).json({ success: false, message: "Duplicate value", details: (err as any).keyValue });
    return;
  }

  // Mongoose validation error
  if (err instanceof Error && err.name === "ValidationError") {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error("[unhandled error]", err);
  res.status(500).json({ success: false, message: "Internal server error" });
}
