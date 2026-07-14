import { Schema, model, Document, Types } from "mongoose";

// day: 0 = Sunday ... 6 = Saturday. startTime/endTime are "HH:mm" 24h strings.
export interface IAvailabilitySlot {
  day: number;
  startTime: string;
  endTime: string;
}

export interface IWorkerProfile extends Document {
  user: Types.ObjectId;
  category: Types.ObjectId;
  bio: string;
  priceFrom: number;
  experienceYears: number;
  online: boolean;
  verified: boolean;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  skills: string[];
  cnicImage?: string;
  documents: string[];
  walletBalance: number;
  // Weekly recurring working hours. Empty array means "no schedule set" -
  // treated as always available so existing workers aren't suddenly unbookable.
  schedule: IAvailabilitySlot[];
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySlotSchema = new Schema<IAvailabilitySlot>(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const workerProfileSchema = new Schema<IWorkerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    bio: { type: String, default: "" },
    priceFrom: { type: Number, required: true, min: 0 },
    experienceYears: { type: Number, default: 0, min: 0 },
    online: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    cnicImage: { type: String },
    documents: { type: [String], default: [] },
    // Authoritative balance, kept in sync via atomic $inc alongside WalletTransaction
    // ledger entries so withdrawal checks can be race-free (see walletController).
    walletBalance: { type: Number, default: 0, min: 0 },
    schedule: { type: [availabilitySlotSchema], default: [] },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { timestamps: true }
);

workerProfileSchema.index({ location: "2dsphere" });

workerProfileSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const WorkerProfile = model<IWorkerProfile>("WorkerProfile", workerProfileSchema);
