import { Schema, model, Document, Types } from "mongoose";

export type CouponType = "percent" | "flat";

export interface ICoupon extends Document {
  code: string;
  type: CouponType;
  value: number;
  maxUses?: number;
  usedCount: number;
  perUserLimit: number;
  usedBy: Types.ObjectId[];
  minBookingAmount: number;
  // Set only for auto-generated referral rewards - restricts redemption to the
  // one user it was minted for, unlike general admin-created promo codes.
  restrictToUser?: Types.ObjectId;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    usedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    minBookingAmount: { type: Number, default: 0, min: 0 },
    restrictToUser: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Coupon = model<ICoupon>("Coupon", couponSchema);
