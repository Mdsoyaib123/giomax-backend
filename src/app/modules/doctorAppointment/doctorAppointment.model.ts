import mongoose, { Schema, model } from "mongoose";

const appointmentSchema = new Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["inClinic", "online"],
      required: true,
    },
    visitingType: {
      type: String,
      enum: ["fristVisit", "followUp"],
      required: true,
    },
    reasonForVisit: {
      type: String,
      required: true,
    },
    followUpDetails: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    prefarenceDate: {
      type: Date,
      required: true,
    },
    prefarenceTime: {
      type: String,
      required: true,
    },
    appoinmentFee: {
      type: Number,
      default: 0,
    },
    isRefunded: {
      type: String,
      enum: ['refund-requested', 'refunded', 'no-refund', 'refund-rejected'],
      default: 'no-refund',
    },
  },
  {
    timestamps: true,
  }
);

// Format date in response
appointmentSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    if (ret.prefarenceDate) {
      ret.prefarenceDate = ret.prefarenceDate.toISOString().split("T")[0];
    }
    return ret;
  },
});

export const doctorAppointment_Model = model(
  "doctorAppointment",
  appointmentSchema
);
