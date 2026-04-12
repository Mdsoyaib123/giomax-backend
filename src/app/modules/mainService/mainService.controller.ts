import { Request, Response } from "express";
import { MainServiceService } from "./mainService.service";


const createMainService = async (req: Request, res: Response) => {
  try {
    const services = await MainServiceService.createMainService(req.body);
    res.status(200).json({
      success: true,
      message: "Main Service created successfully",
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch main services",
    });
  }
};
const getAllMainServices = async (req: Request, res: Response) => {
  try {
    const services = await MainServiceService.getAllMainServices();
    res.status(200).json({
      success: true,
        message: "Main Services fetched successfully",
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch main services",
    });
  }
};

export const MainServiceController = {
    createMainService,
  getAllMainServices,
};
