import { v4 as uuidv4 } from "uuid";

import { generateAgoraToken } from "../../utils/agoraToken";
import { ICall } from "./AgoraVideoCall.interface";
import { videoCall_model } from "./AgoraVideoCall.model";
import { io } from "../../../socket/initSocket";
import { User_Model } from "../user/user.schema";

const generateAgoraUid = () => {
  return Math.floor(Math.random() * 1000000000) + 1;
};

const startCallService = async (callerId: string, receiverId: string) => {
  if (callerId === receiverId) {
    throw new Error("Caller and receiver cannot be same");
  }
  const channelName = `call_${callerId}_${receiverId}`;

  const callId = uuidv4();

  const callerUid = generateAgoraUid();
  const callerToken = generateAgoraToken(channelName, callerUid);

  console.log("token ", callerToken);

  const call: ICall = await videoCall_model.create({
    callId,
    channelName,
    callerId,
    receiverId,
    callerUid,
    status: "ringing",
  });

  const callerUser = await User_Model.findOne({ _id: callerId });

  io.to(receiverId).emit("incoming_call", {
    callId,
    channelName,
    callerId,
    callerName: callerUser?.fullName,
    callerPicture: callerUser?.profileImage,
  });

  return {
    callId,
    channelName,
    token: callerToken,
    uid: callerUid,
  };
};

const acceptCallService = async (callId: string, receiverId: string) => {
  const call = await videoCall_model.findOne({ callId, receiverId });

  if (!call) {
    throw new Error("Call not found");
  }

  const receiverUid = generateAgoraUid();
  const receiverToken = generateAgoraToken(call.channelName, receiverUid);

  call.status = "accepted";
  call.startedAt = new Date();
  call.receiverUid = receiverUid;
  await call.save();

  io.to(call.callerId).emit("call_accepted", {
    channelName: call.channelName,
    token: receiverToken,
    uid: receiverUid,
  });

  return {
    channelName: call.channelName,
    token: receiverToken,
    uid: receiverUid,
  };
};

const rejectCallService = async (callId: string, receiverId: string) => {
  const call = await videoCall_model.findOne({ callId, receiverId });

  if (!call) {
    throw new Error("Call not found");
  }

  if (call.status !== "ringing") {
    throw new Error("Call already handled");
  }

  call.status = "rejected";
  call.endedAt = new Date();
  await call.save();

  // 🔔 Notify caller
  io.to(call.callerId).emit("call_rejected", {
    callId: call.callId,
    receiverId,
  });

  return true;
};

const endCallService = async (callId: string) => {
  const call = await videoCall_model.findOne({ callId });

  if (!call) {
    throw new Error("Call not found");
  }

  call.status = "ended";
  call.endedAt = new Date();
  await call.save();

  // Emit to both caller and receiver
  [call.callerId, call.receiverId].forEach((userId) => {
    io.to(userId).emit("call_ended", {
      channelName: call.channelName,
    });
  });

  return true;
};

export const AgoraVideoCallService = {
  startCallService,
  acceptCallService,
  rejectCallService,
  endCallService,
};
