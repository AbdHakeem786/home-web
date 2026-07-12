import { Schema, model, Document, Types } from "mongoose";
import { BookingStatus, BOOKING_STATUSES } from "../types";

export interface IBooking extends Document {
  customer: Types.ObjectId;
  worker: Types.ObjectId;
  category: Types.ObjectId;
  status: BookingStatus;
  date: string;
  time: string;
  address: string;
  description: string;
  estimatedPrice: number;
  finalPrice?: number;
  cancelReason?: string;
  cancellationFee?: number;
  refundAmount?: number;
  problemImages: string[];
  completionImages: string[];
  paymentMethod: "cash" | "stripe";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    worker: { type: Schema.Types.ObjectId, ref: "WorkerProfile", required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending", index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, default: "" },
    estimatedPrice: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, min: 0 },
    cancelReason: { type: String },
    cancellationFee: { type: Number, min: 0 },
    refundAmount: { type: Number, min: 0 },
    problemImages: { type: [String], default: [] },
    completionImages: { type: [String], default: [] },
    paymentMethod: {
      type: String,
      enum: ["cash", "stripe"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: { type: String, index: true },
  },
  { timestamps: true }
);

bookingSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Booking = model<IBooking>("Booking", bookingSchema);
