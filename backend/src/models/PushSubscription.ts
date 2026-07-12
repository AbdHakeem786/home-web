import { Schema, model, Document, Types } from "mongoose";

export interface IPushSubscription extends Document {
  user: Types.ObjectId;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PushSubscription = model<IPushSubscription>("PushSubscription", pushSubscriptionSchema);
