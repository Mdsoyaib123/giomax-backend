import { sendEmail } from "../../utils/sendEmail";
import { Clinic_Model } from "../clinic/clinic.model";
import { Doctor_Model } from "../doctor/doctor.model";
import { doctorAppointment_Model } from "../doctorAppointment/doctorAppointment.model";
import { Patient_Model } from "../patient/patient.model";
import { Payment_Model } from "../payment/payment.model";
import { SoloNurse_Model } from "../soloNurse/soloNurse.model";
import { soloNurseAppoinment_Model } from "../soloNurseAppoinment/soloNurseAppoinment.model";
import { User_Model } from "../user/user.schema";

const getDashboardOverview = async () => {
  const [
    totalPatients,
    totalDoctors,
    totalClinics,
    totalSoloNurse,
    doctorAppointments,
    soloNurseAppointments,
    paidPayments,
  ] = await Promise.all([
    Patient_Model.countDocuments(),
    Doctor_Model.countDocuments(),
    Clinic_Model.countDocuments(),
    SoloNurse_Model.countDocuments(),
    doctorAppointment_Model.countDocuments(),
    soloNurseAppoinment_Model.countDocuments(),
    Payment_Model.find({
      status: "PAID",
    }),
  ]);

  let totalEarnings = 0;
  let adminEarnings = 0;

  for (const payment of paidPayments) {
    console.log("payment ", payment);
    const amount = payment.amount || 0;
    totalEarnings += amount;

    // ✅ Admin commission logic
    if (payment.appointmentType === "CLINIC") {
      adminEarnings += amount * 0.12; // 12%
    }

    if (payment.appointmentType === "SOLO_NURSE") {
      adminEarnings += amount * 0.09; // 9%
    }
  }
  const totalAppointments = doctorAppointments + soloNurseAppointments;

  return {
    totalPatients,
    totalDoctors,
    totalClinics,
    totalSoloNurse,
    totalAppointments,
    totalEarnings,
    adminEarnings,
  };
};

const udpateAdmin = async (
  adminId: string,
  payload: any,
  profileImageUrl: string
) => {
  console.log(adminId, payload, profileImageUrl);
  const admin = await User_Model.findOneAndUpdate(
    { _id: adminId },
    {
      $set: {
        fullName: payload?.fullName,
        profileImage: profileImageUrl,
      },
    }
  );

  return admin;
};
const assaignSoloNurseProfilebadge = async (
  soloNurseId: string,
  adminAssignProfileImageBadgeUrl: string
) => {
  const soloNurse = await SoloNurse_Model.findOneAndUpdate(
    { _id: soloNurseId },
    {
      $set: {
        adminAssignProfileImageBadge: adminAssignProfileImageBadgeUrl,
      },
    },
    { new: true }
  );

  return soloNurse;

};

const AdminEmailSupport = async (payload: {
  userEmail: string; // user email
  subject: string;
  message: string;
}) => {
  const { userEmail, subject, message } = payload;
  await sendEmail({
    to: process.env.ADMIN_EMAIL!, // admin email
    subject: `[User Support] ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; padding: 24px; border-radius: 6px;">
                  <tr>
                    <td>
                      <h2 style="margin-top: 0; color: #333;">
                        New Support Message from User
                      </h2>

                      <p style="color: #555; line-height: 1.6;">
                        <strong>From:</strong> ${userEmail}
                      </p>

                      <p style="color: #555; line-height: 1.6;">
                        <strong>Subject:</strong> ${subject}
                      </p>

                      <hr style="margin: 20px 0;" />

                      <p style="color: #555; line-height: 1.6; white-space: pre-line;">
                        ${message}
                      </p>

                      <hr style="margin: 24px 0;" />

                      <p style="font-size: 12px; color: #999;">
                        This message was sent from the user support form.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
};

export const DashboardService = {
  getDashboardOverview,
  udpateAdmin,
  assaignSoloNurseProfilebadge,
  AdminEmailSupport,
};
