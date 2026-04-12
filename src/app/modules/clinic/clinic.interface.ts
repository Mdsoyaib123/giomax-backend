import { Types } from "mongoose";

export type TClinic = {
  userId: Types.ObjectId;
  phoneNumber?: string;
  nationality: string;
  nationalIdNumber: string;
  address?: string;
  clinicCertificates?: {
    uploadCertificates: string;
    certificateType?: string;
    certificateName?: string;
  }[];
  medicalLicenseNumber?: string;
  servicesOffered?: string[];
  clinicDescription?: string;
  availability?: {
    startTime: string;
    endTime: string;
    workingDays: string[];
    appointmentType: "inClinic" | "online" | "both";
  };
  paymentAndEarnings?: {
    totalEarnings: {
      totalThisMonth: number;
      pending: number;
      availbleForWithdrawal: number;
    };
    withdrawalMethods: {
      IBanNumber: string;
    };
  };
  reviews?: {
    patientId: Types.ObjectId;
    rating: number;
    comment: string;
  }[];
  avarageRating?: number;
  bussinessIdentificationNumber?: string;
  responsiblePersonInformation?: {
    name: string;
    position: string;
    email: string;
    contactNumber: string;
    personalIdNumber: string;
  };
};
