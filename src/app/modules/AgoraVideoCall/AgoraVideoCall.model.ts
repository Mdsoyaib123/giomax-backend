import mongoose, { Schema } from "mongoose";
import { ICall } from "./AgoraVideoCall.interface";

const callSchema = new Schema<ICall>(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    callerId: {
      type: String,
      required: true,
      index: true,
    },
    receiverId: {
      type: String,
      required: true,
      index: true,
    },

    // 🔑 Agora UIDs
    callerUid: {
      type: Number,
      required: true,
    },
    receiverUid: {
      type: Number,
    },

    status: {
      type: String,
      enum: ["ringing", "accepted", "rejected", "ended", "missed"], // ✅ FIX
      default: "ringing",
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const videoCall_model = mongoose.model<ICall>("videoCall", callSchema);
