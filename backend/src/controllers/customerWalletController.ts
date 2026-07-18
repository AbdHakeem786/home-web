import { Request, Response } from "express";
import { User } from "../models/User";
import { CustomerWalletTransaction } from "../models/CustomerWalletTransaction";
import { AppError } from "../utils/AppError";
import { ok, paginated } from "../utils/apiResponse";
import { parsePagination } from "../utils/pagination";

export async function getWalletSummary(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.auth!.userId);
  if (!user) throw AppError.notFound("User not found");
  ok(res, { balance: user.walletBalance ?? 0 });
}

export async function listMyTransactions(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);

  const [total, txns] = await Promise.all([
    CustomerWalletTransaction.countDocuments({ user: req.auth!.userId }),
    CustomerWalletTransaction.find({ user: req.auth!.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, txns, page, limit, total);
}
