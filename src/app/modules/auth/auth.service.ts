import { AppError } from "../../utils/app_error";
import { TAccount, TLoginPayload, TRegisterPayload } from "./auth.interface";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { User_Model } from "../user/user.schema";
import { jwtHelpers } from "../../utils/JWT";
import { configs } from "../../configs";
import { JwtPayload, Secret } from "jsonwebtoken";

import { passwordResetModel } from "./auth.schema";
import { sendEmail } from "../../utils/sendEmail";
import { de, fa } from "zod/v4/locales";

// login user
const login_user_from_db = async (
  payload: TLoginPayload,
  ipAddress: string,
) => {
  const isExistAccount: any = await User_Model.findOne({
    email: payload?.email,
  });

  if (isExistAccount) {
    await User_Model.findOneAndUpdate(
      { email: payload?.email },
      { ipAddress: ipAddress },
      { new: true },
    );
  }

  if (
    isExistAccount.isVerified === false &&
    isExistAccount.role !== "doctor" &&
    isExistAccount.role !== "admin"
  ) {
    throw new AppError("Account not verified", httpStatus.UNAUTHORIZED);
  }
  if (
    isExistAccount.role !== "patient" &&
    isExistAccount.role !== "admin" &&
    isExistAccount.role !== "doctor" &&
    isExistAccount.isAdminVerified === false
  ) {
    throw new AppError("Require admin approval", httpStatus.UNAUTHORIZED);
  }

  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    isExistAccount?.password,
  );
  if (!isPasswordMatch) {
    throw new AppError("Invalid password", httpStatus.UNAUTHORIZED);
  }

  await User_Model.findOneAndUpdate(
    { email: payload.email },
    {
      fcmToken: payload?.fcmToken,
      latitude: payload?.latitude,
      longitude: payload?.longitude,
    },

    { new: true },
  );

  const accessToken = jwtHelpers.generateToken(
    {
      userId: isExistAccount._id,
      email: isExistAccount.email,
      role: isExistAccount.role,
    },
    configs.jwt.accessToken_secret as Secret,
    configs.jwt.accessToken_expires as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      userId: isExistAccount._id,
      email: isExistAccount.email,
      role: isExistAccount.role,
    },
    configs.jwt.refreshToken_secret as Secret,
    configs.jwt.refreshToken_expires as string,
  );
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    role: isExistAccount.role,
    userId: isExistAccount._id,
  };
};

const refresh_token_from_db = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      configs.jwt.refreshToken_secret as Secret,
    );
  } catch (err) {
    throw new Error("You are not authorized!");
  }

  const userData: any = await User_Model.findOne({
    email: decodedData.email,
  });

  const accessToken = jwtHelpers.generateToken(
    { userId: userData?._id, email: userData?.email, role: userData?.role },
    configs?.jwt.accessToken_secret as string,
    configs.jwt.accessToken_expires as string,
  );

  return { accessToken };
};

const change_password_from_db = async (
  user: JwtPayload,
  payload: { oldPassword: string; newPassword: string },
) => {
  const isExistAccount: any = await User_Model.findOne({
    _id: user.userId,
  });

  if (!isExistAccount) {
    throw new AppError("Account not found", httpStatus.NOT_FOUND);
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.oldPassword,
    isExistAccount?.password as string,
  );

  // console.log("match pass",isCorrectPassword);

  if (!isCorrectPassword) {
    throw new AppError("Old password is incorrect", httpStatus.UNAUTHORIZED);
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await User_Model.findOneAndUpdate(
    { email: isExistAccount.email },
    {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  );

  return "Password changed successful.";
};

export const requestPasswordReset = async (email: string) => {
  const user = await User_Model.findOne({ email });
  if (!user) throw new Error("User not found");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Remove old code if exists
  await passwordResetModel.deleteMany({ email });

  // Store new code
  await passwordResetModel.create({ email, code, expiresAt });

  await sendEmail({
    to: email,
    subject: "Your Password Reset Code",
    text: `Your password reset code is ${code}. It will expire in 10 minutes.`,
  });

  console.log(email, code, "====="); // for debug
  return { email };
};

export const verifyResetCode = async (email: string, code: string) => {
  const entry = await passwordResetModel.findOne({ email });
  console.log(entry, "entry--------");
  if (!entry) throw new Error("No reset code found. Please request again.");

  if (entry.expiresAt.getTime() < Date.now()) {
    await passwordResetModel.deleteOne({ email });
    throw new Error("Reset code expired. Please request again.");
  }

  if (Number(entry.code) !== Number(code)) {
    throw new Error("Invalid reset code.");
  }

  return { verified: true };
};

export const resetPassword = async (
  email: string,
  code: any,
  newPassword: string,
) => {
  const entry = await passwordResetModel.findOne({ email });
  console.log("reset password", entry);

  if (Number(entry?.code) !== Number(code)) {
    throw new Error("Invalid reset code.");
  }
  const user = await User_Model.findOne({ email });
  if (!user) throw new Error("User not found");

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();

  await passwordResetModel.deleteOne({ email });
};

export const auth_services = {
  login_user_from_db,
  refresh_token_from_db,
  change_password_from_db,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
};
