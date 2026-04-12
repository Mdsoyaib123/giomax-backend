import { Request, Response } from "express";
import { ClinicService } from "./clinic.service";

const getAllClinics = async (_req: Request, res: Response) => {
  try {
    const result = await ClinicService.getAllClinics();

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getClinicById = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getClinicById(req.params.userId as any);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getClinicAppointments = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getClinicAppointments(
      req.params.clinicId as string,
      req.query.status as any,
      req.query.doctorId as any,
      req.query.prefarenceDate as any,
      req.query.serviceType as any,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    res.json({
      success: true,
      message: "Clinic appointments fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getAllAppoinmentsPrefarenceDate = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getAllAppoinmentsPrefarenceDate(
      req.params.clinicId as string,
    );
    res.json({
      success: true,
      message: "Clinic appointments date fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getClinicDoctors = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getClinicDoctors(
      req.params.clinicId as string,
      req.query.appointmentType as any,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    res.json({
      success: true,
      message: "Clinic doctors fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getClinicPatients = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getClinicPatients(req.params.clinicId as string);

    res.json({
      success: true,
      message: "Clinic patients fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateClinicBasic = async (req: Request, res: Response) => {
  try {
    const profileImageUrl = req.file ? (req.file as any).path : null;
    console.log("profile image url ", profileImageUrl);

    const result = await ClinicService.updateClinicBasic(
      req.params.userId as string,
      req.body,
      profileImageUrl,
    );

    res.json({
      success: true,
      message: "Clinic information updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateClinicResponsiblePersonInfo = async (req: Request, res: Response) => {
  try {

    const result = await ClinicService.updateClinicResponsiblePersonInfo(
      req.params.userId as string,
      req.body,
    );

    res.json({
      success: true,
      message: "Clinic responsible person information updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const uploadCertificate = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const data = req.body;

    const certificateUrl = req.file ? (req.file as any).path : null;
    console.log("certificateUrl", certificateUrl);

    const result = await ClinicService.uploadCertificate(userId as string, {
      data,
      certificateUrl,
    });

    res.json({
      success: true,
      message: "Certificate uploaded successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCertificate = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const certificateId = req.params.certificateId;

    const result = await ClinicService.deleteCertificate(userId as string, certificateId as string);

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
};

const availabilitySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const data = req.body;

    const result = await ClinicService.availabilitySettings(userId as string, data);

    res.json({
      success: true,
      message: "availability settings updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const addReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const data = req.body;

    const result = await ClinicService.addReviews(userId as string, data);

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
};
const addNewPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const data = req.body;

    const result = await ClinicService.addNewPaymentMethod(userId as string, data);

    res.json({
      success: true,
      message: "New Payment Method added successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteClinic = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.deleteClinic(req.params.userId as any);

    res.json({
      success: true,
      message: "Clinic deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAppoinmentTimeBasedOnDateForClinic = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await ClinicService.getAppoinmentTimeBasedOnDateForClinic(
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
};

const getClinicPaymentData = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getClinicPaymentData(
      req.params.clinicUserId as string,
    );

    res.json({
      success: true,
      message: "Clinic payment data fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getClinicDashboardOverview = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getClinicDashboardOverview(
      req.params.clinicId as string,
    );

    res.json({
      success: true,
      message: "Clinic dashboard overview  fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getAllClinicName = async (req: Request, res: Response) => {
  try {
    const result = await ClinicService.getAllClinicName();

    res.json({
      success: true,
      message: "clinic names fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const ClinicController = {
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
