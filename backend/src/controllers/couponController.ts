import { Request, Response } from "express";
import { Coupon } from "../models/Coupon";
import { AppError } from "../utils/AppError";
import { ok, created, paginated } from "../utils/apiResponse";
import { parsePagination } from "../utils/pagination";
import { computeCouponDiscount } from "../utils/coupons";

export async function createCoupon(req: Request, res: Response): Promise<void> {
  const { code, type, value, maxUses, perUserLimit, minBookingAmount, expiresAt } = req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) throw AppError.conflict("A coupon with this code already exists");

  const coupon = await Coupon.create({
    code,
    type,
    value,
    maxUses,
    perUserLimit,
    minBookingAmount,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  created(res, coupon);
}

export async function listCoupons(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);

  const [total, coupons] = await Promise.all([
    Coupon.countDocuments({}),
    Coupon.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, coupons, page, limit, total);
}

export async function updateCoupon(req: Request, res: Response): Promise<void> {
  const { active, maxUses, expiresAt } = req.body as {
    active?: boolean;
    maxUses?: number;
    expiresAt?: string;
  };

  const update: Record<string, unknown> = {};
  if (active !== undefined) update.active = active;
  if (maxUses !== undefined) update.maxUses = maxUses;
  if (expiresAt !== undefined) update.expiresAt = new Date(expiresAt);

  const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!coupon) throw AppError.notFound("Coupon not found");

  ok(res, coupon);
}

export async function deleteCoupon(req: Request, res: Response): Promise<void> {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw AppError.notFound("Coupon not found");
  ok(res, { deleted: true });
}

// Lets the customer preview a discount at checkout before the booking is actually created.
export async function validateCoupon(req: Request, res: Response): Promise<void> {
  const { code, amount } = req.body as { code: string; amount: number };

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) throw AppError.notFound("Invalid coupon code");

  const discount = computeCouponDiscount(coupon, req.auth!.userId, amount);

  ok(res, { code: coupon.code, type: coupon.type, value: coupon.value, discount });
}
