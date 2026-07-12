import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { created } from "../utils/apiResponse";
import { UploadType } from "../middleware/upload";

export async function uploadFile(req: Request, res: Response): Promise<void> {
  const type = req.params.type as UploadType;
  if (!req.file) throw AppError.badRequest("No file uploaded");

  const url = `/uploads/${type}/${req.file.filename}`;
  created(res, { url, type, size: req.file.size, mimeType: req.file.mimetype });
}
