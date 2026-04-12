import express from "express";
import { WithdrawRequestController } from "./withdrowRequest.controller";

const router = express.Router();

/**
 * User (Clinic / Solo Nurse)
 */
router.post("/create", WithdrawRequestController.createWithdrawRequest);
router.get(
  "/getWithdrawRequests/me",
  WithdrawRequestController.getMyWithdrawRequests
);

/**
 * Admin
 */

router.get("/getAll/admin", WithdrawRequestController.getAllWithdrawRequests);
router.get("/getSingle/:withdrawId", WithdrawRequestController.getSingleWithdrawRequest);
router.patch(
  "/markAsPaid/:withdrawId",
  WithdrawRequestController.markWithdrawAsPaid
);
router.patch("/reject/:id", WithdrawRequestController.rejectWithdrawRequest);

export const WithdrawRequestRoutes = router;
