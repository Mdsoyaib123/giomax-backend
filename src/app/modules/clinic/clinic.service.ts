import { TClinic } from "./clinic.interface";
import mongoose, { Types } from "mongoose";
import { User_Model } from "../user/user.schema";
import { Doctor_Model } from "../doctor/doctor.model";
import { doctorAppointment_Model } from "../doctorAppointment/doctorAppointment.model";

import { Wallet_Model } from "../wallet/wallet.model";
import { WithdrawRequest_Model } from "../withdrowRequest/withdrowRequest.model";
import { Clinic_Model } from "./clinic.model";

const getAllClinics = async () => {
  const result = await Clinic_Model.find()
    .populate("userId") // clinic owner
    .populate({
      path: "reviews.patientId",
      select: "userId", // select patient.userId
      populate: {
        path: "userId",
        model: "user", // ensure correct model name
        select: "fullName profileImage", // fields you want
      },
    })
    .sort({ createdAt: -1 });

  return result;
};

const getClinicById = async (userId: string) => {
  const result = await Clinic_Model.findOne({ userId })
    .populate("userId")
    .populate({
      path: "reviews.patientId",
      select: "userId", // select patient.userId
      populate: {
        path: "userId",
        model: "user", // ensure correct model name
        select: "fullName profileImage", // fields you want
      },
    });
  return result;
};
const getClinicAppointments = async (
  clinicId: string,
  status?: string,
  doctorId?: string,
  prefarenceDate?: Date,
  serviceType?: string,
) => {
  // console.log('data',prefarenceDate);
  let filter: any = { clinicId };

  // Normal status filtering (exclude upcoming)
  if (status && status !== "upcoming") {
    filter.status = status;
  }

  if (doctorId) {
    filter.doctorId = doctorId;
  }

  if (prefarenceDate) {
    filter.prefarenceDate = prefarenceDate;
  }

  if (serviceType) {
    filter.serviceType = serviceType;
  }

  // Fetch from DB
  let appointments = await doctorAppointment_Model
    .find(filter)
    .populate({
      path: "patientId",
      select:
        "_id userId phoneNumber nationalIdNumber gender age bloodGroup nidBackImageUrl nidFrontImageUrl",
      populate: {
        path: "userId",
        model: "user",
        select: "fullName role email profileImage",
      },
    })
    .populate({
      path: "doctorId",
      select: "_id userId",
      populate: {
        path: "userId",
        model: "user",
        select: "fullName",
      },
    })
    .sort({ createdAt: -1 });

  // ✅ UPCOMING LOGIC (DATE + TIME)
  if (status === "upcoming") {
    const now = new Date();

    appointments = appointments.filter((item: any) => {
      const date = item.prefarenceDate; // Date object
      const time = item.prefarenceTime; // "10:30 AM"

      const appointmentDateTime = new Date(
        `${date.toISOString().split("T")[0]} ${time}`,
      );

      return appointmentDateTime > now;
    });

    // ✅ Sort nearest first
    appointments.sort((a: any, b: any) => {
      const ad = new Date(
        `${a.prefarenceDate.toISOString().split("T")[0]} ${a.prefarenceTime}`,
      );
      const bd = new Date(
        `${b.prefarenceDate.toISOString().split("T")[0]} ${b.prefarenceTime}`,
      );

      // 🔥 DESC order (latest first)
      return bd.getTime() - ad.getTime();
    });
  }

  return appointments;
};
const getAllAppoinmentsPrefarenceDate = async (clinicId: string) => {
  const appointments = await doctorAppointment_Model
    .find({ clinicId })
    .distinct("prefarenceDate");

  return appointments.map((date: Date) => date.toISOString().split("T")[0]);
};

const getClinicDoctors = async (clinicId: string, appointmentType?: any) => {
  console.log("clinti id 0", clinicId);
  if (appointmentType) {
    const result = await Doctor_Model.find({
      clinicId,
      appointmentType: appointmentType,
    })
      .populate("userId")
      .populate("clinicId")
      .sort({ createdAt: -1 });
    return result;
  } else {
    const result = await Doctor_Model.find({ clinicId })
      .populate("userId")
      .populate("clinicId");
    return result;
  }
};

const getClinicPatients = async (clinicId: string) => {
  const appointmentRecords = await doctorAppointment_Model
    .find({
      clinicId,
      status: {
        $in: ["confirmed", "completed", "rejected", "cancelled"],
      },
    })
    .populate({
      path: "patientId",
      select: "_id userId age bloodGroup gender phoneNumber nationalIdNumber",
      populate: {
        path: "userId",
        model: "user",
        select: "fullName role email profileImage",
      },
    })
    .populate({
      path: "doctorId",
      select: "_id userId",
    })
    .sort({ createdAt: -1 });

  // 🔹 Filter unique patients by patientId
  const uniquePatientsMap = new Map();
  appointmentRecords.forEach((appt) => {
    if (appt.patientId) {
      uniquePatientsMap.set(appt.patientId._id.toString(), appt.patientId);
    }
  });

  // Return array of unique patient objects
  return Array.from(uniquePatientsMap.values());
};

