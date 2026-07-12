import { Schema, model, Document } from "mongoose";

export type OtpPurpose = "register" | "login" | "forgot_password";

export interface IOtp extends Document {
  phone: string;
  codeHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
  consumed: boolean;
  attempts: number;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["register", "login", "forgot_password"], required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete expired OTP docs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model<IOtp>("Otp", otpSchema);
