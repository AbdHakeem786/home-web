import { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { WorkerProfile } from "../models/WorkerProfile";
import { WalletTransaction } from "../models/WalletTransaction";
import { CustomerWalletTransaction } from "../models/CustomerWalletTransaction";
import { Coupon } from "../models/Coupon";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { ok, created, paginated } from "../utils/apiResponse";
import { notifyUser } from "../utils/notify";
import { computeCouponDiscount } from "../utils/coupons";
import { isWorkerAvailableAt } from "../utils/workerSchedule";
import { BOOKING_STATUS_FLOW, BookingStatus } from "../types";
import { env } from "../config/env";
import { getStripe, toStripeAmount } from "../utils/stripe";

// A customer who cancels after the worker has already set off (or started work) has cost the
// worker travel time/opportunity, so a partial fee is withheld from their refund. Cancelling
// earlier (before the worker is en route), or a worker/admin-initiated cancellation, is always
// a full refund - it's not the customer's fault in those cases.
const CANCELLATION_FEE_STATUSES: BookingStatus[] = ["on_the_way", "arrived", "in_progress"];
const CANCELLATION_FEE_RATE = 0.2;
const REFERRAL_REWARD_AMOUNT = 200;

// Rewards the referrer the first (and only the first) time their referral completes
// a booking. The findOneAndUpdate's referralRewarded:false filter makes the check-and-flip
// atomic, so two bookings completing around the same time can't both trigger a reward.
async function rewardReferralIfEligible(customerId: string): Promise<void> {
  const customer = await User.findOneAndUpdate(
    { _id: customerId, referredBy: { $exists: true, $ne: null }, referralRewarded: false },
    { referralRewarded: true }
  );
  if (!customer?.referredBy) return;

  const code = `REF${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await Coupon.create({
    code,
    type: "flat",
    value: REFERRAL_REWARD_AMOUNT,
    maxUses: 1,
    perUserLimit: 1,
    restrictToUser: customer.referredBy,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await notifyUser(customer.referredBy.toString(), {
    title: "Referral reward unlocked!",
    body: `Someone you referred completed their first booking. Use code ${code} for Rs ${REFERRAL_REWARD_AMOUNT} off your next booking.`,
    type: "offer",
  });
}

export async function createBooking(req: Request, res: Response): Promise<void> {
  const {
    workerId,
    categoryId,
    date,
    time,
    address,
    description,
    estimatedPrice,
    problemImages,
    paymentMethod,
    couponCode,
    walletAmount,
  } = req.body;

  const worker = await WorkerProfile.findById(workerId);
  if (!worker) throw AppError.notFound("Worker not found");
  if (!worker.verified) {
    throw AppError.badRequest("This worker has not been verified yet and cannot accept bookings.");
  }
  if (!isWorkerAvailableAt(worker.schedule, date, time)) {
    throw AppError.badRequest("This worker is not available at the selected date and time.");
  }

  let discountAmount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).trim().toUpperCase() });
    if (!coupon) throw AppError.notFound("Invalid coupon code");
    discountAmount = computeCouponDiscount(coupon, req.auth!.userId, estimatedPrice);
  }

  // Reserve the wallet portion up front with an atomic conditional decrement (mirrors the
  // withdrawal pattern) so two concurrent bookings can't both spend the same balance. Capped
  // to what's actually still owed after the coupon discount, in case the client sent a stale amount.
  let walletAmountUsed = 0;
  const requestedWallet = Number(walletAmount) || 0;
  if (requestedWallet > 0) {
    const payableAfterCoupon = Math.max(0, estimatedPrice - discountAmount);
    walletAmountUsed = Math.min(requestedWallet, payableAfterCoupon);
    if (walletAmountUsed > 0) {
      const debited = await User.findOneAndUpdate(
        { _id: req.auth!.userId, walletBalance: { $gte: walletAmountUsed } },
        { $inc: { walletBalance: -walletAmountUsed } }
      );
      if (!debited) throw AppError.badRequest("Insufficient wallet balance");
    }
  }

  const booking = await Booking.create({
    customer: req.auth!.userId,
    worker: workerId,
    category: categoryId,
    date,
    time,
    address,
    description,
    estimatedPrice,
    problemImages: problemImages ?? [],
    paymentMethod: paymentMethod ?? "cash",
    couponCode: coupon?.code,
    discountAmount,
    walletAmount: walletAmountUsed,
    status: "pending",
  });

  if (coupon) {
    coupon.usedCount += 1;
    coupon.usedBy.push(req.auth!.userId as any);
    await coupon.save();
  }

  if (walletAmountUsed > 0) {
    await CustomerWalletTransaction.create({
      user: req.auth!.userId,
      label: `Used on booking #${booking._id.toString().slice(-6)}`,
      amount: walletAmountUsed,
      type: "debit",
      booking: booking._id,
    });
  }

  await notifyUser(worker.user.toString(), {
    title: "New booking request",
    body: `You have a new booking request for ${date} at ${time}.`,
    type: "booking",
  });

  created(res, booking);
}

