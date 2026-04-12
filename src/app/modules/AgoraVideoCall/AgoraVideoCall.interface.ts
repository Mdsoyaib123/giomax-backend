import { Document } from "mongoose";

export type CallStatus =
  | "ringing"
  | "accepted"
  | "ended"
  | "missed"
  | "rejected";

export interface ICall extends Document {
  callId: string;
  channelName: string;
  callerId: string;
  receiverId: string;
  // pairKey: string;
  callerUid?: number;
  receiverUid?: number;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
