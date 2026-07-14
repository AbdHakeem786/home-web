import { ICoupon } from "../models/Coupon";
import { AppError } from "./AppError";

export function computeCouponDiscount(coupon: ICoupon, userId: string, amount: number): number {
  if (!coupon.active) throw AppError.badRequest("This coupon is no longer active");
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw AppError.badRequest("This coupon has expired");
  }
  if (coupon.restrictToUser && coupon.restrictToUser.toString() !== userId) {
    throw AppError.badRequest("This coupon is not valid for your account");
  }
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw AppError.badRequest("This coupon has reached its usage limit");
  }
  const userUses = coupon.usedBy.filter((id) => id.toString() === userId).length;
  if (userUses >= coupon.perUserLimit) {
    throw AppError.badRequest("You have already used this coupon");
  }
  if (amount < coupon.minBookingAmount) {
    throw AppError.badRequest(`This coupon requires a minimum booking amount of Rs ${coupon.minBookingAmount}`);
  }

  const rawDiscount = coupon.type === "percent" ? (amount * coupon.value) / 100 : coupon.value;
  return Math.min(Math.round(rawDiscount), amount);
}