export async function listMyBookings(req: Request, res: Response): Promise<void> {
  const role = req.auth!.role;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const statusFilter = req.query.status ? { status: req.query.status } : {};

  let filter: Record<string, unknown>;
  if (role === "customer") {
    filter = { customer: req.auth!.userId, ...statusFilter };
  } else if (role === "worker") {
    const profile = await WorkerProfile.findOne({ user: req.auth!.userId });
    if (!profile) {
      paginated(res, [], page, limit, 0);
      return;
    }
    filter = { worker: profile._id, ...statusFilter };
  } else {
    filter = { ...statusFilter };
  }

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(filter),
    Booking.find(filter)
      .populate("category", "name icon")
      .populate({ path: "worker", populate: [{ path: "user", select: "name avatar phone" }] })
      .populate("customer", "name avatar phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, bookings, page, limit, total);
}

export async function getBooking(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id)
    .populate("category", "name icon")
    .populate({ path: "worker", populate: [{ path: "user", select: "name avatar" }] })
    .populate("customer", "name avatar");
  if (!booking) throw AppError.notFound("Booking not found");

  await assertBookingAccess(req, booking);
  ok(res, booking);
}

export async function createPaymentIntent(req: Request, res: Response): Promise<void> {
  if (!env.stripe.secretKey) {
    throw AppError.badRequest("Card payments are not configured on this server yet.");
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw AppError.notFound("Booking not found");
  if (booking.customer.toString() !== req.auth!.userId) {
    throw AppError.forbidden("Not your booking");
  }
  if (booking.paymentMethod !== "stripe") {
    throw AppError.badRequest("This booking is not set up for card payment");
  }
  if (booking.paymentStatus === "paid") {
    throw AppError.badRequest("This booking has already been paid");
  }

  const payableAmount = Math.max(
    0,
    booking.estimatedPrice - (booking.discountAmount ?? 0) - (booking.walletAmount ?? 0)
  );

  // Coupon + wallet credit can cover the entire price - Stripe doesn't allow a
  // zero-amount PaymentIntent, so there's nothing left to charge the card for.
  if (payableAmount <= 0) {
    booking.paymentStatus = "paid";
    await booking.save();
    ok(res, { clientSecret: null });
    return;
  }

  const stripe = getStripe();
  const intent = booking.stripePaymentIntentId
    ? await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId)
    : await stripe.paymentIntents.create({
        amount: toStripeAmount(payableAmount),
        currency: "pkr",
        metadata: { bookingId: booking._id.toString() },
      });

  if (!booking.stripePaymentIntentId) {
    booking.stripePaymentIntentId = intent.id;
    await booking.save();
  }

  ok(res, { clientSecret: intent.client_secret });
}

async function assertBookingAccess(req: Request, booking: any): Promise<void> {
  const role = req.auth!.role;
  if (role === "admin") return;
  if (role === "customer" && booking.customer._id?.toString() === req.auth!.userId) return;
  if (role === "worker") {
    const profile = await WorkerProfile.findOne({ user: req.auth!.userId });
    if (profile && booking.worker._id?.toString() === profile._id.toString()) return;
  }
  throw AppError.forbidden("You do not have access to this booking");
}

