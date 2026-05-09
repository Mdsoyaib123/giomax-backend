import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import globalErrorHandler from "./app/middlewares/global_error_handler";
import notFound from "./app/middlewares/not_found_api";
import appRouter from "./routes";
import { User_Model } from "./app/modules/user/user.schema";
import bcrypt from "bcrypt";
import { configs } from "./app/configs";
import axios from "axios";
import { getAccessToken } from "./app/utils/BankAccessToken";
const bodyParser = require("body-parser");

const app = express();

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://medconnect.com.ge",
      "https://admin.medconnect.com.ge",
      "https://www.medconnect.com.ge",
      "*"
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", appRouter);

// ------------------------- BoG Payment Integration ------------------ //
const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL || "http://localhost:5000";

async function createClinicPayment({
  appointmentId,
  clinicId,
  patientId,
}: any) {
  // Example amount (replace later with DB value)
  const totalAmount = 100; // GEL

  // Mock local payment record (replace with DB later)
  const payment = {
    _id: "mockPaymentId12345",
  };

  // 1. Get OAuth token
  const token = await getAccessToken();

  // 2. BoG request body (MATCHES OFFICIAL DOC)
  const body = {
    callback_url: `${BACKEND_BASE_URL}/payment/callback`,
    external_order_id: payment._id,

    purchase_units: {
      currency: "GEL",
      total_amount: totalAmount,
      basket: [
        {
          quantity: 1,
          unit_price: totalAmount,
          product_id: appointmentId,
        },
      ],
    },

    redirect_urls: {
      success: `${BACKEND_BASE_URL}/payment/success?paymentId=${payment._id}`,
      fail: `${BACKEND_BASE_URL}/payment/fail?paymentId=${payment._id}`,
    },
  };

  // 3. Create order
  const res = await axios.post(
    "https://api.bog.ge/payments/v1/ecommerce/orders",
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Language": "en",
      },
    }
  );

  // console.log("payment response", res.data);

  /*
    Expected response contains:
    - id (BoG order id)
    - _links.redirect.href (payment page URL)
  */

  return res.data;
}

app.post("/start-clinic-payment", async (req, res) => {
  try {
    const order = await createClinicPayment(req.body);

    console.log("order", order);

    const approveUrl = order?._links?.redirect?.href;

    if (!approveUrl) {
      return res.status(500).json({
        message: "Payment redirect URL not found",
      });
    }

    res.json({ approveUrl });
  } catch (err: any) {
    console.error(err?.response?.data || err);
    res.status(500).json({ message: "Payment initiation failed" });
  }
});

app.post("/payment/callback", async (req, res) => {
  const data = req.body;

  console.log("payment callback", data);

  // const paymentId = data.shop_order_id;
  // const status = data.status; // SUCCESS / FAILED

  // const payment = await Payment.findById(paymentId);
  // if (!payment) return res.sendStatus(404);

  // if (status === "SUCCESS") {
  //   payment.status = "PAID";

  //   // confirm appointment
  //   // await Appointment.findByIdAndUpdate(payment.appointmentId, {
  //   //   status: "CONFIRMED",
  //   // });
  // } else {
  //   payment.status = "FAILED";
  // }

  // await payment.save();
  res.sendStatus(200);
});

app.get("/payment/success", (req, res) => {
  const paymentId = req.query.paymentId;
  res.send("Payment successful");
});

app.get("/payment/fail", (req, res) => {
  const paymentId = req.query.paymentId;
  res.send("Payment failed");
});

app.post("/payment/callback", (req, res) => {
  console.log("BOG webhook:", req.body);
  res.sendStatus(200);
});

// ------------------------- End of BoG Payment Integration ------------------ //

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server is running successfully!",
  });
});

// Create Default Admin
export const createDefaultSuperAdmin = async () => {
  try {
    const existingAdmin = await User_Model.findOne({
      email: "admin@gmail.com",
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        "admin@123",
        Number(configs.bcrypt_salt_rounds)
      );

      await User_Model.create({
        fullName: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        comfirmPassword: hashedPassword,
        role: "admin",
        isVerified : true,
        isAdminVerified : true,
        isMobileVerified : true,
      });
      console.log("✅ Default Admin created.");
    } else {
      console.log("ℹ️ Admin already exists.");
    }
  } catch (error) {
    console.log("❌ Failed to create default admin:", error);
  }
};

createDefaultSuperAdmin();

// global error handler
app.use(globalErrorHandler);
app.use(notFound);


export default app;

