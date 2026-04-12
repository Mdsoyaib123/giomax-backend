import { Types } from "mongoose";

export type TSoloNurseAppoinment = {
  patientId: Types.ObjectId;
  soloNurseId: Types.ObjectId;
  homeAddress?: string;
  visitingType: "fristVisit" | "followUp";
  followUpDetails?: string;
  reasonForVisit?: string;
  status: "pending" | "confirmed" | "completed" | "rejected";
  prefarenceDate: Date[];
  prefarenceTime: string;
  subService: string;
  appointmentFee: number;
  isRefunded: 'refund-requested' |'refunded' | 'no-refund' | 'refund-rejected';
  completedAt?: Date;
};