export async function updateBookingStatus(req: Request, res: Response): Promise<void> {
  const { status, cancelReason, finalPrice, completionImages } = req.body as {
    status: BookingStatus;
    cancelReason?: string;
    finalPrice?: number;
    completionImages?: string[];
  };

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw AppError.notFound("Booking not found");

  const role = req.auth!.role;
  let profile: any = null;
  if (role === "worker") {
    profile = await WorkerProfile.findOne({ user: req.auth!.userId });
    if (!profile || booking.worker.toString() !== profile._id.toString()) {
      throw AppError.forbidden("Not your booking");
    }
  } else if (role === "customer") {
    if (booking.customer.toString() !== req.auth!.userId) {
      throw AppError.forbidden("Not your booking");
    }
    if (status !== "cancelled") {
      throw AppError.forbidden("Customers may only cancel bookings");
    }
  }

  const allowed = BOOKING_STATUS_FLOW[booking.status];
  if (!allowed.includes(status)) {
    throw AppError.badRequest(
      `Cannot move booking from '${booking.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`
    );
  }

  // A worker can be requested for the same slot by multiple customers, but can only
  // ever be committed (accepted) to one - otherwise they'd be double-booked and
  // physically unable to fulfil both jobs.
  if (status === "accepted") {
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      worker: booking.worker,
      date: booking.date,
      time: booking.time,
      status: { $in: ["accepted", "on_the_way", "arrived", "in_progress"] },
    });
    if (conflict) {
      throw AppError.conflict("This worker already has another booking accepted for the same date and time.");
    }
  }

  if (status === "cancelled" && booking.paymentMethod === "stripe" && booking.paymentStatus === "paid" && booking.stripePaymentIntentId) {
    const price = booking.finalPrice ?? booking.estimatedPrice;
    const feeApplies = role === "customer" && CANCELLATION_FEE_STATUSES.includes(booking.status);
    const cancellationFee = feeApplies ? Math.round(price * CANCELLATION_FEE_RATE) : 0;
    const refundAmount = Math.max(0, price - cancellationFee);

    if (refundAmount > 0) {
      await getStripe().refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: toStripeAmount(refundAmount),
      });
    }

    booking.paymentStatus = "refunded";
    booking.cancellationFee = cancellationFee;
    booking.refundAmount = refundAmount;
  }

  // Wallet credit spent on this booking is always refunded in full on cancellation - it's
  // internal ledger money, not a real charge, so there's no case for withholding a fee on it.
  if (status === "cancelled" && booking.walletAmount > 0) {
    await User.findByIdAndUpdate(booking.customer, { $inc: { walletBalance: booking.walletAmount } });
    await CustomerWalletTransaction.create({
      user: booking.customer,
      label: `Refund for cancelled booking #${booking._id.toString().slice(-6)}`,
      amount: booking.walletAmount,
      type: "credit",
      booking: booking._id,
    });
  }

  booking.status = status;
  if (status === "cancelled" && cancelReason) booking.cancelReason = cancelReason;
  if (status === "completed" && finalPrice !== undefined) booking.finalPrice = finalPrice;
  if (status === "completed" && completionImages) booking.completionImages = completionImages;

  await booking.save();

  if (status === "completed") {
    const price = booking.finalPrice ?? booking.estimatedPrice;
    await WorkerProfile.findByIdAndUpdate(booking.worker, {
      $inc: { completedJobs: 1, walletBalance: price },
    });
    await WalletTransaction.create({
      worker: booking.worker,
      label: `Booking #${booking._id.toString().slice(-6)}`,
      amount: price,
      type: "credit",
      booking: booking._id,
    });
    await rewardReferralIfEligible(booking.customer.toString());
  }

  // Notify whoever didn't make the change. A worker- or customer-initiated
  // change only needs to reach the other party; an admin-initiated change
  // (e.g. resolving a dispute) reaches both, since neither is the actor.
  const workerUserId = role === "worker" ? req.auth!.userId : (await WorkerProfile.findById(booking.worker))?.user?.toString();
  const notifyTargets = new Set<string>();
  if (role === "worker") {
    notifyTargets.add(booking.customer.toString());
  } else if (role === "customer") {
    if (workerUserId) notifyTargets.add(workerUserId);
  } else {
    notifyTargets.add(booking.customer.toString());
    if (workerUserId) notifyTargets.add(workerUserId);
  }

  for (const userId of notifyTargets) {
    await notifyUser(userId, {
      title: statusTitle(status),
      body: statusBody(status, booking),
      type: "booking",
    });
  }

  ok(res, booking);
}

const RESCHEDULABLE_STATUSES: BookingStatus[] = ["pending", "accepted"];

export async function rescheduleBooking(req: Request, res: Response): Promise<void> {
  const { date, time } = req.body as { date: string; time: string };

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw AppError.notFound("Booking not found");
  if (booking.customer.toString() !== req.auth!.userId) {
    throw AppError.forbidden("Not your booking");
  }
  if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
    throw AppError.badRequest(
      `Cannot reschedule a booking that is already '${booking.status}'. A booking can only be rescheduled before the worker is on the way.`
    );
  }

  booking.date = date;
  booking.time = time;
  await booking.save();

  const workerProfile = await WorkerProfile.findById(booking.worker);
  if (workerProfile) {
    await notifyUser(workerProfile.user.toString(), {
      title: "Booking rescheduled",
      body: `The customer rescheduled this booking to ${date} at ${time}.`,
      type: "booking",
    });
  }

  ok(res, booking);
}

function statusTitle(status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    pending: "Booking pending",
    accepted: "Booking accepted",
    on_the_way: "Worker on the way",
    arrived: "Worker arrived",
    in_progress: "Job in progress",
    completed: "Job completed",
    cancelled: "Booking cancelled",
  };
  return map[status];
}

function statusBody(
  status: BookingStatus,
  booking: { address: string; cancellationFee?: number; refundAmount?: number }
): string {
  if (status === "cancelled" && booking.refundAmount !== undefined) {
    return booking.cancellationFee
      ? `This booking has been cancelled. Rs ${booking.refundAmount} was refunded after a Rs ${booking.cancellationFee} cancellation fee.`
      : `This booking has been cancelled and Rs ${booking.refundAmount} was refunded in full.`;
  }

  const map: Record<BookingStatus, string> = {
    pending: "Your booking is pending confirmation.",
    accepted: "Your booking request has been accepted.",
    on_the_way: "The worker is on the way to your address.",
    arrived: `The worker has arrived at ${booking.address}.`,
    in_progress: "Work has started on your booking.",
    completed: "Your booking has been marked complete.",
    cancelled: "This booking has been cancelled.",
  };
  return map[status];
}
