import { Request, Response } from "express";
import { User } from "../models/User";
import { WorkerProfile } from "../models/WorkerProfile";
import { Booking } from "../models/Booking";
import { Complaint } from "../models/Complaint";
import { WalletTransaction } from "../models/WalletTransaction";
import { AppError } from "../utils/AppError";
import { ok, paginated } from "../utils/apiResponse";
import { parsePagination } from "../utils/pagination";
import { escapeRegex } from "../utils/regex";

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [totalCustomers, totalWorkers, verifiedWorkers, onlineWorkers, bookingsByStatus, openComplaints, revenueAgg] =
    await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "worker" }),
      WorkerProfile.countDocuments({ verified: true }),
      WorkerProfile.countDocuments({ online: true }),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.countDocuments({ status: "open" }),
      Booking.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$finalPrice", "$estimatedPrice"] } } } },
      ]),
    ]);

  const statusCounts: Record<string, number> = {};
  for (const row of bookingsByStatus) statusCounts[row._id] = row.count;

  ok(res, {
    totalCustomers,
    totalWorkers,
    verifiedWorkers,
    onlineWorkers,
    bookingsByStatus: statusCounts,
    totalBookings: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    openComplaints,
    totalRevenue: revenueAgg[0]?.total ?? 0,
  });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const re = new RegExp(escapeRegex(String(req.query.search)), "i");
    filter.$or = [{ name: re }, { phone: re }, { email: re }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, users, page, limit, total);
}

export async function setUserActive(req: Request, res: Response): Promise<void> {
  const { active } = req.body as { active: boolean };
  const user = await User.findByIdAndUpdate(req.params.id, { active }, { new: true });
  if (!user) throw AppError.notFound("User not found");
  ok(res, user);
}

export async function listWorkersAdmin(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = {};
  if (req.query.verified !== undefined) filter.verified = req.query.verified === "true";

  const [total, workers] = await Promise.all([
    WorkerProfile.countDocuments(filter),
    WorkerProfile.find(filter)
      .populate("user", "name phone avatar active")
      .populate("category", "name icon")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, workers, page, limit, total);
}

export async function listWithdrawals(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const filter: Record<string, unknown> = { type: "debit" };
  if (req.query.status) filter.status = req.query.status;

  const [total, withdrawals] = await Promise.all([
    WalletTransaction.countDocuments(filter),
    WalletTransaction.find(filter)
      .populate({ path: "worker", populate: { path: "user", select: "name phone" } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, withdrawals, page, limit, total);
}

export async function processWithdrawal(req: Request, res: Response): Promise<void> {
  const { action } = req.body as { action: "complete" | "reject" };
  const nextStatus = action === "reject" ? "rejected" : "completed";

  // Atomic conditional status flip: only the request that actually wins the
  // pending -> {rejected,completed} transition proceeds to credit the wallet
  // back, so two concurrent processWithdrawal calls on the same tx can't both
  // succeed and double-credit the worker (the read-then-write version of this
  // was raceable).
  const tx = await WalletTransaction.findOneAndUpdate(
    { _id: req.params.id, type: "debit", status: "pending" },
    { status: nextStatus },
    { new: true }
  );

  if (!tx) {
    const existing = await WalletTransaction.findById(req.params.id);
    if (!existing) throw AppError.notFound("Withdrawal not found");
    if (existing.type !== "debit") throw AppError.badRequest("Not a withdrawal transaction");
    throw AppError.badRequest(`Withdrawal is already ${existing.status}`);
  }

  if (action === "reject") {
    // Credit the reserved amount back to the worker's wallet.
    await WorkerProfile.findByIdAndUpdate(tx.worker, { $inc: { walletBalance: tx.amount } });
  }

  ok(res, tx);
}

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  const days = Math.min(Math.max(Number(req.query.days ?? 14), 1), 90);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const [revenueRows, categoryRows] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          bookings: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, { $ifNull: ["$finalPrice", "$estimatedPrice"] }, 0] },
          },
        },
      },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $group: { _id: "$category.name", bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const revenueByDate = new Map(revenueRows.map((r) => [r._id as string, r]));
  const revenueByDay: { date: string; bookings: number; revenue: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = revenueByDate.get(key);
    revenueByDay.push({ date: key, bookings: row?.bookings ?? 0, revenue: row?.revenue ?? 0 });
  }

  ok(res, {
    revenueByDay,
    categoryBreakdown: categoryRows.map((c) => ({ category: c._id as string, bookings: c.bookings as number })),
  });
}
