import express from "express";
import { WalletController } from "./wallet.controller";

const router = express.Router();

router.get("/getSingle/:ownerId", WalletController.getSingleWallet);




export const WalletRoutes = router;
