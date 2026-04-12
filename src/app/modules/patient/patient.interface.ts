import { Types } from "mongoose";

export type TPatient = {
  userId: Types.ObjectId;
  phoneNumber?: string;
  nationalIdNumber?: string;
  nationality?: string;
  gender?: "male" | "female";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  dateOfBirth?: string;
  age?: number;
  address?: {
    addressLabel: string;
    streetNumber: string;
    apartmentNumber: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
  medicalHistory?: {
    conditions: {
      name: string;
      diagnosedDate: string;
      status: string;
      notes?: string;
    }[];
    Medications: {
      name: string;
      dosage: string;
      frequency: string;
      startDate: string;
    }[];
    Allergies: {
      allergyOn: string;
      severity: string;
      reaction: string;
    }[];
  };
  paymentMethods: {
    _id: any;
    cardHolderName: string;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    isDefault ?: boolean
  }[];
  employer?: string;
  nidFrontImageUrl?: string;
  nidBackImageUrl?: string;
};
