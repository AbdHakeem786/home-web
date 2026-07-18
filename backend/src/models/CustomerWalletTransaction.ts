import { Schema, model, Document, Types } from "mongoose";
import { WalletTxType } from "../types";

export interface ICustomerWalletTransaction extends Document {
  user: Types.ObjectId;
  label: string;
  amount: number;
  type: WalletTxType;
  booking?: Types.ObjectId;
  createdAt: Date;
}

const customerWalletTxSchema = new Schema<ICustomerWalletTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["credit", "debit"], required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

customerWalletTxSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CustomerWalletTransaction = model<ICustomerWalletTransaction>(
  "CustomerWalletTransaction",
  customerWalletTxSchema
);
