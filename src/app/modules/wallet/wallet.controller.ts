import { Request, Response } from "express";
import { WalletService } from "./wallet.service";

const getSingleWallet = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    const wallet = await WalletService.getWalletByIdFromDB(ownerId as string);

    res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      data: wallet,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const WalletController = {
  getSingleWallet,
};
