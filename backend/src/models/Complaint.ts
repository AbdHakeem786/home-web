import { Schema, model, Document, Types } from "mongoose";
import { ComplaintStatus } from "../types";

export interface IComplaint extends Document {
  raisedBy: Types.ObjectId;
  booking?: Types.ObjectId;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_review", "resolved", "rejected"], default: "open" },
    adminNote: { type: String },
  },
  { timestamps: true }
);

complaintSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Complaint = model<IComplaint>("Complaint", complaintSchema);
