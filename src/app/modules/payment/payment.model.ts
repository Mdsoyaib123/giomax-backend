import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    appointmentType: {
      type: String,
      enum: ["CLINIC", "SOLO_NURSE"],
      required: true,
    },

    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    receiverId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    receiverType: {
      type: String,
      enum: ["CLINIC", "SOLO_NURSE"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    bogOrderId: String,

    status: {
      type: String,
      enum: ["INITIATED", "PAID", "FAILED", "REFUNDED"],
      default: "INITIATED",
    },

    refundStatus: {
      type: String,
      enum: ["NONE", "REQUESTED", "APPROVED", "REFUNDED", "REJECTED"],
      default: "NONE",
    },

    refundedAt: Date,
  },
  { timestamps: true }
);

export const Payment_Model = model("Payment", paymentSchema);
