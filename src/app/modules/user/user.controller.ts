import { Request, Response } from "express";
import { UserService } from "./user.service";

const createPatient = async (req: Request, res: Response) => {
  try {
    console.log("controlller hit");
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const nidFront = files.nidFront?.[0]?.path;
    const nidBack = files.nidBack?.[0]?.path;

    const result = await UserService.createPatient(req.body, nidFront, nidBack);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSoloNurse = async (req: Request, res: Response) => {
  try {
    const {
      certificateType,
      certificateName,
      startTime,
      endTime,
      workingDays,
      Services,
      speciality,
      experience,
      MedicalLicense,
      qualifications,
      about,
      consultationFee,

      totalThisMonth,
      pending,
      availbleForWithdrawal,

      ...data
    } = req.body;

    const certificateUrl = req.file ? (req.file as any).path : null;
    console.log("certificateUrl", certificateUrl);

    const certificates = {
      uploadCertificates: certificateUrl ? certificateUrl : null,
      certificateType,
      certificateName,
    };
    const availability = {
      startTime,
      endTime,
      workingDays,
    };

    const professionalInformation = {
      Services,
      speciality,
      experience,
      MedicalLicense,
      qualifications,
      about,
      consultationFee,
    };

    const result = await UserService.createSoloNurse({
      ...data,
      certificates,
      availability,
      professionalInformation,
    });
    res.status(201).json({
      success: true,
      message: "Solo Nurse created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createClinic = async (req: Request, res: Response) => {
  try {
    const {
      certificateType,
      certificateName,
      startTime,
      endTime,
      appointmentType,
      Services,
      speciality,
      experience,
      MedicalLicense,
      qualifications,
      about,
      consultationFee,

      totalThisMonth,
      pending,
      availbleForWithdrawal,

      servicesOffered,

      ...data
    } = req.body;

    // console.log("from controller ", req.body);

    const certificateUrl = req.file ? (req.file as any).path : null;
    console.log("certificateUrl", certificateUrl);

    const clinicCertificates = {
      uploadCertificates: certificateUrl ? certificateUrl : null,
      certificateType,
      certificateName,
    };

    const servicesOfferedData = servicesOffered
      ?.split(",")
      .map((service: string) => service.trim());

    console.log(servicesOfferedData);

    const availability = {
      startTime,
      endTime,
      appointmentType,
    };

    const result = await UserService.createClinic({
      ...data,
      clinicCertificates,
      availability,
      servicesOffered: servicesOfferedData,
    });

    console.log("clinic create", result);
    res.status(201).json({
      success: true,
      message: "Solo Nurse created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const createDoctor = async (req: Request, res: Response) => {
  try {
    const {
      certificateType,
      certificateName,
      appointmentType,

      ...data
    } = req.body;

    // console.log("from controller ", req.body);

    const certificateUrl = req.file ? (req.file as any).path : null;
    console.log("certificateUrl", certificateUrl);

    const doctorCertificates = {
      uploadCertificates: certificateUrl ? certificateUrl : null,
      certificateType,
      certificateName,
    };

    const result = await UserService.createDoctor({
      ...data,
      certificates: doctorCertificates,
      appointmentType,
    });

    console.log("doctor create", result);
    res.status(201).json({
      success: true,
      message: "doctor created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAdmin = async (req: Request, res: Response) => {
  try {
    const result = await UserService.getAdmin();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const verifyUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const code = req.params.code;
  const codeForNumber = req.query?.codeForNumber;
  try {
    const result = await UserService.verifyUser(userId as string, code as any, codeForNumber as any);
    res.json({
      success: true,
      message: "User verified successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const addAdminApproval = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await UserService.addAdminApproval(userId as string);
    res.json({
      success: true,
      message: "Admin approval added successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const user_controllers = {
  createPatient,
  createSoloNurse,
  createClinic,
  createDoctor,
  getAdmin,
  verifyUser,
  addAdminApproval,
};
