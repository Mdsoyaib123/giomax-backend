import { Request, Response } from "express";
import { soloNurseAppointmentService } from "./soloNurseAppoinment.service";

export const soloNurseAppointmentController = {
  create: async (req: Request, res: Response) => {
    try {
      const appointment = await soloNurseAppointmentService.createAppointment(
        req.body,
      );
      res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  Reschedule: async (req: Request, res: Response) => {
    try {
      const result = await soloNurseAppointmentService.Reschedule(req.body);
      res.status(201).json({
        success: true,
        message: "Appointment reschedule successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const status = _req.query.status as string | undefined;
      const nurseId = _req.query.nurseId as string | undefined;
      const appointments = await soloNurseAppointmentService.getAllAppointments(
        status,
        nurseId,
      );
      res.status(200).json({
        success: true,
        message: "Appointments fetched successfully",
        data: appointments,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const appointment = await soloNurseAppointmentService.getAppointmentById(
        req.params.id as string,
      );
      if (!appointment)
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      res.status(200).json({
        success: true,
        message: "Appointment fetched successfully",
        data: appointment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const updatedAppointment =
        await soloNurseAppointmentService.updateAppointment(
          req.params.id as string,
          req.body,
        );
      if (!updatedAppointment)
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        data: updatedAppointment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getSelectedDateAndTime: async (req: Request, res: Response) => {
    try {
      const result = await soloNurseAppointmentService.getSelectedDateAndTime(
        req.params.id as string,
        req.query.date as string,
      );
      res.json({
        success: true,
        message: "get time and date successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getAppoinmentTimeBasedOnDate: async (req: Request, res: Response) => {
    try {
      const result =
        await soloNurseAppointmentService.getAppoinmentTimeBasedOnDate(
          req.body.Date,
          req.params.id as string,
        );
      res.json({
        success: true,
        message: "get time based on data fetch successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getSinglePaintentAppointmentForNurse: async (req: Request, res: Response) => {
    try {
      const result =
        await soloNurseAppointmentService.getSinglePaintentAppointmentForNurse(
          req.params.patientId as string,
        );
      res.json({
        success: true,
        message: "Appointment fetched successfully",

        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getSingleNurseAppointment: async (req: Request, res: Response) => {
    try {
      const result =
        await soloNurseAppointmentService.getSingleNurseAppointment(
          req.params.soloNurseId as string,
        );
      res.json({
        success: true,
        message: "Appointment fetched successfully",

        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getSinlgePatientChatsForNurse: async (req: Request, res: Response) => {
    try {
      const result =
        await soloNurseAppointmentService.getSinlgePatientChatsForNurse(
          req.params.soloNurseUserId as string,
        );
      res.json({
        success: true,
        message: "chats profile   fetched successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getSinlgePatientChatsWithNurse: async (req: Request, res: Response) => {
    try {
      const result =
        await soloNurseAppointmentService.getSinlgePatientChatsWithNurse(
          req.params.patientUserId as string,
        );
      res.json({
        success: true,
        message: "chats profile   fetched successfully",

        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  deleteAppointment: async (req: Request, res: Response) => {
    try {
      const result = await soloNurseAppointmentService.deleteAppointment(
        req.params.appoinmentId as string,
      );
      res.json({
        success: true,
        message: "appointment deleted successfully",

        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getAllSoloNurseCompletedAppoinmentAndAmount: async (
    req: Request,
    res: Response,
  ) => {
    try {
      const result =
        await soloNurseAppointmentService.getAllSoloNurseCompletedAppoinmentAndAmount();
      res.json({
        success: true,
        message: " all completed appoinment and amount fetched successfully",

        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

};
