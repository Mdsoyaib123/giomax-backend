import { Request, Response } from "express";
import { DashboardService } from "./admin.service";

const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const data = await DashboardService.getDashboardOverview();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard data",
    });
  }
};
const udpateAdmin = async (req: Request, res: Response) => {
  try {
    const profileImageUrl = req.file ? (req.file as any).path : null;
    console.log("profile image url ", profileImageUrl);

    const data = await DashboardService.udpateAdmin(
      req.params.adminId as string,
      req.body,
      profileImageUrl
    );

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard data",
    });
  }
};
const assaignSoloNurseProfilebadge = async (req: Request, res: Response) => {
  try {
    const assaignSoloNurseProfilebadge = req.file ? (req.file as any).path : null;
    console.log("profile image url ", assaignSoloNurseProfilebadge);

    const data = await DashboardService.assaignSoloNurseProfilebadge(
      req.params.soloNurseId as string,
      assaignSoloNurseProfilebadge
    );

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load dashboard data",
    });
  }
};
const AdminEmailSupport = async (req: Request, res: Response) => {
  try {
    const data = await DashboardService.AdminEmailSupport(req.body);

    res.status(200).json({
      success: true,
      message: "message sent successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send email",
    });
  }
};

export const DashboardController = {
  getDashboardOverview,
  udpateAdmin,
  assaignSoloNurseProfilebadge,
  AdminEmailSupport
};
