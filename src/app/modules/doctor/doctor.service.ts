import mongoose from "mongoose";
import { TDoctor } from "./doctor.interface";
import { Doctor_Model } from "./doctor.model";
import { User_Model } from "../user/user.schema";
import { doctorAppointment_Model } from "../doctorAppointment/doctorAppointment.model";
import { doctorAppointmentService } from "../doctorAppointment/doctorAppointment.service";

export const DoctorService = {
  updateDoctor: async (doctorId: string, payload: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        fullName,
        email,
        professionalInformation,
        phoneNumber,
        availability,
        availableDateRange,
        blockedDates,
        slotTimeDuration,
        ...rest
      } = payload;

      // 1️⃣ Find doctor
      const doctor = await Doctor_Model.findById(doctorId).session(session);
      if (!doctor) throw new Error("Doctor not found");

      // 2️⃣ Update user info
      if (fullName || email) {
        const userUpdate: any = {};

        if (fullName) userUpdate.fullName = fullName;

        if (email) {
          const existingEmail = await User_Model.findOne(
            { email, _id: { $ne: doctor.userId } },
            null,
            { session },
          );
          if (existingEmail) throw new Error("Email already exists");
          userUpdate.email = email;
        }

        await User_Model.findByIdAndUpdate(doctor.userId, userUpdate, {
          session,
        });
      }

      // 3️⃣ Parse & validate availability (same as create)
      let parsedAvailability: any[] | undefined;

      if (availability !== undefined) {
        parsedAvailability = [];

        if (Array.isArray(availability)) {
          parsedAvailability = availability.map((item: any) =>
            typeof item === "string" ? JSON.parse(item) : item,
          );
        } else if (typeof availability === "string") {
          parsedAvailability = [JSON.parse(availability)];
        }

        // 🔒 Prevent duplicate days
        const days = parsedAvailability.map((a) => a.day.toLowerCase());
        if (new Set(days).size !== days.length) {
          throw new Error("Duplicate availability day is not allowed");
        }
      }

      let parsedAvailableDateRange: any | undefined;

      if (availableDateRange !== undefined) {
        let rangeObj: any = availableDateRange;

        // handle FormData string
        if (typeof availableDateRange === "string") {
          rangeObj = JSON.parse(availableDateRange);
        } else {
          rangeObj = availableDateRange;
        }

        parsedAvailableDateRange = {
          startDate: rangeObj.startDate
            ? new Date(rangeObj.startDate)
            : doctor.availableDateRange?.startDate,

          endDate: rangeObj.endDate
            ? new Date(rangeObj.endDate)
            : doctor.availableDateRange?.endDate,

          isEnabled:
            rangeObj.isEnabled ?? doctor.availableDateRange?.isEnabled ?? false,
        };
      }

      // 4️⃣ Handle blocked dates (ADD / REMOVE)
      let updatedBlockedDates = doctor.blockedDates || [];

      if (Array.isArray(blockedDates)) {
        blockedDates.forEach((item: any) => {
          const dateStr = new Date(item.date).toDateString();

          if (item.action === "add") {
            const exists = updatedBlockedDates.some(
              (d: any) => d.date.toDateString() === dateStr,
            );
            if (!exists) {
              updatedBlockedDates.push({
                date: new Date(item.date),
              });
            }
          }

          if (item.action === "remove") {
            updatedBlockedDates = updatedBlockedDates.filter(
              (d: any) => d.date.toDateString() !== dateStr,
            );
          }
        });
      }

      // 5️⃣ Update doctor info
      const doctorUpdate: any = { ...rest };

      if (professionalInformation) {
        doctorUpdate.professionalInformation = professionalInformation;
      }

      if (phoneNumber) {
        doctorUpdate.phoneNumber = phoneNumber;
      }

      if (parsedAvailability !== undefined) {
        doctorUpdate.availability = parsedAvailability;
      }

      if (parsedAvailableDateRange !== undefined) {
        doctorUpdate.availableDateRange = parsedAvailableDateRange;
      }

      if (blockedDates !== undefined) {
        doctorUpdate.blockedDates = updatedBlockedDates;
      }

      if (slotTimeDuration !== undefined) {
        doctorUpdate.slotTimeDuration = Number(slotTimeDuration);
      }

      const updatedDoctor = await Doctor_Model.findByIdAndUpdate(
        doctorId,
        doctorUpdate,
        { new: true, session },
      );

      await session.commitTransaction();
      session.endSession();

      return updatedDoctor;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  getDoctors: async () => {
    return Doctor_Model.find().populate("userId").populate("clinicId");
  },

  getDoctorById: async (userId: string) => {
    return Doctor_Model.findOne({ userId })
      .populate("userId")
      .populate({
        path: "clinicId",
        select: "_id ", // only fetch _id and name
      })
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

  getSingleDoctorPatientList: async (doctorId: string) => {
    const appointments = await doctorAppointment_Model
      .find({
        doctorId,
        status: "confirmed",
      })
      .populate({
        path: "patientId",
        select: "_id userId gender age bloodGroup",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role", // fields you want
        },
      })
      .populate({
        path: "doctorId",
        select: "_id userId",
      })
      .sort({ createdAt: -1 });

    return appointments;
  },

  updateDoctorBasic: async (
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
      const updatedClinic = await Doctor_Model.findOneAndUpdate(
        { userId },
        {
          phoneNumber,
          dateOfBirth,
          gender,
        },
        { new: true, session },
      ).populate("userId");

      if (!updatedClinic) {
        throw new Error("doctor profile not found!");
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
    const {
      speciality,
      experienceYears,
      medicalLicenseNumber,
      qualifications,
      about,
    } = payload;

    const professionalInformation = {
      speciality,
      experienceYears,
      medicalLicenseNumber,
      qualifications,
      about,
    };

    try {
      const updatedProfessional = await Doctor_Model.findOneAndUpdate(
        { userId }, // correct filter
        { professionalInformation },
        { new: true },
      );

      if (!updatedProfessional) {
        throw new Error("Solo nurse profile not found");
      }

      return updatedProfessional;
    } catch (error) {
      console.error("Error updating professional info:", error);
      throw error;
    }
  },

  uploadCertificate: async (userId: string, payload: any) => {
    // console.log("payload from service ", payload);

    const clinic = await Doctor_Model.findOne({ userId });

    if (!clinic) {
      throw new Error("Clinic not found for this user");
    }

    const newCertificate = {
      uploadCertificates: payload.certificateUrl, // correct field name
      certificateType: payload.data?.certificateType,
      certificateName: payload.data?.certificateName,
    };

    // console.log("service ", newCertificate);

    const updatedCertificates = await Doctor_Model.findOneAndUpdate(
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
    const nurse = await Doctor_Model.findOne({ userId });

    if (!nurse) {
      throw new Error("Solo nurse not found for this user");
    }

    console.log(userId, certificateId);
    // Perform delete using $pull
    const updated = await Doctor_Model.findOneAndUpdate(
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

  deleteDoctor: async (
    doctorId: string,
    clinicId: string,
    doctorUserId: string,
  ) => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // 1️⃣ Delete doctor user
      const user = await User_Model.findOneAndDelete(
        { _id: doctorUserId },
        { session },
      );

      if (!user) {
        throw new Error("Doctor user not found");
      }

      // 2️⃣ Delete doctor profile
      const doctor = await Doctor_Model.findOneAndDelete(
        { _id: doctorId, clinicId },
        { session },
      );

      if (!doctor) {
        throw new Error("Doctor not found in this clinic");
      }

      // 3️⃣ Commit transaction
      await session.commitTransaction();
      session.endSession();

      return {
        message: "Doctor deleted successfully",
      };
    } catch (error) {
      // ❌ Rollback on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },
  getDoctorDashboardOverview: async (doctorId: string) => {
    const patients = await DoctorService.getSingleDoctorPatientList(doctorId);
    const totalPatients = patients?.length || 0;

    const appointments =
      await doctorAppointmentService.getSingleDoctorAppointment(doctorId);
    const totalAppointments = appointments?.length || 0;

    const totalPendingAppointments = appointments.filter(
      (item: any) => item.status === "pending",
    ).length;

    const totalCompletedAppointments = appointments.filter(
      (item: any) => item.status === "completed",
    ).length;

    return {
      totalPatients,
      totalAppointments,
      totalPendingAppointments,
      totalCompletedAppointments,
    };
  },
  addReviews: async (userId: string, payload: any) => {
    const doctor: any = await Doctor_Model.findOne({ userId });
    if (!doctor) {
      throw new Error("Doctor not found for this user");
    }

    doctor.reviews.push(payload);
    const totalRatings = doctor.reviews.reduce(
      (sum: any, review: { rating: any }) => sum + (review.rating || 0),
      0,
    );
    doctor.avarageRating = totalRatings / doctor.reviews.length;

    await doctor.save();
    return doctor;
  },
};
