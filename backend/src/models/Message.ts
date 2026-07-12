import { Schema, model, Document, Types } from "mongoose";

export interface IMessage extends Document {
  booking: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  imageUrl?: string;
  voiceUrl?: string;
  readAt?: Date;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    imageUrl: { type: String },
    voiceUrl: { type: String },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Message = model<IMessage>("Message", messageSchema);
