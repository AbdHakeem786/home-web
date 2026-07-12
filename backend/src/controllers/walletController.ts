import { Request, Response } from "express";
import mongoose from "mongoose";
import { WalletTransaction } from "../models/WalletTransaction";
import { WorkerProfile } from "../models/WorkerProfile";
import { AppError } from "../utils/AppError";
import { ok, paginated } from "../utils/apiResponse";
import { parsePagination } from "../utils/pagination";

async function getMyWorkerObjectId(userId: string): Promise<mongoose.Types.ObjectId> {
  const profile = await WorkerProfile.findOne({ user: userId });
  if (!profile) throw AppError.notFound("Worker profile not found");
  return profile._id;
}

async function computeBalance(workerObjectId: mongoose.Types.ObjectId) {
  const [credits, debits] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: { worker: workerObjectId, type: "credit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    WalletTransaction.aggregate([
      { $match: { worker: workerObjectId, type: "debit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);
  const totalCredit = credits[0]?.total ?? 0;
  const totalDebit = debits[0]?.total ?? 0;
  return { totalCredit, totalDebit, balance: totalCredit - totalDebit };
}

export async function getWalletSummary(req: Request, res: Response): Promise<void> {
  const workerObjectId = await getMyWorkerObjectId(req.auth!.userId);
  const [profile, { totalCredit, totalDebit }] = await Promise.all([
    WorkerProfile.findById(workerObjectId),
    computeBalance(workerObjectId),
  ]);
  ok(res, { balance: profile?.walletBalance ?? 0, totalEarned: totalCredit, totalWithdrawn: totalDebit });
}

export async function listMyTransactions(req: Request, res: Response): Promise<void> {
  const workerObjectId = await getMyWorkerObjectId(req.auth!.userId);
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);

  const [total, txns] = await Promise.all([
    WalletTransaction.countDocuments({ worker: workerObjectId }),
    WalletTransaction.find({ worker: workerObjectId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, txns, page, limit, total);
}

export async function requestWithdrawal(req: Request, res: Response): Promise<void> {
  const workerObjectId = await getMyWorkerObjectId(req.auth!.userId);
  const { amount, method, accountDetails } = req.body as { amount: number; method: string; accountDetails: string };

  if (amount <= 0) throw AppError.badRequest("Withdrawal amount must be greater than zero");

  // Atomic conditional decrement: the balance check and the debit happen in a single
  // DB operation, so two concurrent withdrawal requests can't both read the same
  // balance and both succeed (the read-then-write version of this was raceable).
  // The amount is reserved immediately; an admin later marks the request completed
  // (paid out) or rejected (credited back) once it's actually processed.
  const updated = await WorkerProfile.findOneAndUpdate(
    { _id: workerObjectId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );
  if (!updated) throw AppError.badRequest("Withdrawal amount exceeds wallet balance");

  const tx = await WalletTransaction.create({
    worker: workerObjectId,
    label: `Withdrawal to ${method}`,
    amount,
    type: "debit",
    status: "pending",
    accountDetails,
  });

  ok(res, tx);
}
