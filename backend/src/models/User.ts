import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../types";

export interface ISavedAddress {
  _id: Types.ObjectId;
  label: string;
  address: string;
}

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
  favoriteWorkers: Types.ObjectId[];
  addresses: Types.DocumentArray<ISavedAddress>;
  currentAddressId?: Types.ObjectId;
  referralCode: string;
  referredBy?: Types.ObjectId;
  referralRewarded: boolean;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

function generateReferralCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const savedAddressSchema = new Schema<ISavedAddress>(
  {
    label: { type: String, required: true, trim: true, maxlength: 30 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: false }
);
savedAddressSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

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
    favoriteWorkers: [{ type: Schema.Types.ObjectId, ref: "WorkerProfile", default: [] }],
    addresses: { type: [savedAddressSchema], default: [] },
    currentAddressId: { type: Schema.Types.ObjectId },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    referralRewarded: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Every user gets a shareable referral code; retry on the (very rare) collision
// since the code doubles as a unique lookup key for the referral flow.
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.referralCode) {
    let code = generateReferralCode();
    while (await User.exists({ referralCode: code })) {
      code = generateReferralCode();
    }
    this.referralCode = code;
  }
  next();
});

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
