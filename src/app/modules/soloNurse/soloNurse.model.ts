import { Schema, model } from "mongoose";
import { TSoloNurse } from "./soloNurse.interface";
import { create } from "domain";

const soloNurseSchema = new Schema<TSoloNurse>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
    adminAssignProfileImageBadge: {
      type: String,
      default: null,
    },
    nationality: {
      type: String,
      required: true,
    },
    nationalIdNumber: {
      type: String,
      required: true,
    },
    phoneNumber: { type: String, required: false },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: false,
    },
    dateOfBirth: { type: String, required: false },
    professionalInformation: {
      services: [
        {
          serviceId: { type: String, required: true },
          serviceName: {
            type: String,
            enum: [
              "General nurse care",
              "Physio therapy",
              "Pregnancy care",
              "Other",
            ],
            required: true,
          },

          subServices: [
            {
              name: { type: String, required: true },
              price: { type: Number, required: true },
            },
          ],
        },
      ],

      speciality: { type: String },
      experience: { type: String },
      MedicalLicense: { type: String },
      qualifications: { type: String },
      about: { type: String },
      consultationFee: { type: String },
    },

    certificates: [
      {
        uploadCertificates: { type: String, required: true },
        certificateType: { type: String, required: false },
        certificateName: {
          type: String,
          required: false,
        },
      },
    ],
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
    slotTimeDuration: {
      type: Number,
      default: 30,
    },

    paymentAndEarnings: {
      totalEarnings: {
        totalThisMonth: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        availbleForWithdrawal: { type: Number, default: 0 },
      },
      withdrawalMethods: {
        IBanNumber: { type: String, default: null },
      },
    },
    reviews: [
      {
        patientId: { type: Schema.Types.ObjectId, ref: "Patient" },
        rating: { type: Number },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    avarageRating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export const SoloNurse_Model = model<TSoloNurse>("soloNurse", soloNurseSchema);
