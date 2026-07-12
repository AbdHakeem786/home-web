import { Schema, model, Document, Types } from "mongoose";

export interface IEmailVerificationToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
}

const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const EmailVerificationToken = model<IEmailVerificationToken>(
  "EmailVerificationToken",
  emailVerificationTokenSchema
);
