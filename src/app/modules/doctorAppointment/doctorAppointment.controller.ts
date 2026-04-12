import { Request, Response } from "express";
import { doctorAppointmentService } from "./doctorAppointment.service";

export const doctorAppointmentController = {
  create: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.createAppointment(req.body);
      res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  Reschedule: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.Reschedule(req.body);
      res.status(201).json({
        success: true,
        message: "Appointment reschedule successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const clinicId = req.query.clinicId as string | undefined;
      const result = await doctorAppointmentService.getAllAppointments(
        status,
        req.query.doctorId as string | undefined,
        clinicId as string | undefined
      );
      res.json({
        success: true,
        message: "Appointments fetched successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getOne: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.getAppointmentById(
        req.params.id as string
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
  AdvanceFilterInDashboard: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.AdvanceFilterInDashboard(
        req.body
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
  getSinglePaintentAppointment: async (req: Request, res: Response) => {
    try {
      const result =
        await doctorAppointmentService.getSinglePaintentAppointment(
          req.params.patientId as string
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

  getSingleDoctorAppointment: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.getSingleDoctorAppointment(
        req.params.doctorId as string
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

  getSinglePaitentChats: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.getSinglePaitentChats(
        req.params.patientId as string,
        req.params.date as string

      );
      res.json({
        success: true,
        message: "chats profile  fetched successfully",

        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getSingleDoctorChats: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.getSingleDoctorChats(
        req.params.doctorId as string
        ,
        req.params.date as string
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
  getSinlgeClinicChats: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.getSinlgeClinicChats(
        req.params.clinicUserId as string
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
  getSinglePatientChatsWithClinic: async (req: Request, res: Response) => {
    try {
      const patientUserId = req.params.patientUserId;
      const result =
        await doctorAppointmentService.getSinglePatientChatsWithClinic(
          patientUserId as string   
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

  updateStatus: async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const result = await doctorAppointmentService.updateStatus(
        req.params.id as string,
        status
      );
      res.json({
        success: true,
        message: "Status updated successfully",
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  getSelectedDateAndTime: async (req: Request, res: Response) => {
    try {
      const result = await doctorAppointmentService.getSelectedDateAndTime(
        req.params.id as string,
        req.query.date as string
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
        await doctorAppointmentService.getAppoinmentTimeBasedOnDate(
          req.body.Date,
          req.params.id as string
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

  delete: async (req: Request, res: Response) => {
    try {
      await doctorAppointmentService.deleteAppointment(req.params.appoinmentId as string);
      res.json({
        success: true,
        message: "Appointment deleted",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
