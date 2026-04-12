import { Request, Response } from "express";
import { AgoraVideoCallService } from "./AgoraVideoCall.service";

const startCall = async (req: Request, res: Response) => {
  try {
    const { callerId, receiverId } = req.body;

    if (!callerId || !receiverId) {
      return res
        .status(400)
        .json({ success: false, message: "callerId & receiverId required" });
    }

    const data = await AgoraVideoCallService.startCallService(
      callerId,
      receiverId
    );

    res.json({
      success: true,
      appId: process.env.AGORA_APP_ID,
      ...data,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptCall = async (req: Request, res: Response) => {
  try {
    const { callId, receiverId } = req.body;

    const data = await AgoraVideoCallService.acceptCallService(
      callId,
      receiverId
    );

    res.json({
      success: true,
      appId: process.env.AGORA_APP_ID,
      ...data,
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};
const rejectCallController = async (req: Request, res: Response) => {
  try {
    const { callId, receiverId } = req.body;

    const data = await AgoraVideoCallService.rejectCallService(
      callId,
      receiverId
    );

    res.json({
      success: true,
      appId: process.env.AGORA_APP_ID,
      rejected: data,
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const endCall = async (req: Request, res: Response) => {
  try {
    const { callId } = req.body;

    await AgoraVideoCallService.endCallService(callId);

    res.json({
      success: true,
      message: "Call ended successfully",
    });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const AgoraVideoCallController = {
  startCall,
  acceptCall,
  rejectCallController,
  endCall,
};
