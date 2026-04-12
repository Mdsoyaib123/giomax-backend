import mongoose from "mongoose";
import { Wallet_Model } from "../wallet/wallet.model";
import { WithdrawRequest_Model } from "./withdrowRequest.model";
import { Clinic_Model } from "../clinic/clinic.model";
import { SoloNurse_Model } from "../soloNurse/soloNurse.model";
import { sendNotification } from "../../utils/notificationHelper";

/**
 * Create withdraw request
 */
const createWithdrawRequest = async (payload: any) => {
  const { walletId, ownerId, ownerType, amount, cardNumber } = payload;

  // console.log("payload", payload);

  let user = null;

  if (ownerType === "CLINIC") {
    user = await Clinic_Model.findOne({ _id: ownerId });
    if (!user) throw new Error("Clinic not found");
  } else if (ownerType === "SOLO_NURSE") {
    user = await SoloNurse_Model.findOne({ _id: ownerId });
    if (!user) throw new Error("Solo Nurse not found");
  }

  // console.log("withdrawAddress", withdrawAddress);

  // Set commission based on owner type
  const commissionRate =
    ownerType === "CLINIC" ? 9 : ownerType === "SOLO_NURSE" ? 15 : 0;
  const commission = (amount * commissionRate) / 100;

  const wallet = await Wallet_Model.findOne({
    _id: walletId,
    ownerType,
  });

  if (!wallet) throw new Error("Wallet not found");

  if (wallet.pendingBalance < amount - commission) {
    throw new Error("Insufficient balance");
  }

  // Deduct balance
  wallet.pendingBalance -= amount;
  wallet.balance += amount - commission;

  await wallet.save();

  console.log('wallet', wallet);
console.log('user', user);
  console.log('iban number ', user?.paymentAndEarnings?.withdrawalMethods.IBanNumber);

  return await WithdrawRequest_Model.create({
    walletId,
    ownerId,
    ownerUserId: user?.userId,
    ownerType,
    amount,
    IBanNumber: user?.paymentAndEarnings?.withdrawalMethods?.IBanNumber || null,
  });
};

/**
 * Get withdraw requests by owner
 */
const getWithdrawRequestsByOwner = async (ownerId: string) => {
  return await WithdrawRequest_Model.find({ ownerId }).sort({
    createdAt: -1,
  });
};

/**
 * Admin: get all withdraw requests
 */
const getAllWithdrawRequests = async () => {
  return await WithdrawRequest_Model.find()
    .populate("walletId")
    .populate("ownerUserId", "fullName email")
    .sort({ createdAt: -1 });
};

const getSingleWithdrawRequest = async (withdrawId: string) => {
  return await WithdrawRequest_Model.findById(withdrawId);
};

/**
 * Admin: mark as PAID
 */
const markAsPaid = async (withdrawId: string) => {
  const withdraw = await WithdrawRequest_Model.findById(withdrawId);

  if (!withdraw) throw new Error("Withdraw request not found");
  if (withdraw.status !== "PENDING") {
    throw new Error("Withdraw already processed");
  }

  if (withdraw?.ownerType === "CLINIC") {
    const userId = await Clinic_Model.findById(withdraw.ownerId)
      .select("userId")
      .populate("userId");
    console.log("userId ", userId?.userId._id);
    await sendNotification(
      userId?.userId?._id?.toString() || "",
      "Withdraw Request",
      `$${withdraw.amount} withdraw request approved`,
      "notification",
    );
  } else if (withdraw?.ownerType === "SOLO_NURSE") {
    const userId = await SoloNurse_Model.findById(withdraw.ownerId)
      .select("userId")
      .populate("userId");
    console.log("userId ", userId?.userId._id);
    await sendNotification(
      userId?.userId?._id?.toString() || "",
      "Withdraw Request",
      `$${withdraw.amount} withdraw request approved`,
      "notification",
    );
  }

  withdraw.status = "PAID";
  await withdraw.save();

  return withdraw;
};

/**
 * Admin: reject withdraw
 */
const rejectWithdraw = async (withdrawId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdraw =
      await WithdrawRequest_Model.findById(withdrawId).session(session);
    if (!withdraw) throw new Error("Withdraw request not found");

    if (withdraw.status !== "PENDING") {
      throw new Error("Withdraw already processed");
    }

    const wallet = await Wallet_Model.findById(withdraw.walletId).session(
      session,
    );
    if (!wallet) throw new Error("Wallet not found");

    // Refund amount
    wallet.balance += withdraw.amount;
    wallet.pendingBalance -= withdraw.amount;
    withdraw.status = "REJECTED";

    await wallet.save({ session });
    await withdraw.save({ session });

    await session.commitTransaction();
    session.endSession();

    return withdraw;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const WithdrowRequestService = {
  createWithdrawRequest,
  getWithdrawRequestsByOwner,
  getAllWithdrawRequests,
  getSingleWithdrawRequest,
  markAsPaid,
  rejectWithdraw,
};
