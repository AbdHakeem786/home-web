import { Schema, model, Document, Types } from "mongoose";
import { WalletTxType, WalletTxStatus } from "../types";

export interface IWalletTransaction extends Document {
  worker: Types.ObjectId;
  label: string;
  amount: number;
  type: WalletTxType;
  booking?: Types.ObjectId;
  // Only meaningful for withdrawal (debit) transactions - booking credits are
  // always "completed" since they're automatic. Withdrawals start "pending"
  // until an admin marks them paid or rejects them (crediting the balance back).
  status: WalletTxStatus;
  accountDetails?: string;
  createdAt: Date;
}

const walletTxSchema = new Schema<IWalletTransaction>(
  {
    worker: { type: Schema.Types.ObjectId, ref: "WorkerProfile", required: true, index: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["credit", "debit"], required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    status: { type: String, enum: ["pending", "completed", "rejected"], default: "completed", index: true },
    accountDetails: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

walletTxSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const WalletTransaction = model<IWalletTransaction>("WalletTransaction", walletTxSchema);
