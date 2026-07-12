import { Schema, model, Document, Types } from "mongoose";
import { NotificationType } from "../types";

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ["booking", "payment", "offer", "system"], default: "system" },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Notification = model<INotification>("Notification", notificationSchema);
