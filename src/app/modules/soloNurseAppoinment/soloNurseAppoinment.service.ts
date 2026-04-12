import { sendNotification } from "../../utils/notificationHelper";
import { Patient_Model } from "../patient/patient.model";
import { SoloNurse_Model } from "../soloNurse/soloNurse.model";
import { soloNurseAppoinment_Model } from "./soloNurseAppoinment.model";
import mongoose from "mongoose";
import { ChatModel } from "../chat/chat.model";
import { getAppointmentDateTime } from "../../utils/getAppoinmentTimeAndDate";
import { Wallet_Model } from "../wallet/wallet.model";

export const soloNurseAppointmentService = {
  createAppointment: async (data: any) => {
    const { soloNurseId, prefarenceDate, prefarenceTime } = data;

    const patient = await Patient_Model.findById(data.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const soloNurse: any = await SoloNurse_Model.findById(soloNurseId);
    console.log("nurse ", soloNurse);
    if (!soloNurse) {
      throw new Error("Solo nurse not found");
    }

    if (!Array.isArray(prefarenceDate) || prefarenceDate.length === 0) {
      throw new Error("Please provide at least one preferred date.");
    }

    // Normalize all dates to YYYY-MM-DD
    const formattedDates = prefarenceDate.map(
      (date: string) => new Date(date).toISOString().split("T")[0],
    );

    console.log("fromate dates", formattedDates);

    // 🔹 Check blocked dates
    for (const formattedDate of formattedDates) {
      const isBlocked = soloNurse.blockedDates.some(
        (d: any) =>
          new Date(d.date).toISOString().split("T")[0] === formattedDate,
      );

      console.log("blocked date", isBlocked);

      if (isBlocked) {
        throw new Error(
          `The nurse is not available on ${formattedDate}. Please choose another date.`,
        );
      }

      // 🔹 Check day availability
      const dayOfWeek = new Date(formattedDate).toLocaleDateString("en-US", {
        weekday: "long",
      });

      console.log("day of week", dayOfWeek);

      const availabilityForDay = soloNurse.availability.find(
        (a: any) => a.day?.trim().toLowerCase() === dayOfWeek.toLowerCase(),
      );

      console.log("avaible days", availabilityForDay);

      if (!availabilityForDay || !availabilityForDay.isEnabled) {
        throw new Error(
          `The nurse is not available on ${dayOfWeek}. Please choose another date.`,
        );
      }

      // 🔹 Check if already booked
      const alreadyBooked = await soloNurseAppoinment_Model.findOne({
        soloNurseId,
        prefarenceTime,
        prefarenceDate: {
          $elemMatch: {
            $eq: new Date(formattedDate),
          },
        },
        status: { $in: ["pending", "confirmed"] },
      });

      if (alreadyBooked) {
        throw new Error(
          `The date ${formattedDate} at ${prefarenceTime} is already booked.`,
        );
      }
    }

    // ✅ Create appointment
    const appointment = await soloNurseAppoinment_Model.create({
      ...data,
      prefarenceDate: formattedDates.map((d) => new Date(d)),
    });

    // 🔔 Send notification
    await sendNotification(
      soloNurse.userId.toString(),
      "New Appointment Added",
      `You have a new appointment request for ${formattedDates.join(
        ", ",
      )} at ${prefarenceTime}.`,
      "notification",
    );

    return appointment;
  },
  Reschedule: async (payload: any) => {
    const { appointmentId, soloNurseId, prefarenceDate, prefarenceTime } =
      payload;

    if (!Array.isArray(prefarenceDate) || prefarenceDate.length === 0) {
      throw new Error("Please provide at least one preferred date.");
    }

    // Normalize dates
    const formattedDates = prefarenceDate.map(
      (date: string) => new Date(date).toISOString().split("T")[0],
    );

    // 🔹 Check conflicts for each selected date
    for (const formattedDate of formattedDates) {
      const conflict = await soloNurseAppoinment_Model.findOne({
        _id: { $ne: appointmentId }, // exclude current appointment
        soloNurseId,
        prefarenceTime,
        status: { $in: ["pending", "confirmed"] },
        prefarenceDate: {
          $elemMatch: {
            $eq: new Date(formattedDate),
          },
        },
      });

      if (conflict) {
        throw new Error(
          `The date ${formattedDate} at ${prefarenceTime} is already booked. Please choose another slot.`,
        );
      }
    }

    // 🔹 Update appointment
    const updatedAppointment =
      await soloNurseAppoinment_Model.findByIdAndUpdate(
        appointmentId,
        {
          prefarenceDate: formattedDates.map((d) => new Date(d)),
          prefarenceTime,
        },
        { new: true },
      );

    if (!updatedAppointment) {
      throw new Error("Appointment not found.");
    }

    return updatedAppointment;
  },
  getAllAppointments: async (status?: string, nurseId?: string) => {
    let filter: any = {};

    // Filter by Solo Nurse
    if (nurseId) {
      filter.soloNurseId = nurseId;
    }

    // Normal status filtering
    if (status && status !== "upcoming") {
      filter.status = status;
    }

    // Fetch from DB
    let appointments = await soloNurseAppoinment_Model
      .find(filter)
      .populate({
        path: "patientId",
        select: "_id userId gender age bloodGroup",
        populate: { path: "userId", select: "_id fullName profileImage role" },
      })
      .populate({
        path: "soloNurseId",
        select: "_id userId",
        populate: { path: "userId", select: "_id fullName profileImage role" },
      });

    // UPCOMING FILTER - DATE + TIME CHECK
    if (status === "upcoming") {
      const now = new Date();

      appointments = appointments.filter((item: any) => {
        const date = item.prefarenceDate; // Example: "2025-01-12"
        const time = item.prefarenceTime; // Example: "10:30 AM"

        // Build full datetime
        const apptDateTime = new Date(
          `${date.toISOString().split("T")[0]} ${time}`,
        );

        return apptDateTime > now;
      });

      // Sort upcoming: nearest first
      appointments.sort((a: any, b: any) => {
        const ad = new Date(
          `${a.prefarenceDate.toISOString().split("T")[0]} ${a.prefarenceTime}`,
        );
        const bd = new Date(
          `${b.prefarenceDate.toISOString().split("T")[0]} ${b.prefarenceTime}`,
        );
        return ad.getTime() - bd.getTime();
      });
    }

    return appointments;
  },

  getAppointmentById: async (id: string) => {
    return await soloNurseAppoinment_Model
      .findById(id)
      .populate({
        path: "patientId",
        select: "_id userId gender age bloodGroup",
        populate: {
          path: "userId",
          select: "_id fullName profileImage ",
        },
      })
      .populate({
        path: "soloNurseId",
        select: "_id userId",
        populate: {
          path: "userId",
          select: "_id fullName profileImage role",
        },
      });
  },

  updateAppointment: async (id: string, data: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = await soloNurseAppoinment_Model
        .findById(id)
        .session(session);
      if (!appointment) throw new Error("Appointment not found");

      if (data.status === "cancelled") {
        if (!appointment.prefarenceDate?.length)
          throw new Error("No appointment date found.");
        const appointmentDateTime = getAppointmentDateTime(
          new Date(appointment.prefarenceDate[0].toString()),
          appointment.prefarenceTime,
        );
        if (
          new Date() >=
          new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000)
        ) {
          throw new Error(
            "Cannot cancel within 24 hours of the scheduled time",
          );
        }
      }

      const updateData: any = { status: data.status };
      if (data.status === "completed") updateData.completedAt = new Date();

      const res = await soloNurseAppoinment_Model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, session },
      );

      if (res?.status === "completed") {
        await Wallet_Model.findOneAndUpdate(
          { ownerId: res.soloNurseId, ownerType: "SOLO_NURSE" },
          { $inc: { withdrawAbleBalance: res.appointmentFee } },
          { session },
        );
      }

      await session.commitTransaction();
      return res;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  getSelectedDateAndTime: async (id: string, date?: string) => {
    const soloNurse = await SoloNurse_Model.findById(id);
    if (!soloNurse) throw new Error("Solo nurse not found");

    // Get all appointments for this nurse
    const allAppointments = await soloNurseAppoinment_Model.find({
      soloNurseId: id,
    });

    // 1️⃣ If a specific date is provided
    if (date) {
      const selectedDateStr = new Date(date + "T00:00:00")
        .toISOString()
        .split("T")[0];

      const day = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
      });

      const availabilityForDay = soloNurse.availability?.find(
        (availability) =>
          availability.day?.trim().toLowerCase() === day.toLowerCase(),
      );

      const startTimeSlot = availabilityForDay?.startTime;
      const endTimeSlot = availabilityForDay?.endTime;

      const appointmentsForDate = allAppointments
        .filter((appointment) =>
          appointment.prefarenceDate?.some(
            (d: any) =>
              new Date(d).toISOString().split("T")[0] === selectedDateStr,
          ),
        )
        .map((appointment) => ({
          date: selectedDateStr,
          time: appointment.prefarenceTime,
        }));

      return {
        appointmentsForDate,
        nurseAppoinmentTimeSlot: { startTimeSlot, endTimeSlot },
        blockedDates: soloNurse.blockedDates?.map(
          (d: any) => new Date(d.date).toISOString().split("T")[0],
        ),
        availability: soloNurse?.availability,
        availableDateRange: soloNurse?.availableDateRange,
        slotTimeDuration: soloNurse?.slotTimeDuration,
      };
    }

    // 2️⃣ If no date is provided, return all appointments grouped
    const grouped: any = {};

    allAppointments.forEach((appointment) => {
      if (!appointment.prefarenceDate?.length) return;

      appointment.prefarenceDate.forEach((dateObj: any) => {
        const formattedDate = new Date(dateObj).toISOString().split("T")[0];

        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");

        if (!grouped[year]) grouped[year] = {};
        if (!grouped[year][month]) grouped[year][month] = [];

        grouped[year][month].push({
          date: formattedDate,
          time: appointment.prefarenceTime,
        });
      });
    });

    return {
      grouped,
      blockedDates: soloNurse.blockedDates?.map(
        (d: any) => new Date(d.date).toISOString().split("T")[0],
      ),
      availability: soloNurse?.availability,
      availableDateRange: soloNurse?.availableDateRange,
      slotTimeDuration: soloNurse?.slotTimeDuration,
    };
  },

  getAppoinmentTimeBasedOnDate: async (date: Date, id: string) => {
    console.log("date and id ", date, id);
    const appointments = await soloNurseAppoinment_Model
      .find({
        soloNurseId: id,
        prefarenceDate: new Date(date),
      })
      .populate({
        path: "patientId",
        select: "_id userId",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role profileImage ", // fields you want
        },
      })
      .populate({
        path: "soloNurseId",
        select: "_id userId",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role profileImage ", // fields you want
        },
      });

    return appointments;
  },
  getSinglePaintentAppointmentForNurse: async (patientId: string) => {
    console.log("pait4ent id ", patientId);
    return await soloNurseAppoinment_Model
      .find({ patientId: patientId })
      .populate({
        path: "patientId",
        // select: "_id",
      })
      .populate({
        path: "soloNurseId",
        select: "_id userId ",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role profileImage ", // fields you want
        },
      });
  },
  getSingleNurseAppointment: async (soloNurseId: string) => {
    return await soloNurseAppoinment_Model
      .find({ soloNurseId: soloNurseId })
      .populate({
        path: "patientId",
        select: "_id userId gender age",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role profileImage  ", // fields you want
        },
      })
      .populate({
        path: "soloNurseId",
        select: "_id userId",
        populate: {
          path: "userId",
          model: "user", // ensure correct model name
          select: "fullName role  profileImage ", // fields you want
        },
      });
  },

  getSinlgePatientChatsForNurse: async (soloNurseUserId: string) => {
    const nurseObjectId = new mongoose.Types.ObjectId(soloNurseUserId);

    const patients = await ChatModel.aggregate([
      // 1️⃣ Only patient → nurse chats
      {
        $match: {
          chatType: "nurse_patient",
          receiverId: nurseObjectId,
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

  getSinlgePatientChatsWithNurse: async (patientUserId: string) => {
    const patientObjectId = new mongoose.Types.ObjectId(patientUserId);

    const nurses = await ChatModel.aggregate([
      // 1️⃣ Match BOTH directions
      {
        $match: {
          chatType: "nurse_patient",
          $or: [{ senderId: patientObjectId }, { receiverId: patientObjectId }],
        },
      },

      // 2️⃣ Figure out who the nurse is
      {
        $project: {
          nurseUserId: {
            $cond: [
              { $eq: ["$senderId", patientObjectId] },
              "$receiverId", // patient sent → nurse received
              "$senderId", // nurse sent → patient received
            ],
          },
        },
      },

      // 3️⃣ Unique nurses
      {
        $group: {
          _id: "$nurseUserId",
        },
      },

      // 4️⃣ Join users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 5️⃣ Ensure role is solo nurse
      {
        $match: {
          "user.role": "solo_nurse",
        },
      },

      // 6️⃣ Final output
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

    return nurses;
  },

  deleteAppointment: async (id: string) => {
    return await soloNurseAppoinment_Model.findByIdAndDelete(id);
  },

  getAllSoloNurseCompletedAppoinmentAndAmount: async () => {
    // const now = new Date();
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Tbilisi" }),
    );
    // 🔹 Current day (0 = Sunday)
    const currentDay = now.getDay();

    // 🔹 Find this Sunday (start of current week)
    const thisSunday = new Date(now);
    thisSunday.setDate(now.getDate() - currentDay);
    thisSunday.setHours(0, 0, 0, 0);

    // 🔹 Find last Sunday (start of last week)
    const lastSunday = new Date(thisSunday);
    lastSunday.setDate(thisSunday.getDate() - 7);

    // 🔹 End of last week (Saturday 23:59:59)
    const lastWeekEnd = new Date(thisSunday);
    lastWeekEnd.setMilliseconds(-1); // 1ms before this Sunday

    // 🔹 Aggregate completed appointments from last week
    const res = await soloNurseAppoinment_Model.aggregate([
      {
        $match: {
          status: "completed",
          completedAt: { $gte: lastSunday, $lte: lastWeekEnd }, // full last week
        },
      },
      {
        $group: {
          _id: "$soloNurseId",
          totalAmount: { $sum: "$appointmentFee" },
          completedAppointments: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "solonurses",
          localField: "_id",
          foreignField: "_id",
          as: "soloNurse",
        },
      },
      { $unwind: "$soloNurse" },
      {
        $lookup: {
          from: "users",
          localField: "soloNurse.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          soloNurseId: "$soloNurse._id",
          name: "$user.fullName",
          IBAN_number:
            "$soloNurse.paymentAndEarnings.withdrawalMethods.IBanNumber",
          totalAmount: { $multiply: ["$totalAmount", 0.85] },
          completedAppointments: 1,
        },
      },
    ]);

    console.log("res data ", res);

    // 🔹 Move withdrawAbleBalance → balance for each nurse
    for (const nurse of res) {
      await Wallet_Model.findOneAndUpdate(
        { ownerId: nurse.soloNurseId, ownerType: "SOLO_NURSE" },
        {
          $inc: { balance: nurse.totalAmount }, // move totalAmount to balance
          $set: { withdrawAbleBalance: 0 }, // reset withdrawAbleBalance
        },
        { upsert: true },
      );
    }

    return res;
  },
};