const updateClinicBasic = async (
  userId: string,
  payload: any,
  profileImageUrl: string,
) => {
  const {
    fullName,
    email,
    phoneNumber,
    servicesOffered,
    clinicDescription,
    address,
    bussinessIdentificationNumber,
  } = payload;

  const servicesOfferedData = servicesOffered
    ?.split(",")
    .map((service: string) => service.trim());

  console.log("user id form service ", userId);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updateData: any = { fullName };

    if (profileImageUrl) {
      updateData.profileImage = profileImageUrl;
    }

    // step-1: Update user model
    const updatedUser = await User_Model.findByIdAndUpdate(userId, updateData, {
      new: true,
      session,
    });

    if (!updatedUser) {
      throw new Error("User not found!");
    }

    // step-2: Update clinic model
    const updatedClinic = await Clinic_Model.findOneAndUpdate(
      { userId },
      {
        phoneNumber,
        servicesOffered: servicesOfferedData,
        clinicDescription,
        address,
        bussinessIdentificationNumber,
      },
      { new: true, session },
    ).populate("userId");

    if (!updatedClinic) {
      throw new Error("Clinic profile not found!");
    }

    // commit both updates
    await session.commitTransaction();
    session.endSession();

    return updatedClinic;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.log(error);
  }
};
const updateClinicResponsiblePersonInfo = async (
  userId: string,
  payload: any,
) => {
  const { name, position, email, contactNumber, personalIdNumber } = payload;

  const clinic = await Clinic_Model.findOneAndUpdate(
    { userId },
    {
      responsiblePersonInformation: {
        name,
        position,
        email,
        contactNumber,
        personalIdNumber,
      },
    },
    { new: true },
  );

  return clinic;
};
const uploadCertificate = async (userId: string, payload: any) => {
  // console.log("payload from service ", payload);

  const clinic = await Clinic_Model.findOne({ userId });

  if (!clinic) {
    throw new Error("Clinic not found for this user");
  }

  const newCertificate = {
    uploadCertificates: payload.certificateUrl, // correct field name
    certificateType: payload.data?.certificateType,
    certificateName: payload.data?.certificateName,
  };

  // console.log("service ", newCertificate);

  const updatedCertificates = await Clinic_Model.findOneAndUpdate(
    { userId },
    {
      $push: { clinicCertificates: newCertificate },
      medicalLicenseNumber: payload.data?.medicalLicenseNumber, // optional
    },
    { new: true },
  );
  return updatedCertificates;
};
const deleteCertificate = async (userId: string, certificateId: string) => {
  // Find the user first
  const nurse = await Clinic_Model.findOne({ userId });

  if (!nurse) {
    throw new Error("Solo nurse not found for this user");
  }

  console.log("service form clinic", userId, certificateId);
  // Perform delete using $pull
  const updated = await Clinic_Model.findOneAndUpdate(
    { userId },
    {
      $pull: {
        clinicCertificates: { _id: certificateId },
      },
    },
    { new: true },
  );

  return updated;
};

const availabilitySettings = async (userId: string, payload: any) => {
  console.log("payload from service ", payload);

  const availability = {
    startTime: payload?.startTime,
    endTime: payload?.endTime,
    workingDays: payload?.workingDays,
    appointmentType: payload?.appointmentType,
  };

  const clinic = await Clinic_Model.findOne({ userId });

  if (!clinic) {
    throw new Error("Clinic not found for this user");
  }

  const updatedCertificates = await Clinic_Model.findOneAndUpdate(
    { userId },
    {
      $set: { availability },
    },
    { new: true },
  );
  return updatedCertificates;
};
const addReviews = async (userId: string, payload: any) => {
  const clinic: any = await Clinic_Model.findOne({ userId });
  if (!clinic) {
    throw new Error("Clinic not found for this user");
  }

  clinic.reviews.push(payload);
  const totalRatings = clinic.reviews.reduce(
    (sum: any, review: { rating: any }) => sum + (review.rating || 0),
    0,
  );
  clinic.avarageRating = totalRatings / clinic.reviews.length;

  await clinic.save();
  return clinic;
};

