import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../types";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  avatar?: string;
  phoneVerified: boolean;
  active: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true, index: true },
    role: { type: String, enum: ["customer", "worker", "admin"], default: "customer" },
    avatar: { type: String },
    phoneVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    delete ret.failedLoginAttempts;
    delete ret.lockedUntil;
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const User = model<IUser>("User", userSchema);
