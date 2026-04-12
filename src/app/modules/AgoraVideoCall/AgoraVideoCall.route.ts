import { Router } from "express";
import { AgoraVideoCallController } from "./AgoraVideoCall.controller";

const router = Router();

router.post("/startCall", AgoraVideoCallController.startCall);
router.post("/acceptCall", AgoraVideoCallController.acceptCall);
router.post("/rejectCall", AgoraVideoCallController.rejectCallController);
router.post("/endCall", AgoraVideoCallController.endCall);

export const AgoraVideoCallRoute = router;
