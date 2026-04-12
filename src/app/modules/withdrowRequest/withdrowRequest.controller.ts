import { Request, Response } from "express";
import { WithdrowRequestService } from "./withdrowRequest.service";

const createWithdrawRequest = async (req: Request, res: Response) => {
  try {
    const result = await WithdrowRequestService.createWithdrawRequest(req.body);

    res.status(201).json({
      success: true,
      message: `Withdraw request of ${
        result.amount
      } GEL for ${result.ownerType.toLowerCase()} created successfully.`,
      data: result,
    });
  } catch (error: any) {

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyWithdrawRequests = async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    const result = await WithdrowRequestService.getWithdrawRequestsByOwner(
      ownerId as string
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllWithdrawRequests = async (_req: Request, res: Response) => {
  try {
    const result = await WithdrowRequestService.getAllWithdrawRequests();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

 const getSingleWithdrawRequest = async (req: Request, res: Response) => {
  try {
    const result = await WithdrowRequestService.getSingleWithdrawRequest(
      req.params.withdrawId as string
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const markWithdrawAsPaid = async (req: Request, res: Response) => {
  try {
    const result = await WithdrowRequestService.markAsPaid(
      req.params.withdrawId as string
    );
    res.json({
      success: true,
      message: "You received your money by cutting plaatfrom fee",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const rejectWithdrawRequest = async (req: Request, res: Response) => {
  try {
    const result = await WithdrowRequestService.rejectWithdraw(req.params.id as string);
    res.json({
      success: true,
      message: "Withdraw request rejected",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const WithdrawRequestController = {
  createWithdrawRequest,
  getMyWithdrawRequests,
  getAllWithdrawRequests,
  getSingleWithdrawRequest,
  markWithdrawAsPaid,
  rejectWithdrawRequest,
};
