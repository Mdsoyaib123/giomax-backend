import { Schema, model } from "mongoose";

const refundSchema = new Schema(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true, // one refund per payment
    },

    appointmentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    appointmentType: {
      type: String,
      enum: ["CLINIC", "SOLO_NURSE"],
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "REFUNDED"],
      default: "PENDING",
    },

    reviewedAt: Date,
  },
  { timestamps: true }
);

export const Refund_Model = model("Refund", refundSchema);
