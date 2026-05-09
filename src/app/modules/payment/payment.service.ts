import axios from "axios";
import { getAccessToken } from "../../utils/BankAccessToken";
import { Payment_Model } from "./payment.model";
import { Wallet_Model } from "../wallet/wallet.model";

// const createBoGOrder = async (payment: any) => {
//   const token = await getAccessToken();

//   const body = {
//     callback_url: `${process.env.BACKEND_URL}/api/v1/payment/bog/callback`,
//     external_order_id: payment._id.toString(),
//     purchase_units: {
//       currency: "GEL",
//       total_amount: payment.amount.toFixed(2),
//       basket: [
//         {
//           quantity: 1,
//           unit_price: payment.amount.toFixed(2),
//           product_id: payment.appointmentId.toString(),
//         },
//       ],
//     },
//     redirect_urls: {
//       success: `${process.env.BACKEND_URL}/api/v1/payment/success?paymentId=${payment._id}`,
//       fail: `${process.env.BACKEND_URL}/api/v1/payment/fail?paymentId=${payment._id}`,
//     },
//   };

//   const res = await axios.post(
//     "https://api.bog.ge/payments/v1/ecommerce/orders",
//     body,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         "Accept-Language": "en",
//       },
//     },
//   );

//   return res.data;
// };

type PaymentMethod = "card" | "google_pay" | "apple_pay";

const createBoGOrder = async (
  payment: any,
  method: PaymentMethod = "card",
  payToken?: string
) => {
  try {
    if (!payment?._id) throw new Error("Payment ID is missing");
    if (!payment?.amount) throw new Error("Payment amount is missing");
    if (!payment?.appointmentId) throw new Error("Appointment ID is missing");
    if (!process.env.BACKEND_URL) throw new Error("BACKEND_URL is missing");

    const Banktoken = await getAccessToken();

    const body: any = {
      callback_url: `${process.env.BACKEND_URL}/api/v1/payment/bog/callback`,
      external_order_id: payment._id.toString(),

      purchase_units: {
        currency: "GEL",
        total_amount: Number(payment.amount).toFixed(2),
        basket: [
          {
            quantity: 1,
            unit_price: Number(payment.amount).toFixed(2),
            product_id: payment.appointmentId.toString(),
          },
        ],
      },
    };

    if (method === "card") {
      body.redirect_urls = {
        success: `${process.env.BACKEND_URL}/api/v1/payment/success?paymentId=${payment._id}`,
        fail: `${process.env.BACKEND_URL}/api/v1/payment/fail?paymentId=${payment._id}`,
      };

      body.payment_method = ["card"];
    }

    if (method === "google_pay") {
      if (!payToken) {
        throw new Error("Google Pay token is required");
      }

      body.payment_method = ["google_pay"];
      body.config = {
        google_pay: {
          external: true,
          google_pay_token: payToken,
        },
      };
    }

    if (method === "apple_pay") {
      body.payment_method = ["apple_pay"];
      body.config = {
        apple_pay: {
          external: true,
        },
      };
    }

    const res = await axios.post(
      "https://api.bog.ge/payments/v1/ecommerce/orders",
      body,
      {
        headers: {
          Authorization: `Bearer ${Banktoken}`,
          "Content-Type": "application/json",
          "Accept-Language": "en",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("BoG order create failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      throw new Error(
        error.response?.data?.message ||
        error.response?.data?.error_description ||
        "Failed to create Bank of Georgia payment order"
      );
    }

    console.error("Payment order error:", error.message);
    throw error;
  }
};

const handleBoGCallbackService = async (payload: any) => {
  const external_order_id = payload?.body?.external_order_id;
  const status = payload?.body?.order_status?.key;

  const payment = await Payment_Model.findById(external_order_id);
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "PAID") return { message: "Already processed" };

  if (status === "completed") {
    payment.status = "PAID";
    await Wallet_Model.findOneAndUpdate(
      { ownerId: payment.receiverId, ownerType: payment.receiverType },
      { $inc: { pendingBalance: payment.amount } },
      { upsert: true, new: true },
    );
  } else {
    payment.status = "FAILED";
  }

  await payment.save();
  return { message: "Callback processed successfully" };
};

const getPaymentIdForRefund = async (
  appointmentId: string,
  appointmentType: "CLINIC" | "SOLO_NURSE",
) => {
  // console.log(appointmentId, appointmentType, "----------");
  const payment = await Payment_Model.findOne({
    appointmentId,
    appointmentType,
    // status: "PAID", // Only allow refund if payment was successful
    // refundStatus: "NONE", // Not refunded yet
  });

  // console.log("payment ", payment);

  if (!payment) {
    throw new Error("No eligible payment found for this appointment");
  }

  return payment._id.toString();
};

const adminPaymentData = async () => {
  const allPayment = await Payment_Model.find();
  const paymentsWithoutPaid = await Payment_Model.find({ status: "INITIATED" });
  const totalPayableAmount = paymentsWithoutPaid.reduce(
    (acc, p) => acc + p.amount,
    0,
  );

  const paymentsWithPaid = await Payment_Model.find({ status: "PAID" });
  const totalPayoutAmount = paymentsWithPaid.reduce(
    (acc, p) => acc + p.amount,
    0,
  );

  return {
    allPaymentTransactions: allPayment.length,
    totalPaidAmount: totalPayoutAmount,
    totalPayableAmount,
  };
};

const getAllTransactions = async () => {
  return await Payment_Model.find().sort({ createdAt: -1 });
};

export const PaymentService = {
  createBoGOrder,
  handleBoGCallbackService,
  adminPaymentData,
  getAllTransactions,
  getPaymentIdForRefund,
};
