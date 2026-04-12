import mongoose from "mongoose";
import { sendNotification } from "../../utils/notificationHelper";
import { Clinic_Model } from "../clinic/clinic.model";
import { Doctor_Model } from "../doctor/doctor.model";
import { Patient_Model } from "../patient/patient.model";
import { doctorAppointment_Model } from "./doctorAppointment.model";
import { ChatModel } from "../chat/chat.model";
import { getAppointmentDateTime } from "../../utils/getAppoinmentTimeAndDate";
import { User_Model } from "../user/user.schema";
import { sendEmail } from "../../utils/sendEmail";

export const doctorAppointmentService = {
  // Create Appointment

  createAppointment: async (payload: any) => {
    console.log("payload", payload);
    const { doctorId, prefarenceDate, prefarenceTime, serviceType } = payload;

    const patient = await Patient_Model.findOne({ _id: payload.patientId });
    if (!patient) {
      throw new Error("Patient not found");
    }
    if (
      !patient?.nidBackImageUrl ||
      !patient?.nidFrontImageUrl ||
      !patient?.nationalIdNumber ||
      patient?.address?.length === 0
    ) {
      throw new Error(
        "Please complete your profile with NID Card inofrmation and address before booking an appointment.",
      );
    }

    let appointmentFee = 0;
    // Normalize date (only YYYY-MM-DD)
    const formattedDate = new Date(prefarenceDate).toISOString().split("T")[0];

    // Check if patient exists
    const doctor: any = await Doctor_Model.findById(doctorId);
    if (!doctor) {
      throw new Error("doctor  not found");
    }
    // console.log('doctor ', doctor);

    if (serviceType === "online") {
      const DortorFee = doctor.onlineConsultationFee;
      const clinicComission = (DortorFee * 9) / 100;
      // console.log("clinic + doctor feee", clinicComission, DortorFee);

      appointmentFee = DortorFee + clinicComission;
    } else if (serviceType === "inClinic") {
      appointmentFee = doctor.clinicVisitFee;
    }

    // Check if same date + same time already exists
    const booked = await doctorAppointment_Model.findOne({
      doctorId,
      prefarenceTime,
      prefarenceDate,
    });

    if (booked) {
      const bookedDate = booked.prefarenceDate.toISOString().split("T")[0];

      if (bookedDate === formattedDate) {
        throw new Error(
          "This date and time are already booked. Please choose another slot.",
        );
      }
    }

    // Create new appointment
    const appointment = await doctorAppointment_Model.create({
      ...payload,
      prefarenceDate: new Date(prefarenceDate),
      appoinmentFee: appointmentFee,
    });

    const clinic = await Clinic_Model.findById(appointment.clinicId);
    // console.log("clinic", clinic);
    if (!clinic) {
      throw new Error("clinic  not found");
    }

    await sendNotification(
      clinic.userId.toString(),
      "New Appointment Created for A Doctor",
      ` You have a new appointment on ${formattedDate} at ${prefarenceTime}. Please check your calendar for more details. `,
      "notification",
    );

    return appointment;
  },
  Reschedule: async (payload: any) => {
    const { appointmentId, doctorId, prefarenceDate, prefarenceTime } = payload;
    console.log(payload);

    // Normalize new date
    const formattedDate = new Date(prefarenceDate).toISOString().split("T")[0];

    // Check if another appointment has same date + time
    const booked = await doctorAppointment_Model.findOne({
      doctorId,
      prefarenceTime,
    });

    if (booked) {
      const bookedDate = booked.prefarenceDate.toISOString().split("T")[0];

      // If it's not the SAME appointment, then it's a conflict
      if (
        bookedDate === formattedDate &&
        booked._id.toString() === appointmentId
      ) {
        throw new Error(
          "This date and time are already booked. Please choose another slot.",
        );
      }
    }

    // Update the appointment (RESCHEDULE)
    const updatedAppointment = await doctorAppointment_Model.findByIdAndUpdate(
      appointmentId,
      {
        prefarenceDate: new Date(prefarenceDate),
        prefarenceTime,
      },
      { new: true },
    );

    return updatedAppointment;
  },
  // Get all appointments
  getAllAppointments: async (
    status?: string,
    doctorId?: string,
    clinicId?: string,
  ) => {
    const filter: any = {};

    // ✅ Status handling
    if (status && status !== "all") {
      filter.status = status; // approved, completed, etc.
    } else {
      // ❌ exclude pending when no status or status === "all"
      filter.status = { $ne: "pending" };
    }

    if (doctorId) {
      filter.doctorId = doctorId;
    }

    if (clinicId) {
      filter.clinicId = clinicId;
    }

    const appointments = await doctorAppointment_Model
      .find(filter)
      .populate({
        path: "patientId",
        select: "_id userId gender age bloodGroup",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName profileImage role", // fields you want
        },
      })
      .populate({
        path: "doctorId",
        select: "_id userId",
        populate: { path: "userId", model: "user", select: "fullName role" },
      })
      .sort({ createdAt: -1 });

    return appointments;
  },
  // Get single appointment
  getAppointmentById: async (id: string) => {
    return await doctorAppointment_Model
      .findById(id)
      .populate({
        path: "patientId",
        select: "_id  gender age bloodGroup",
      })
      .populate({
        path: "doctorId",
        select: "_id",
      });
  },
  AdvanceFilterInDashboard: async (payload: any) => {
    const { patientName, doctorName, prefarenceDate, prefarenceTime } = payload;

    const matchStage: any = {};

    // Date filter
    if (prefarenceDate) {
      const start = new Date(prefarenceDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(prefarenceDate);
      end.setHours(23, 59, 59, 999);

      matchStage.prefarenceDate = { $gte: start, $lte: end };
    }

    // Time filter
    if (prefarenceTime) {
      matchStage.prefarenceTime = { $regex: prefarenceTime, $options: "i" };
    }

    return await doctorAppointment_Model.aggregate([
      { $match: matchStage },

      /* ---------------- PATIENT ---------------- */
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },

      {
        $lookup: {
          from: "users",
          localField: "patient.userId",
          foreignField: "_id",
          as: "patientUser",
        },
      },
      { $unwind: "$patientUser" },

      /* ---------------- DOCTOR ---------------- */
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },

      {
        $lookup: {
          from: "users",
          localField: "doctor.userId",
          foreignField: "_id",
          as: "doctorUser",
        },
      },
      { $unwind: "$doctorUser" },

      /* ---------------- NAME FILTER ---------------- */
      {
        $match: {
          ...(patientName && {
            "patientUser.fullName": {
              $regex: patientName,
              $options: "i",
            },
          }),
          ...(doctorName && {
            "doctorUser.fullName": {
              $regex: doctorName,
              $options: "i",
            },
          }),
        },
      },

      /* ---------------- RESPONSE SHAPE ---------------- */
      {
        $project: {
          status: 1,
          serviceType: 1,
          visitingType: 1,
          reasonForVisit: 1,
          prefarenceDate: 1,
          prefarenceTime: 1,

          patient: {
            _id: "$patient._id",
            fullName: "$patientUser.fullName",
            phoneNumber: "$patient.phoneNumber",
            role: "$patientUser.role",
          },

          doctor: {
            _id: "$doctor._id",
            fullName: "$doctorUser.fullName",
            phoneNumber: "$doctor.phoneNumber",
            role: "$doctorUser.role",
          },
        },
      },
    ]);
  },

  getSinglePaintentAppointment: async (patientId: string) => {
    return await doctorAppointment_Model
      .find({ patientId: patientId })
      .populate({
        path: "patientId",
        select: "_id",
      })
      .populate({
        path: "doctorId",
        select: "_id userId professionalInformation.speciality",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role profileImage ", // fields you want
        },
      });
  },

  getSingleDoctorAppointment: async (doctorId: string) => {
    return await doctorAppointment_Model
      .find({
        doctorId: doctorId,
        status: { $in: ["confirmed", "completed", "rejected"] },
      })
      .populate({
        path: "patientId",
        select: "_id userId age gender bloodGroup",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role ", // fields you want
        },
      })
      .populate({
        path: "doctorId",
        select: "_id userId",
      });
  },

  // getSinglePaitentChats: async (patientId: string) => {
  //   // Step 1: Get unique doctor IDs for this patient
  //   const doctorIds = await doctorAppointment_Model.distinct("doctorId", {
  //     patientId: patientId,
  //     status: { $in: ["confirmed", "completed"] },
  //   });
  //   // Step 2: Fetch doctor details using the IDs
  //   return await Doctor_Model.find({ _id: { $in: doctorIds } })
  //     .select(" userId professionalInformation.speciality")
  //     .populate({
  //       path: "userId",
  //       model: "user",
  //       select: "fullName role profileImage",
  //     });
  // },
  getSinglePaitentChats: async (patientId: string, date: string) => {
    // Convert the input date string to start and end of the day
    const start = new Date(date); // e.g., "2026-03-02"
    start.setHours(0, 0, 0, 0); // start of day

    const end = new Date(date);
    end.setHours(23, 59, 59, 999); // end of day

    // Step 1: Get unique doctor IDs for this patient on that date
    const doctorIds = await doctorAppointment_Model.distinct("doctorId", {
      patientId: patientId,
      status: { $in: ["confirmed", "completed"] },
      prefarenceDate: { $gte: start, $lte: end },
    });

    // Step 2: Fetch doctor details using the IDs
    return await Doctor_Model.find({ _id: { $in: doctorIds } })
      .select("userId professionalInformation.speciality")
      .populate({
        path: "userId",
        model: "user",
        select: "fullName role profileImage",
      });
  },
  getSingleDoctorChats: async (doctorId: string, date: string) => {
    // Convert input date to start and end of the day
    const start = new Date(date); // e.g., "2026-03-02"
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    // Step 1: Get unique patient IDs for this doctor on that date
    const patientIds = await doctorAppointment_Model.distinct("patientId", {
      doctorId: doctorId,
      status: { $in: ["confirmed", "completed"] },
      prefarenceDate: { $gte: start, $lte: end },
    });

    // Step 2: Fetch patient details using the IDs
    return await Patient_Model.find({ _id: { $in: patientIds } })
      .select("userId")
      .populate({
        path: "userId",
        model: "user",
        select: "fullName role profileImage",
      });
  },
  getSinlgeClinicChats: async (clinicUserId: string) => {
    const clinicObjectId = new mongoose.Types.ObjectId(clinicUserId);

    const patients = await ChatModel.aggregate([
      // 1️⃣ Only patient → clinic chats
      {
        $match: {
          chatType: "patient_clinic",
          receiverId: clinicObjectId,
        },
      },

      // 2️⃣ Unique patients
      {
        $group: {
          _id: "$senderId", // patient userId
        },
      },

      // 3️⃣ Join users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 4️⃣ Ensure only patients
      {
        $match: {
          "user.role": "patient",
        },
      },

      // 5️⃣ Final output
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          fullName: "$user.fullName",
          profileImage: "$user.profileImage",
          role: "$user.role",
          email: "$user.email",
        },
      },
    ]);

    return patients;
  },
  getSinglePatientChatsWithClinic: async (patientUserId: string) => {
    console.log("patient id ", patientUserId);

    const patientObjectId = new mongoose.Types.ObjectId(patientUserId);
    console.log("patient object id ", patientObjectId);

    const clinics = await ChatModel.aggregate([
      // 1️⃣ Only patient → clinic chats
      {
        $match: {
          chatType: "patient_clinic",
          senderId: patientObjectId,
        },
      },

      // 2️⃣ Unique clinics
      {
        $group: {
          _id: "$receiverId", // clinic userId
        },
      },

      // 3️⃣ Join users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "clinic",
        },
      },
      { $unwind: "$clinic" },

      // 4️⃣ Ensure role is clinic
      {
        $match: {
          "clinic.role": "clinic",
        },
      },

      // 5️⃣ Final output
      {
        $project: {
          _id: 0,
          userId: "$clinic._id",
          fullName: "$clinic.fullName",
          profileImage: "$clinic.profileImage",
          role: "$clinic.role",
          email: "$clinic.email",
        },
      },
    ]);

    return clinics;
  },

  updateStatus: async (id: string, status: string) => {
    const appointment = await doctorAppointment_Model.findById(id);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Apply rule only when cancelling
    if (status === "cancelled") {
      const appointmentDateTime = getAppointmentDateTime(
        appointment.prefarenceDate,
        appointment.prefarenceTime,
      );

      // 24 hours before appointment time
      const twentyFourHoursBefore = new Date(
        appointmentDateTime.getTime() - 24 * 60 * 60 * 1000,
      );

      const now = new Date();

      if (now >= twentyFourHoursBefore) {
        throw new Error(
          "You cannot cancel the appointment within 24 hours of the scheduled time",
        );
      }
    }

    const res = await doctorAppointment_Model.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (res?.status === "confirmed") {
      const patient = await Patient_Model.findById(res?.patientId);
      const PatientUser = await User_Model.findById(patient?.userId);

      await sendEmail({
        to: PatientUser?.email || "",
        subject: "Your Appointment Has Been Confirmed",
        html: `
             <h2>Welcome, ${PatientUser?.fullName}</h2>
             <p>Your appointment has been confirmed.</p>
             <p><strong>Date:</strong> ${res?.prefarenceDate}</p>
             <p><strong>Time:</strong> ${res?.prefarenceTime}</p>
           `,
      });
    }
    if (res?.status === "rejected") {
      const patient = await Patient_Model.findById(res?.patientId);
      const PatientUser = await User_Model.findById(patient?.userId);

      await sendEmail({
        to: PatientUser?.email || "",
        subject: "Your Appointment Has Been Rejected",
        html: `
             <h2>Welcome, ${PatientUser?.fullName}</h2>
             <p>Your appointment has been rejected.</p>
             <p><strong>Date:</strong> ${res?.prefarenceDate}</p>
             <p><strong>Time:</strong> ${res?.prefarenceTime}</p>
           `,
      });
    }
    if (res?.status === "cancelled") {
      const patient = await Patient_Model.findById(res?.patientId);
      const PatientUser = await User_Model.findById(patient?.userId);

      await sendEmail({
        to: PatientUser?.email || "",
        subject: "Your Appointment Has Been Cancelled",
        html: `
             <h2>Welcome, ${PatientUser?.fullName}</h2>
             <p>Your appointment has been cancelled.</p>
             <p><strong>Date:</strong> ${res?.prefarenceDate}</p>
             <p><strong>Time:</strong> ${res?.prefarenceTime}</p>
           `,
      });
    }

    return res;
  },

  getSelectedDateAndTime: async (id: string, date?: string) => {
    const doctor = await Doctor_Model.findById(id);
    console.log("doctro ", doctor?.availability);
    if (!doctor) throw new Error("Doctor not found");

    // Get all appointments for this doctor
    const allAppointments = await doctorAppointment_Model.find({
      doctorId: id,
    });

    // 1️⃣ If a specific date is provided
    if (date) {
      const selectedDateStr = new Date(date).toISOString().split("T")[0];

      // Get weekday (Monday, Tuesday, ...)
      const day = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
      });

      const availabilityForDay = doctor.availability?.find(
        (availability: any) =>
          availability.day?.toLowerCase() === day.toLowerCase(),
      );

      const startTimeSlot = availabilityForDay?.startTime;
      const endTimeSlot = availabilityForDay?.endTime;

      const appointmentsForDate = allAppointments
        .filter(
          (appointment: any) =>
            new Date(appointment.prefarenceDate).toISOString().split("T")[0] ===
            selectedDateStr,
        )
        .map((appointment: any) => ({
          date: selectedDateStr,
          time: appointment.prefarenceTime,
        }));

      return {
        appointmentsForDate,
        doctorAppoinmentTimeSolts: {
          startTimeSlot,
          endTimeSlot,
        },
        blockedDates: doctor.blockedDates?.map(
          (d: any) => new Date(d.date).toISOString().split("T")[0],
        ),
        availability: doctor?.availability,
        availableDateRange: doctor?.availableDateRange,
        slotTimeDuration: doctor?.slotTimeDuration,
      };
    }

    // 2️⃣ If no date is provided → return all appointments grouped
    const grouped: any = {};

    allAppointments.forEach((appointment: any) => {
      const dateObj = appointment.prefarenceDate;
      const formattedDate = dateObj.toISOString().split("T")[0];

      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = [];

      grouped[year][month].push({
        date: formattedDate,
        time: appointment.prefarenceTime,
      });
    });

    return {
      grouped,
      blockedDates: doctor.blockedDates?.map(
        (d: any) => new Date(d.date).toISOString().split("T")[0],
      ),
      availability: doctor?.availability,
      availableDateRange: doctor?.availableDateRange,
      slotTimeDuration: doctor?.slotTimeDuration,
    };
  },

  getAppoinmentTimeBasedOnDate: async (date: Date, id: string) => {
    // console.log("date and id ", date, id);

    const appointments = await doctorAppointment_Model
      .find({
        doctorId: id,
        prefarenceDate: new Date(date),
      })
      .populate({
        path: "patientId",
        select: "_id userId gender age bloodGroup",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName profileImage role", // fields you want
        },
      })
      .populate({
        path: "doctorId",
        select: "_id userId name image specialization",
      })
      .sort({ createdAt: -1 });

    return appointments;
  },

  // Delete
  deleteAppointment: async (id: string) => {
    return await doctorAppointment_Model.findByIdAndDelete(id);
  },
};
