import { Request, Response } from "express";
import { patientService } from "./patient.service";

export const patientController = {
  getAllPatients: async (_req: Request, res: Response) => {
    try {
      const patients = await patientService.getAllPatients();

      res.status(200).json({
        success: true,
        data: patients,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPatientById: async (req: Request, res: Response) => {
    try {
      const patient = await patientService.getPatientById(req.params.userId as string);

      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updatePatientBasic: async (req: Request, res: Response) => {
    try {
      // const profileImageUrl = req.file ? (req.file as any).path : null;
      // console.log("profile image url ", profileImageUrl);
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const profileImageUrl = files.profileImage?.[0]?.path;
      const nidFront = files.nidFront?.[0]?.path;
      const nidBack = files.nidBack?.[0]?.path;

      // console.log("profile image url ", profileImageUrl);
      // console.log("nid front url ", nidFront);
      // console.log("nid back url ", nidBack);

      const result = await patientService.updatePatientBasic(
        req.params.userId as string,
        req.body,
        profileImageUrl,
        nidFront,
        nidBack
      );

      res.json({
        success: true,
        message: "Patient updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  createOrUpdateAddress: async (req: Request, res: Response) => {
    try {
      const addressId = req.query?.addressId as string;

      const result = await patientService.createOrUpdateAddress(
        req.params.userId as string,
        addressId,
        req.body,
      );

      res.json({
        success: true,
        message: "Patient updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  setDefaultAddressController: async (req: Request, res: Response) => {
    try {
      const { patientId, addressId } = req.params;

      const result = await patientService.setDefaultAddress(
        patientId as string,
        addressId as string,
      );

      res.status(200).json({
        success: true,
        message: "Default address updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteAddressController: async (req: Request, res: Response) => {
    try {
      const { patientId, addressId } = req.params;

      const result = await patientService.deleteAddress(patientId as string, addressId as string);

      res.status(200).json({
        success: true,
        message: "Address deleted successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  addMedicalHistoryService: async (req: Request, res: Response) => {
    try {
      const { medicalConditions, medicalMedications, allergies } = req.body;
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await patientService.addMedicalHistoryService(
        userId as string,
        medicalConditions,
        medicalMedications,
        allergies,
      );

      return res.status(200).json({
        success: true,
        message: "Medical history added successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  },
  updateMedicalHistoryService: async (req: Request, res: Response) => {
    try {
      const { medicalConditions, medicalMedications, allergies } = req.body;
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await patientService.updateMedicalHistoryService(
        userId as string,
        medicalConditions,
        medicalMedications,
        allergies,
      );

      return res.status(200).json({
        success: true,
        message: "Medical history updated successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  },
  deleteMedicalHistoryService: async (req: Request, res: Response) => {
    try {
      const { medicalConditions, medicalMedications, allergies } = req.body;
      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const result = await patientService.deleteMedicalHistoryService(
        userId as string,
        medicalConditions,
        medicalMedications,
        allergies,
      );

      return res.status(200).json({
        success: true,
        message: "Medical history deleted successfully",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  },

  addNewPaymentMethod: async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const data = req.body;

      const result = await patientService.addNewPaymentMethod(userId as string, data);

      res.json({
        success: true,
        message: "New Payment Method for Patient added successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  setDefaultPaymentMethod: async (req: Request, res: Response) => {
    try {
      const { patientId, paymentMethodId } = req.params;

      const result = await patientService.setDefaultPaymentMethod(
        patientId as string,
        paymentMethodId as string,
      );

      res.status(200).json({
        success: true,
        message: "Default payment method updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  },

  deletePatient: async (req: Request, res: Response) => {
    try {
      const deleted = await patientService.deletePatient(req.params.patientId as string);

      res.status(200).json({
        success: true,
        message: "Patient profile deleted successfully",
        data: deleted,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