const addNewPaymentMethod = async (userId: string, payload: any) => {
  const clinic = await Clinic_Model.findOne({ userId });

  if (!clinic) {
    throw new Error("Clinic not found for this user");
  }

  const newPaymentMethod = {
    IBanNumber: payload.IBanNumber,
  };

  console.log("newPaymentMethod", newPaymentMethod);

  const updatedPaymentMethods = await Clinic_Model.findOneAndUpdate(
    { userId },
    {
      $set: { "paymentAndEarnings.withdrawalMethods": newPaymentMethod },
    },
    { new: true },
  );
  return updatedPaymentMethods;
};

const deleteClinic = async (userId: string) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existClinic = await Clinic_Model.findOne({ userId });

      if (existClinic?._id) {
        const walletBalance = await Wallet_Model.findOne({
          ownerId: existClinic?._id,
        });
        if (walletBalance && walletBalance.withdrawAbleBalance > 0) {
          throw new Error(
            "You has withdrawAble Amount, please withdraw first.",
          );
        }
      }


    const user = await User_Model.findOneAndDelete(
      { _id: userId },
      { session },
    );

    if (!user) {
      throw new Error("User not found");
    }

    const clinic = await Clinic_Model.findOneAndDelete({ userId }, { session });

    await session.commitTransaction();
    session.endSession();

    return clinic;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const getAppoinmentTimeBasedOnDateForClinic = async (
  date: Date,
  id: string,
) => {
  // console.log("date and id ", date, id);

  const appointments = await doctorAppointment_Model
    .find({
      clinicId: id,
      prefarenceDate: new Date(date),
    })
    .populate({
      path: "patientId",
      select: "_id userId gender age bloodGroup",
      populate: {
        path: "userId",
        model: "user", // ensure correct model name
        select: "fullName  role", // fields you want
      },
    })
    .populate({
      path: "doctorId",
      select: "_id userId  specialization",
      populate: {
        path: "userId",
        model: "user", // ensure correct model name
        select: "fullName role", // fields you want
      },
    })
    .sort({ createdAt: -1 });

  return appointments;
};

const getClinicPaymentData = async (clinicUserId: string) => {
  console.log("clinic user id ", clinicUserId);
  const clinicMoney = await Wallet_Model.findOne({
    ownerId: clinicUserId,
    ownerType: "CLINIC",
  });
  console.log("clinic money ", clinicMoney);
  const clinicPendingMoney = clinicMoney?.pendingBalance || 0;

  const clinicWithdrawRequests = await WithdrawRequest_Model.find({
    ownerId: clinicUserId,
    ownerType: "CLINIC",
    status: "PAID",
  });

  const clinicTotalWithdrew = clinicWithdrawRequests.reduce(
    (total, request) => {
      return total + request.amount;
    },
    0,
  );

  return {
    clinicPendingMoney,
    clinicTotalWithdrew,
    totalTransactions: clinicWithdrawRequests.length,
  };
};
const getClinicDashboardOverview = async (clinicId: string) => {
  const clinic = await Clinic_Model.findOne({ _id: clinicId });
  const clinicPatient = getClinicPatients(clinicId);
  const clinicPatientsLength = (await clinicPatient).length;

  const clinicAppointments = getClinicAppointments(clinicId);
  const clinicAppointmentsLength = (await clinicAppointments).length;

  const clinicDoctors = getClinicDoctors(clinicId);
  const clinicDoctorsLength = (await clinicDoctors).length;

  const clinicRating = await Clinic_Model.findOne({
    _id: clinicId,
  }).select("avarageRating");

  const clinicEarning = await getClinicPaymentData(
    clinic?.userId as unknown as string,
  );
  console.log("clinic earning", clinicEarning);
  const clinicPendingMoney = clinicEarning.clinicPendingMoney;
  console.log("clinic pending mondy", clinicPendingMoney);

  return {
    clinicPatients: clinicPatientsLength,
    clinicAppointments: clinicAppointmentsLength,
    clinicDoctors: clinicDoctorsLength,
    clinicRating,
    clinicPendingMoney,
  };
};

const getAllClinicName = async () => {
  const clinics = await Clinic_Model.find()
    .populate({
      path: "userId",
      model: "user", // must match model name exactly
      select: "fullName profileImage",
    })
    .select("clinicName userId"); // optional: return only needed fields

  return clinics;
};

export const ClinicService = {
  getAllClinics,
  getClinicById,
  getClinicAppointments,
  getAllAppoinmentsPrefarenceDate,
  getClinicDoctors,
  getClinicPatients,
  updateClinicBasic,
  updateClinicResponsiblePersonInfo,
  uploadCertificate,
  deleteCertificate,
  availabilitySettings,
  addReviews,
  addNewPaymentMethod,

  deleteClinic,
  getAppoinmentTimeBasedOnDateForClinic,
  getClinicPaymentData,
  getClinicDashboardOverview,
  getAllClinicName,
};
