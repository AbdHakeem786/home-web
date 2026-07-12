import { Request, Response } from "express";
import { Review } from "../models/Review";
import { Booking } from "../models/Booking";
import { WorkerProfile } from "../models/WorkerProfile";
import { AppError } from "../utils/AppError";
import { ok, created, paginated } from "../utils/apiResponse";
import { parsePagination } from "../utils/pagination";

export async function createReview(req: Request, res: Response): Promise<void> {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound("Booking not found");
  if (booking.customer.toString() !== req.auth!.userId) {
    throw AppError.forbidden("You can only review your own bookings");
  }
  if (booking.status !== "completed") {
    throw AppError.badRequest("You can only review completed bookings");
  }

  const existing = await Review.findOne({ booking: bookingId });
  if (existing) throw AppError.conflict("This booking has already been reviewed");

  const review = await Review.create({
    worker: booking.worker,
    customer: req.auth!.userId,
    booking: bookingId,
    rating,
    comment,
  });

  const stats = await Review.aggregate([
    { $match: { worker: booking.worker } },
    { $group: { _id: "$worker", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const { avgRating, count } = stats[0] ?? { avgRating: rating, count: 1 };
  await WorkerProfile.findByIdAndUpdate(booking.worker, {
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: count,
  });

  created(res, review);
}

export async function listWorkerReviews(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const filter = { worker: req.params.workerId };

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, reviews, page, limit, total);
}
