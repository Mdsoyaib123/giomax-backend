import { Request, Response } from "express";
import { RefundService } from "./refund.service";

// User requests a refund
const createRefund = async (req: Request, res: Response) => {
  try {
    const result = await RefundService.createRefund(req.body);
    res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({  // Use 400 for client errors like invalid input
      success: false,
      message: error.message,
    });
  }
};

// Get all refunds (Admin)
const getAllRefunds = async (_req: Request, res: Response) => {
  try {
    const result = await RefundService.getAllRefunds();
    res.status(200).json({
      success: true,
      message: "Refund requests retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get refunds by userId
const getRefundsByUserId = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await RefundService.getRefundsByUserId(patientId as string);
    res.status(200).json({
      success: true,
      message: "User refund requests retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin approves or rejects a refund
const acceptOrRejectRefund = async (req: Request, res: Response) => {
  try {
    const { refundId } = req.params; // Correct param
    const { status } = req.body;     // "APPROVED" or "REJECTED"

    const result = await RefundService.acceptOrRejectRefund(refundId as string, status);

    res.status(200).json({
      success: true,
      message: "Refund request status updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const RefundController = {
  createRefund,
  getAllRefunds,
  getRefundsByUserId,
  acceptOrRejectRefund,
};
