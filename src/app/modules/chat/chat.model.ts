import mongoose from "mongoose";

const customOfferSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    soloNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "soloNurse",
      required: true,
    },

    homeAddress: {
      type: String,
    },

    preferenceDate: {
      type: [Date],
      required: true,
    },

    preferenceTime: {
      type: String,
      required: true,
    },

    subService: {
      type: String,
      required: true,
    },
    appointmentFee: {
      type: Number,
      required: true,
      min: 0,
    },
    isAccept: {
      type: Boolean,
      default: null,
    },
  },
  { _id: false }, // prevents extra _id inside chat
);

const chatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    receiverType: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    chatType: {
      type: String,
      enum: ["doctor_patient", "patient_clinic", "nurse_patient", "user_admin"],
      required: true,
    },
    message: {
      type: String,
      default: null,
    },
    customOffer: {
      type: customOfferSchema,
      default: null,
    },
    document: {
      type: String,
      default: null,
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const ChatModel = mongoose.model("Chat", chatSchema);
