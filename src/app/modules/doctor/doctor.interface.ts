import { Types } from "mongoose";

interface TAvailableDateRange {
  startDate?: Date;
  endDate?: Date;
  isEnabled: boolean;
}
export type TDoctor = {
  userId: Types.ObjectId;
  clinicId: Types.ObjectId;
  phoneNumber: string;
  licenseNumber: string;

  serviceType: string; // dropdown
  appointmentType: "inClinic" | "online" | "both";

  // workingHour: {
  //   startTime: string; // "09:00 AM"
  //   endTime: string; // "06:00 PM"
  // };
  // availabilityScheduleDays: string[]; // comma-separated (e.g. Monday, Tuesday)

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

  dateOfBirth?: string;
  gender?: "male" | "female";
  professionalInformation?: {
    speciality: string;
    experienceYears: number;
    medicalLicenseNumber: string;
    qualifications: string;
    about: string;

    // Consultation Fees
  };
  onlineConsultationFee?: number;
  clinicVisitFee?: number;
  certificates?: {
    uploadCertificates: string;
    certificateType: string;
    certificateName: string;
  }[];
  avarageRating?: number;
  reviews?: {
    patientId: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
};
