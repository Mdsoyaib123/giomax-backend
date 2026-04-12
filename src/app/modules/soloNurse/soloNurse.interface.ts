import { Types } from "mongoose";

interface TAvailableDateRange {
  startDate?: Date;
  endDate?: Date;
  isEnabled: boolean;
}

export type TSoloNurse = {
  userId: Types.ObjectId;
  adminAssignProfileImageBadge?: string; 
  nationality: string;
  nationalIdNumber: string;
  phoneNumber?: string;

  gender?: "male" | "female";
  dateOfBirth?: string;
  professionalInformation?: {
    services: {
      serviceId: string;
      serviceName:
        | "General nurse care"
        | "Physio therapy"
        | "Pregnancy care"
        | "Other";

      subServices: {
        name: string;
        price: number;
      }[];
    }[];

    speciality: string;
    experience: string;
    MedicalLicense: string;
    qualifications: string;
    about: string;
    consultationFee: string;
  };

  certificates?: {
    uploadCertificates: string;
    certificateType: string;
    certificateName: string;
  }[];
  /** ✅ UPDATED AVAILABILITY LOGIC */
  availability?: {
    day: string; // Saturday, Sunday
    startTime: string; // 09:00
    endTime: string; // 17:00
    isEnabled: boolean;
  }[];
  slotTimeDuration?: number;

  /** ✅ DATE-BASED BLOCKING */
  blockedDates?: {
    date: Date; // YYYY-MM-DD
  }[];

  availableDateRange?: TAvailableDateRange; // 👈 NEW FIELD

  paymentAndEarnings?: {
    totalEarnings: {
      totalThisMonth: number;
      pending: number;
      availbleForWithdrawal: number;
    };
    withdrawalMethods: {
      IBanNumber: string | null;
    };
  };
  reviews?: {
    patientId: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
  avarageRating?: number;
};
