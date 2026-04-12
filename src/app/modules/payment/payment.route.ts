import express from "express";
import { PaymentController } from "./payment.controller";

const router = express.Router();

router.post("/clinic", PaymentController.startClinicPayment);
router.post("/solo-nurse", PaymentController.startSoloNursePayment);

router.post("/bog/callback", PaymentController.bogCallbackController);

router.get("/success", PaymentController.paymentSuccess);
router.get("/fail", PaymentController.paymentFail);
// New route for getting paymentId for refund
router.get("/get-payment-id", PaymentController.getPaymentIdForRefund);

// admin
router.get("/admin/payment-data", PaymentController.adminPaymentData);
router.get("/admin/get-all-transation", PaymentController.getAllTransactions);

export const PaymentRoutes = router;


