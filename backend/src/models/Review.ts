import { Schema, model, Document, Types } from "mongoose";

export interface IReview extends Document {
  worker: Types.ObjectId;
  customer: Types.ObjectId;
  booking: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    worker: { type: Schema.Types.ObjectId, ref: "WorkerProfile", required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Review = model<IReview>("Review", reviewSchema);
