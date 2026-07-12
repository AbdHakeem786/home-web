import { Request, Response } from "express";
import { Complaint } from "../models/Complaint";
import { Booking } from "../models/Booking";
import { WorkerProfile } from "../models/WorkerProfile";
import { AppError } from "../utils/AppError";
import { ok, created, paginated } from "../utils/apiResponse";
import { parsePagination } from "../utils/pagination";

export async function createComplaint(req: Request, res: Response): Promise<void> {
  const { bookingId, subject, description } = req.body;

  if (bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking not found");

    const isCustomer = booking.customer.toString() === req.auth!.userId;
    let isAssignedWorker = false;
    if (!isCustomer && req.auth!.role === "worker") {
      const profile = await WorkerProfile.findOne({ user: req.auth!.userId });
      isAssignedWorker = !!profile && booking.worker.toString() === profile._id.toString();
    }
    if (!isCustomer && !isAssignedWorker) {
      throw AppError.forbidden("You can only file a complaint about your own booking");
    }
  }

  const complaint = await Complaint.create({
    raisedBy: req.auth!.userId,
    booking: bookingId,
    subject,
    description,
  });
  created(res, complaint);
}

export async function listMyComplaints(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const filter = { raisedBy: req.auth!.userId };

  const [total, complaints] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, complaints, page, limit, total);
}

export async function listAllComplaints(req: Request, res: Response): Promise<void> {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const filter = req.query.status ? { status: req.query.status } : {};

  const [total, complaints] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.find(filter)
      .populate("raisedBy", "name phone role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  paginated(res, complaints, page, limit, total);
}

export async function updateComplaint(req: Request, res: Response): Promise<void> {
  const { status, adminNote } = req.body;
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status, ...(adminNote !== undefined ? { adminNote } : {}) },
    { new: true }
  );
  if (!complaint) throw AppError.notFound("Complaint not found");
  ok(res, complaint);
}
