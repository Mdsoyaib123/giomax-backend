import { doctorAppointment_Model } from "../doctorAppointment/doctorAppointment.model";
import { soloNurseAppoinment_Model } from "../soloNurseAppoinment/soloNurseAppoinment.model";
import { Patient_Model } from "../patient/patient.model";
import { Refund_Model } from "./refund.model";
import { Payment_Model } from "../payment/payment.model";
import { sendNotification } from "../../utils/notificationHelper";
import { sendEmail } from "../../utils/sendEmail";

interface TRefundPayload {
  paymentId: string;
  appointmentId: string;
  patientId: string;
  appointmentType: "CLINIC" | "SOLO_NURSE";
  reason: string;
}

// User requests refund
const createRefund = async (payload: TRefundPayload) => {
  console.log("paylaod", payload);
  const user = await Patient_Model.findById(payload.patientId);
  if (!user) throw new Error("User not found");

  const payment = await Payment_Model.findById(payload.paymentId);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "PAID")
    throw new Error("Only paid payments can be refunded");
  if (payment.refundStatus !== "NONE")
    throw new Error("Refund already requested");

  let appointment: any = null;
  if (payload.appointmentType === "CLINIC") {
    console.log("hit in clinic block");
    appointment = await doctorAppointment_Model.findOne({
      _id: payload.appointmentId,
    });
  } else {
    console.log("hit in nurse block");
    appointment = await soloNurseAppoinment_Model.findOne({
      _id: payload.appointmentId,
    });
  }

  if (!appointment) throw new Error("Appointment not found");

  const refund = await Refund_Model.create({
    paymentId: payload.paymentId,
    appointmentId: payload.appointmentId,
    patientId: payload.patientId,
    appointmentType: payload.appointmentType,
    reason: payload.reason,
  });

  payment.refundStatus = "REQUESTED";
  await payment.save();

  appointment.isRefunded = "refund-requested";
  await appointment.save();

  return refund;
};

const getAllRefunds = async () => {
  return await Refund_Model.find()
    .populate("paymentId")
    .populate({
      path: "patientId",
      select:
        "phoneNumber gender age bloodGroup nidFrontImageUrl nidBackImageUrl", // 👈 Patient fields
      populate: {
        path: "userId",
        select: "fullName email profileImage", // 👈 User fields
      },
    })
    .sort({ createdAt: -1 });
};

// Get refunds by user
const getRefundsByUserId = async (patientId: string) => {
  return await Refund_Model.find({ patientId: patientId })
    .populate("paymentId")
    .populate({
      path: "patientId",
      select:
        "phoneNumber gender age bloodGroup nidFrontImageUrl nidBackImageUrl",
      populate: {
        path: "userId",
        select: "fullName email profileImage", // 👈 User fields
      },
    })
    .sort({ createdAt: -1 });
};

// Admin approves or rejects refund request
const acceptOrRejectRefund = async (
  refundId: string,
  status: "APPROVED" | "REJECTED",
) => {
  console.log(refundId, status);
  const refund = await Refund_Model.findById(refundId);

  console.log("refund", refund);

  if (!refund) throw new Error("Refund request not found");
  if (refund.status !== "PENDING") throw new Error("Refund already processed");

  refund.status = status;
  refund.reviewedAt = new Date();
  await refund.save();

  console.log("refund after update", refund);

  const payment = await Payment_Model.findById(refund.paymentId);
  console.log("payment ", payment);
  if (!payment) throw new Error("Payment not found");

  payment.refundStatus = status === "APPROVED" ? "APPROVED" : "REJECTED";
  await payment.save();

  let appointment: any = null;
  if (refund.appointmentType === "CLINIC") {
    appointment = await doctorAppointment_Model.findById(refund.appointmentId);
  } else if (refund.appointmentType === "SOLO_NURSE") {
    appointment = await soloNurseAppoinment_Model.findById(
      refund.appointmentId,
    );
  }

  if (appointment) {
    appointment.isRefunded =
      status === "APPROVED" ? "refunded" : "refund-rejected";
    await appointment.save();
  }

  if (refund.status === "APPROVED") {
    const patient = await Patient_Model.findById(refund.patientId);
    if (!patient?.userId) return;

    await sendEmail({
      to: patient.userId.toString(), // ideally use patient email, not userId
      subject: "Refund Approved",
      text: `Your refund request for payment ${payment._id} has been approved.`,
    });
  }
  if (refund.status === "REJECTED") {
    const patient = await Patient_Model.findById(refund.patientId);
    if (!patient?.userId) return;

    await sendEmail({
      to: patient.userId.toString(), // ideally use patient email, not userId
      subject: "Refund Rejected",
      text: `Your refund request for payment ${payment._id} has been rejected.`,
    });
  }

  return refund;
};

export const RefundService = {
  createRefund,
  getAllRefunds,
  getRefundsByUserId,
  acceptOrRejectRefund,
};
