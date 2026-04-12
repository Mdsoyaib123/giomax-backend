import { Request, Response } from "express";
import { DoctorService } from "./doctor.service";

export const DoctorController = {
  updateDoctor: async (req: Request, res: Response) => {
    try {
      const doctorId = req.params.doctorId;
      const payload = req.body;

      // console.log('controller payload ,', payload);

      const updatedDoctor = await DoctorService.updateDoctor(doctorId as string, payload);

      res.json({
        success: true,
        message: "Doctor updated successfully",
        data: updatedDoctor,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update doctor",
      });
    }
  },

  getDoctors: async (req: Request, res: Response) => {
    try {
      const doctors = await DoctorService.getDoctors();
      res.json({ success: true, data: doctors });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getDoctorById: async (req: Request, res: Response) => {
    try {
      const doctor = await DoctorService.getDoctorById(req.params.userId as string);
      if (!doctor) {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }
      res.json({ success: true, data: doctor });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getSingleDoctorPatientList: async (req: Request, res: Response) => {
    try {
      const patientList = await DoctorService.getSingleDoctorPatientList(
        req.params.doctorId as string
      );
      if (!patientList) {
        return res
          .status(404)
          .json({ success: false, message: "Doctor not found" });
      }
      res.json({
        success: true,
        message: "Patient list fetched successfully",
        data: patientList,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateDoctorBasic: async (req: Request, res: Response) => {
    try {
      const profileImageUrl = req.file ? (req.file as any).path : null;
      console.log("profile image url ", profileImageUrl);

      const result = await DoctorService.updateDoctorBasic(
        req.params.userId as string,
        req.body,
        profileImageUrl
      );

      res.json({
        success: true,
        message: "Doctor updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  professionalUpdate: async (req: Request, res: Response) => {
    console.log("from controller ", req.body);
    try {
      const result = await DoctorService.professionalUpdate(
        req.params.userId as string,
        req.body
      );

      res.json({
        success: true,
        message: " Doctor professional information  updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  uploadCertificate: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const data = req.body;

      const certificateUrl = req.file ? (req.file as any).path : null;
      console.log("certificateUrl", certificateUrl);

      const result = await DoctorService.uploadCertificate(userId as string, {
        data,
        certificateUrl,
      });

      res.json({
        success: true,
        message: "Certificate updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteCertificate: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const certificateId = req.params.certificateId;

      const result = await DoctorService.deleteCertificate(
        userId as string,
        certificateId as string
      );

      res.json({
        success: true,
        message: "Certificate deleted successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteDoctor: async (req: Request, res: Response) => {
    try {
      const { doctorId, clinicId, doctorUserId } = req.body;
      await DoctorService.deleteDoctor(doctorId, clinicId, doctorUserId);
      res.json({ success: true, message: "Doctor deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  getDoctorDashboardOverview: async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const result = await DoctorService.getDoctorDashboardOverview(doctorId as string);
      res.json({
        success: true,
        message: "Doctor dashboard overview fetched successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addReviews: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const data = req.body;

      const result = await DoctorService.addReviews(userId as string, data);

      res.json({
        success: true,
        message: "Review added successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
