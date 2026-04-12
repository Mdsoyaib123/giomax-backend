import { model, Schema } from "mongoose";

const walletSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    ownerType: {
      type: String,
      enum: ["CLINIC", "SOLO_NURSE"],
      required: true,
    },

    balance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    withdrawAbleBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Wallet_Model = model("Wallet", walletSchema);
