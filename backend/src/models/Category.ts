import { Schema, model, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  icon: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: true }, // lucide-react icon name, matches frontend
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Category = model<ICategory>("Category", categorySchema);
