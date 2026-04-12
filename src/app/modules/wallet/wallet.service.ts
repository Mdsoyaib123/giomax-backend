import { Types } from "mongoose";
import { Wallet_Model } from "./wallet.model";

const getWalletByIdFromDB = async (ownerId: string) => {
  if (!Types.ObjectId.isValid(ownerId)) {
    throw new Error("Invalid wallet ID");
  }

  const wallet = await Wallet_Model.findOne({ ownerId });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return wallet;
};

export const WalletService = {
  getWalletByIdFromDB,
};
