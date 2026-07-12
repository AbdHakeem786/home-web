import { Request, Response } from "express";
import { Message } from "../models/Message";
import { Booking } from "../models/Booking";
import { WorkerProfile } from "../models/WorkerProfile";
import { AppError } from "../utils/AppError";
import { ok } from "../utils/apiResponse";

export async function assertBookingChatAccess(userId: string, role: string, bookingId: string): Promise<void> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound("Booking not found");
  if (role === "admin") return;
  if (role === "customer" && booking.customer.toString() === userId) return;
  if (role === "worker") {
    const profile = await WorkerProfile.findOne({ user: userId });
    if (profile && booking.worker.toString() === profile._id.toString()) return;
  }
  throw AppError.forbidden("You do not have access to this booking's chat");
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  const { bookingId } = req.params;
  await assertBookingChatAccess(req.auth!.userId, req.auth!.role, bookingId);

  const messages = await Message.find({ booking: bookingId })
    .populate("sender", "name avatar role")
    .sort({ createdAt: 1 })
    .limit(500);

  ok(res, messages);
}
