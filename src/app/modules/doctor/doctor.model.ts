import { Schema, model } from "mongoose";
import { TDoctor } from "./doctor.interface";

const ProfessionalInfoSchema = new Schema({
  speciality: { type: String, required: true },
  experienceYears: { type: Number, required: true },
  medicalLicenseNumber: { type: String, required: true },
  qualifications: { type: String, required: true },
  about: { type: String, required: true },
});

const CertificateSchema = new Schema({
  uploadCertificates: { type: String },
  certificateType: { type: String },
  certificateName: { type: String },
});

const DoctorSchema = new Schema<TDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },

    phoneNumber: { type: String, required: true },
    licenseNumber: { type: String, required: true },

    serviceType: { type: String, required: true },
    // workingHour: {
    //   startTime: { type: String, required: true },
    //   endTime: { type: String, required: true },
    // },

    // availabilityScheduleDays: [{ type: String, required: true }],

    availability: {
      type: [
        {
          day: { type: String },
          startTime: { type: String },
          endTime: { type: String },
          isEnabled: { type: Boolean, default: true },
        },
      ],
      default: [],
    },

    blockedDates: {
      type: [
        {
          date: { type: Date, required: true },
          reason: { type: String },
        },
      ],
      default: [],
    },

    availableDateRange: {
      startDate: { type: Date },
      endDate: { type: Date },
      isEnabled: { type: Boolean, default: false },
    },

    slotTimeDuration: { type: Number, default: 30 },

    dateOfBirth: { type: String },
    gender: { type: String, enum: ["male", "female"] },

    professionalInformation: ProfessionalInfoSchema,
    onlineConsultationFee: { type: Number },
    clinicVisitFee: { type: Number },

    certificates: [CertificateSchema],
    appointmentType: { type: String, required: true },
    avarageRating: { type: Number, default: 0 },
    reviews: [
      {
        patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
        rating: { type: Number },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Doctor_Model = model<TDoctor>("Doctor", DoctorSchema);
