import { model, Schema } from "mongoose";
import { TUser } from "./user.interface";

const user_schema = new Schema<TUser>(
  {
    fullName: { type: String, required: true },
    profileImage: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    comfirmPassword: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "solo_nurse", "clinic", "admin"],
      required: true,
    },
    fcmToken: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isMobileVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeForNumber: { type: String, default: null },
    isAdminVerified: { type: Boolean, default: false },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    ipAddress: { type: String, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export const User_Model = model("user", user_schema);
