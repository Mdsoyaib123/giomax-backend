import mongoose, { Types } from "mongoose";
import { User_Model } from "../user/user.schema";
import { SoloNurse_Model } from "./soloNurse.model";
import { Wallet_Model } from "../wallet/wallet.model";
import { WithdrawRequest_Model } from "../withdrowRequest/withdrowRequest.model";
import { soloNurseAppoinment_Model } from "../soloNurseAppoinment/soloNurseAppoinment.model";

export const SoloNurseService = {
  // getAllSoloNurses: async (serviceName?: string, sub_serviceName?: string , patientUserId?: string) => {

  //   const patientUserData = await User_Model.findById(patientUserId);

  //   const query: any = {};

  //   if (serviceName) {
  //     query["professionalInformation.services.serviceName"] = serviceName;
  //   }

  //   if (serviceName && sub_serviceName) {
  //     query["professionalInformation.services.subServices.name"] = {
  //       $regex: sub_serviceName.trim(),
  //       $options: "i",
  //     };
  //   }

  //   return SoloNurse_Model.find(query)
  //     .populate("userId")
  //     .sort({ createdAt: -1 });
  // },
  getAllSoloNurses: async (
    serviceName?: string,
    sub_serviceName?: string,
    patientUserId?: string,
  ) => {
    const query: any = {};
    console.log("service name ", serviceName);

    if (serviceName)
      query["professionalInformation.services.serviceName"] = serviceName;

    if (serviceName && sub_serviceName) {
      query["professionalInformation.services.subServices.name"] = {
        $regex: sub_serviceName.trim(),
        $options: "i",
      };
    }

    // If patientUserId is provided, compute distance
    if (patientUserId) {
      const patient = await User_Model.findById(patientUserId);

      // if (!patient || !patient.latitude || !patient.longitude) {
      //   throw new Error("Patient location not found");
      // }

      const nearestNurses = await SoloNurse_Model.aggregate([
        { $match: query },
        // Join with User to get latitude & longitude
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userData",
          },
        },
        { $unwind: "$userData" },
        // Compute distance from patient
        {
          $addFields: {
            distance: {
              $sqrt: {
                $add: [
                  {
                    $pow: [
                      { $subtract: ["$userData.latitude", patient?.latitude] },
                      2,
                    ],
                  },
                  {
                    $pow: [
                      {
                        $subtract: ["$userData.longitude", patient?.longitude],
                      },
                      2,
                    ],
                  },
                ],
              },
            },
          },
        },
        { $sort: { distance: 1 } },
        { $limit: 10 },
      ]);

      return nearestNurses;
    }

    // If patientUserId not provided, return all nurses with optional filters
    return SoloNurse_Model.find(query)
      .populate("userId")
      .sort({ createdAt: -1 });
  },
  getSoloNurseById: async (userId: string) => {
    return SoloNurse_Model.findOne({ userId })
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
  },

  updateSoloNurseBasic: async (
    userId: string,
    payload: any,
    profileImageUrl: string,
  ) => {
    const { fullName, phoneNumber, dateOfBirth, gender } = payload;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updateData: any = { fullName };

      if (profileImageUrl) {
        updateData.profileImage = profileImageUrl;
      }
      // step-1: Update user model
      const updatedUser = await User_Model.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, session },
      );

      if (!updatedUser) {
        throw new Error("User not found!");
      }

      // step-2: Update clinic model
      const updatedClinic = await SoloNurse_Model.findOneAndUpdate(
        { userId },
        {
          phoneNumber,
          dateOfBirth,
          gender,
        },
        { new: true, session },
      ).populate("userId");

      if (!updatedClinic) {
        throw new Error("nurse profile not found!");
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
  },
  professionalUpdate: async (userId: string, payload: any) => {
    const updateData: any = {};

    // 🔹 Get existing nurse
    const soloNurse = await SoloNurse_Model.findOne({ userId });

    if (!soloNurse) {
      throw new Error("Solo nurse profile not found");
    }

    //   SERVICES (MERGE, NOT REPLACE)

    // if (payload.services && Array.isArray(payload.services)) {
    //   const existingServices =
    //     soloNurse.professionalInformation?.services || [];

    //   // Merge services (avoid duplicates by serviceName OR serviceId)
    //   const mergedServices = [...existingServices];

    //   payload.services.forEach((newService: any) => {
    //     const exists = existingServices.some(
    //       (service: any) =>
    //         service.serviceName === newService.serviceName ||
    //         service.serviceId === newService.serviceId
    //     );
    //     if (!exists) {
    //       mergedServices.push(newService);
    //     }
    //   });

    //   updateData["professionalInformation.services"] = mergedServices;
    // }

    // OTHER FIELDS (PATCH STYLE)
    if (payload.speciality) {
      updateData["professionalInformation.speciality"] = payload.speciality;
    }

    if (payload.experience) {
      updateData["professionalInformation.experience"] = payload.experience;
    }

    if (payload.MedicalLicense) {
      updateData["professionalInformation.MedicalLicense"] =
        payload.MedicalLicense;
    }

    if (payload.qualifications) {
      updateData["professionalInformation.qualifications"] =
        payload.qualifications;
    }

    if (payload.about) {
      updateData["professionalInformation.about"] = payload.about;
    }

    if (payload.consultationFee) {
      updateData["professionalInformation.consultationFee"] =
        payload.consultationFee;
    }

    const updatedProfessional = await SoloNurse_Model.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true },
    );

    return updatedProfessional;
  },
  addSubServiceWithAutoMainService: async (
    userId: string,
    serviceId: string,
    serviceName:
      | "General nurse care"
      | "Physio therapy"
      | "Pregnancy care"
      | "Other",
    payload: { name: string; price: number },
  ) => {
    const { name, price } = payload;

    console.log("data", userId, serviceId, serviceName);

    console.log("payload ", payload);

    if (!name || price === undefined) {
      throw new Error("Sub-service name and price are required");
    }

    // 1️⃣ Find nurse
    const soloNurse = await SoloNurse_Model.findOne({ userId });

    if (!soloNurse) {
      throw new Error("Nurse not found");
    }

    // 2️⃣ Check if main service exists
    let service = soloNurse.professionalInformation?.services.find(
      (s: any) => s.serviceId === serviceId,
    );

    // 3️⃣ If main service does NOT exist → create it
    if (!service) {
      soloNurse.professionalInformation?.services.push({
        serviceId,
        serviceName,
        subServices: [],
      });

      await soloNurse.save();

      // re-fetch the service
      service = soloNurse.professionalInformation?.services.find(
        (s: any) => s.serviceId === serviceId,
      );
    }

    // 4️⃣ Check duplicate sub-service
    const alreadyExists = service?.subServices.some(
      (sub: any) => sub.name.toLowerCase() === name.toLowerCase(),
    );

    if (alreadyExists) {
      throw new Error("Sub-service already exists");
    }

    // 5️⃣ Add sub-service
    service?.subServices.push({
      name,
      price,
    });

    await soloNurse.save();

    return soloNurse;
  },

  deleteSingleSubService: async (
    userId: string,
    serviceId: string,
    subServiceId: string,
  ) => {
    const soloNurse = await SoloNurse_Model.findOne({ userId });

    if (!soloNurse) {
      throw new Error("Solo nurse not found for this user");
    }

    // console.log('payload', userId, serviceId, sub);
    const updatedSoloNurse = await SoloNurse_Model.findOneAndUpdate(
      {
        userId,
        "professionalInformation.services.serviceId": serviceId,
      },
      {
        $pull: {
          "professionalInformation.services.$.subServices": {
            _id: subServiceId,
          },
        },
      },
      { new: true },
    );

    // console.log('deleted ', updatedSoloNurse);

    return updatedSoloNurse;
  },

  uploadCertificate: async (userId: string, payload: any) => {
    // console.log("payload from service ", payload);

    const clinic = await SoloNurse_Model.findOne({ userId });

    if (!clinic) {
      throw new Error("Clinic not found for this user");
    }

    const newCertificate = {
      uploadCertificates: payload.certificateUrl, // correct field name
      certificateType: payload.data?.certificateType,
      certificateName: payload.data?.certificateName,
    };

    // console.log("service ", newCertificate);

    const updatedCertificates = await SoloNurse_Model.findOneAndUpdate(
      { userId },
      {
        $push: { certificates: newCertificate },
      },
      { new: true },
    );
    return updatedCertificates;
  },
  deleteCertificate: async (userId: string, certificateId: string) => {
    // Find the user first
    const nurse = await SoloNurse_Model.findOne({ userId });

    if (!nurse) {
      throw new Error("Solo nurse not found for this user");
    }

    console.log(userId, certificateId);
    // Perform delete using $pull
    const updated = await SoloNurse_Model.findOneAndUpdate(
      { userId },
      {
        $pull: {
          certificates: { _id: certificateId },
        },
      },
      { new: true },
    );

    return updated;
  },

  availabilitySettings: async (userId: string, payload: any) => {
    console.log("payload from service ", payload);

    const soloNurse = await SoloNurse_Model.findOne({ userId });

    if (!soloNurse) {
      throw new Error("soloNurse not found for this user");
    }

    /** -------------------------------
   * 1️⃣ HANDLE AVAILABILITY (MERGE)
   --------------------------------*/
    if (Array.isArray(payload?.availability)) {
      payload.availability.forEach((incomingDay: any) => {
        const existingDay = soloNurse.availability?.find(
          (d: any) => d.day === incomingDay.day,
        );

        if (existingDay) {
          if (incomingDay.startTime !== undefined)
            existingDay.startTime = incomingDay.startTime;

          if (incomingDay.endTime !== undefined)
            existingDay.endTime = incomingDay.endTime;

          if (incomingDay.isEnabled !== undefined)
            existingDay.isEnabled = incomingDay.isEnabled;
        } else {
          soloNurse.availability?.push({
            day: incomingDay.day,
            startTime: incomingDay.startTime || "09:00",
            endTime: incomingDay.endTime || "17:00",
            isEnabled: incomingDay.isEnabled ?? true,
          });
        }
      });
    }

    /** -------------------------------
   * 2️⃣ HANDLE BLOCKED DATES
   --------------------------------*/
    if (Array.isArray(payload?.blockedDates)) {
      soloNurse.blockedDates = soloNurse.blockedDates || [];

      const existingDates = soloNurse.blockedDates.map((d: any) =>
        d.date.toDateString(),
      );

      payload.blockedDates.forEach((incoming: any) => {
        const dateStr = new Date(incoming.date).toDateString();

        if (incoming.action === "add") {
          if (!existingDates.includes(dateStr)) {
            soloNurse.blockedDates?.push({
              date: new Date(incoming.date),
            });
          }
        } else if (incoming.action === "remove") {
          soloNurse.blockedDates = soloNurse.blockedDates?.filter(
            (d: any) => d.date.toDateString() !== dateStr,
          );
        }
      });
    }

    /** -------------------------------
   * 3️⃣ HANDLE AVAILABLE DATE RANGE (NEW)
   --------------------------------*/
    if (payload?.availableDateRange) {
      soloNurse.availableDateRange = {
        startDate: payload.availableDateRange.startDate
          ? new Date(payload.availableDateRange.startDate)
          : soloNurse.availableDateRange?.startDate,

        endDate: payload.availableDateRange.endDate
          ? new Date(payload.availableDateRange.endDate)
          : soloNurse.availableDateRange?.endDate,

        isEnabled:
          payload.availableDateRange.isEnabled ??
          soloNurse.availableDateRange?.isEnabled ??
          false,
      };
    }

    if (payload?.slotTimeDuration) {
      soloNurse.slotTimeDuration = payload.slotTimeDuration;
    }

    /** -------------------------------
   * 4️⃣ SAVE
   --------------------------------*/
    await soloNurse.save();

    return soloNurse;
  },

  addNewPaymentMethod: async (userId: string, payload: any) => {
    const soloNurse = await SoloNurse_Model.findOne({ userId });

    if (!soloNurse) {
      throw new Error("soloNurse not found for this user");
    }
    const newPaymentMethod = {
      IBanNumber: payload.IBanNumber,
    };

    const updatedPaymentMethods = await SoloNurse_Model.findOneAndUpdate(
      { userId },
      {
        $set: { "paymentAndEarnings.withdrawalMethods": newPaymentMethod },
      },
      { new: true },
    );

    return updatedPaymentMethods;
  },

  addReviews: async (userId: string, payload: any) => {
    const soloNurse: any = await SoloNurse_Model.findOne({ userId });
    if (!soloNurse) {
      throw new Error("Solo nurse not found for this user");
    }

    soloNurse.reviews.push(payload);
    const totalRatings = soloNurse.reviews.reduce(
      (sum: any, review: { rating: any }) => sum + (review.rating || 0),
      0,
    );
    soloNurse.avarageRating = totalRatings / soloNurse.reviews.length;

    await soloNurse.save();
    return soloNurse;
  },

  deleteSoloNurse: async (soloNurseId: string, soloNurseUserId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    if (soloNurseId) {
      const walletBalance = await Wallet_Model.findOne({
        ownerId: soloNurseId,
      });
      if (walletBalance && walletBalance.withdrawAbleBalance > 0) {
        throw new Error("You has withdrawAble Amount, please withdraw first.");
      }
    }

    try {
      const user = await User_Model.findOneAndDelete(
        { _id: soloNurseUserId },
        { session },
      );

      if (!user) {
        throw new Error("User not found");
      }

      const soloNurse = await SoloNurse_Model.findOneAndDelete(
        { _id: soloNurseId },
        { session },
      );

      if (!soloNurse) {
        throw new Error("Solo nurse not found");
      }

      await session.commitTransaction();
      session.endSession();

      return {
        message: "Solo nurse deleted successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  getSoloNursePaymentData: async (soloNurseId: string) => {
    const soloNurseMoney = await Wallet_Model.findOne({
      ownerId: soloNurseId,
      ownerType: "SOLO_NURSE",
    });

    const soloNurseWithdrawAbleMoney = soloNurseMoney?.withdrawAbleBalance || 0;
    const commission = soloNurseWithdrawAbleMoney * 0.15;
    const nurseReceives = soloNurseWithdrawAbleMoney - commission;

    const soloNurseWithdrawRequests = await WithdrawRequest_Model.find({
      ownerId: soloNurseId,
      ownerType: "SOLO_NURSE",
      status: "PAID",
    });

    const soloNurseTotalWithdrew = soloNurseWithdrawRequests.reduce(
      (total, request) => {
        return total + request.amount;
      },
      0,
    );

    return {
      soloNursePendingMoney: nurseReceives,
      soloNurseTotalWithdrew,
      totalTransactions: soloNurseWithdrawRequests.length,
    };
  },
  getSubServicesByMainService: async (serviceName: string) => {
    // 🔹 Find nurses having this service
    const nurses = await SoloNurse_Model.find(
      {
        "professionalInformation.services.serviceName": serviceName,
      },
      {
        "professionalInformation.services": 1,
        userId: 1,
      },
    );

    // 🔹 Extract only sub-services of that main service
    const subServices = nurses.flatMap((nurse) =>
      nurse?.professionalInformation?.services
        .filter((service: any) => service.serviceName === serviceName)
        .flatMap((service: any) => service.subServices),
    );

    return subServices;
  },
  getSoloNurseDashboardOverview: async (soloNurseId: string) => {
    const allAppointments = await soloNurseAppoinment_Model.find({
      soloNurseId,
    });

    const pendingAppointments = await soloNurseAppoinment_Model.find({
      soloNurseId,
      status: { $in: ["pending", "confirmed"] },
    });

    const completedAppointments = await soloNurseAppoinment_Model.find({
      soloNurseId,
      status: "completed",
    });

    const totalEarnings = await Wallet_Model.findOne({
      ownerId: soloNurseId,
      ownerType: "SOLO_NURSE",
    });

    console.log("totalEarnings", totalEarnings);

    const soloNurseWithdrawAbleMoney = totalEarnings?.withdrawAbleBalance || 0;
    const commission = soloNurseWithdrawAbleMoney * 0.15;
    const nurseReceives = soloNurseWithdrawAbleMoney - commission;

    return {
      allAppoinment: allAppointments.length,
      pendingAppointments: pendingAppointments.length,
      completedAppointments: completedAppointments.length,
      WithdrawAbleAmount: nurseReceives || 0,
    };
  },
};
