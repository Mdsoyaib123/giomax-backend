import { Patient_Model } from "./patient.model";
import { TPatient } from "./patient.interface";
import mongoose from "mongoose";
import { User_Model } from "../user/user.schema";
import { Wallet_Model } from "../wallet/wallet.model";

export const patientService = {
  getAllPatients: async () => {
    return await Patient_Model.find().populate({
      path: "userId",
      select: "fullName profileImage email",
    });
  },

  getPatientById: async (userId: string) => {
    return await Patient_Model.findOne({ userId }).populate("userId");
  },

  updatePatientBasic: async (
    userId: string,
    payload: any,
    profileImageUrl: string,
    nidFront?: string,
    nidBack?: string,
  ) => {
    const {
      fullName,
      phoneNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      nationalIdNumber,
      nationality,
      employer,
    } = payload;

    if (payload.dateOfBirth) {
      const dob = new Date(payload.dateOfBirth);
      const today = new Date();

      if (isNaN(dob.getTime())) {
        throw new Error("Invalid date of birth");
      }

      if (dob > today) {
        throw new Error("Date of birth cannot be in the future.");
      }

      let age = today.getFullYear() - dob.getFullYear();

      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      if (age < 0) {
        throw new Error("Invalid age calculated");
      }

      payload.age = age;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      /* ---------------- USER UPDATE ---------------- */

      const updateData: any = {};

      if (fullName !== undefined) {
        updateData.fullName = fullName;
      }

      if (profileImageUrl) {
        updateData.profileImage = profileImageUrl;
      }

      const updatedUser = await User_Model.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, session },
      );

      if (!updatedUser) {
        throw new Error("User not found!");
      }

      /* ---------------- PATIENT UPDATE ---------------- */

      let dataToUpdate: any = {};

      if (nidFront) {
        dataToUpdate.nidFrontImageUrl = nidFront;
      }

      if (nidBack) {
        dataToUpdate.nidBackImageUrl = nidBack;
      }

      if (employer) {
        dataToUpdate.employer = employer;
      }

      const updatedPatient = await Patient_Model.findOneAndUpdate(
        { userId },
        {
          phoneNumber,
          nationalIdNumber,
          dateOfBirth,
          gender,
          bloodGroup,
          age: payload?.age,
          nationality,
          ...dataToUpdate,
        },
        { new: true, session },
      ).populate("userId");

      if (!updatedPatient) {
        throw new Error("Patient profile not found!");
      }

      await session.commitTransaction();

      return updatedPatient;
    } catch (error) {
      // ✅ Prevent abort-after-commit error
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw error;
    } finally {
      // ✅ Always close session safely
      session.endSession();
    }
  },

  createOrUpdateAddress: async (
    userId: string,
    addressId: string,
    payload: any,
  ) => {
    try {
      // If addressId is provided → update existing address

      if (addressId) {
        console.log("address id ", addressId);
        console.log("payload ", payload);
        const updatedPatient = await Patient_Model.findOneAndUpdate(
          {
            userId,
            "address._id": addressId,
          },
          {
            $set: {
              "address.$.addressLabel": payload.addressLabel,
              "address.$.streetNumber": payload.streetNumber,
              "address.$.apartmentNumber": payload.apartmentNumber,
              "address.$.city": payload.city,
              "address.$.state": payload.state,
              "address.$.zipCode": payload.zipCode,
            },
          },
          { new: true },
        ).populate("userId");

        if (!updatedPatient) {
          throw new Error("Address not found!");
        }

        return updatedPatient;
      }

      // If addressId is NOT provided → add (push) new address
      const updatedPatient = await Patient_Model.findOneAndUpdate(
        { userId },
        {
          $push: {
            address: payload,
          },
        },
        { new: true },
      ).populate("userId");

      if (!updatedPatient) {
        throw new Error("Patient not found!");
      }

      return updatedPatient;
    } catch (error) {
      console.log(error);
    }
  },

  setDefaultAddress: async (patientId: string, addressId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Remove default from all addresses
      await Patient_Model.updateOne(
        { _id: patientId },
        {
          $set: {
            "address.$[].isDefault": false,
          },
        },
        { session },
      );

      // 2️⃣ Set selected address as default
      const updatedPatient = await Patient_Model.findOneAndUpdate(
        {
          _id: patientId,
          "address._id": addressId,
        },
        {
          $set: {
            "address.$.isDefault": true,
          },
        },
        { new: true, session },
      );

      if (!updatedPatient) {
        throw new Error("Patient or address not found");
      }

      await session.commitTransaction();
      session.endSession();

      return updatedPatient.address;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  deleteAddress: async (patientId: string, addressId: string) => {
    const updatedPatient = await Patient_Model.findByIdAndUpdate(
      patientId,
      {
        $pull: {
          address: { _id: addressId },
        },
      },
      { new: true },
    );

    if (!updatedPatient) {
      throw new Error("Patient not found");
    }

    return updatedPatient.address;
  },
  addMedicalHistoryService: async (
    userId: string,
    medicalConditions?: any[],
    medicalMedications?: any[],
    allergies?: any[],
  ) => {
    const pushFields: any = {};

    if (medicalConditions && medicalConditions.length > 0) {
      pushFields["medicalHistory.conditions"] = { $each: medicalConditions };
    }

    if (medicalMedications && medicalMedications.length > 0) {
      pushFields["medicalHistory.Medications"] = { $each: medicalMedications };
    }

    if (allergies && allergies.length > 0) {
      pushFields["medicalHistory.Allergies"] = { $each: allergies };
    }

    // If nothing to add
    if (Object.keys(pushFields).length === 0) {
      throw new Error("No valid items provided to add");
    }

    const updatedPatient = await Patient_Model.findOneAndUpdate(
      { userId },
      { $push: pushFields },
      { new: true, upsert: true },
    );

    return updatedPatient;
  },
  updateMedicalHistoryService: async (
    userId: string,
    medicalConditions?: any,
    medicalMedications?: any,
    allergies?: any,
  ) => {
    const updateFields: any = {};
    const arrayFilters: any[] = [];

    if (medicalConditions && medicalConditions._id) {
      updateFields["medicalHistory.conditions.$[cond]"] = medicalConditions;
      arrayFilters.push({ "cond._id": medicalConditions._id });
    }

    if (medicalMedications && medicalMedications._id) {
      updateFields["medicalHistory.Medications.$[med]"] = medicalMedications;
      arrayFilters.push({ "med._id": medicalMedications._id });
    }

    if (allergies && allergies._id) {
      updateFields["medicalHistory.Allergies.$[alg]"] = allergies;
      arrayFilters.push({ "alg._id": allergies._id });
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No valid fields provided for updating");
    }

    const updatedPatient = await Patient_Model.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      {
        new: true,
        arrayFilters,
      },
    );

    return updatedPatient;
  },
  deleteMedicalHistoryService: async (
    userId: string,
    medicalConditions?: any,
    medicalMedications?: any,
    allergies?: any,
  ) => {
    const pullFields: any = {};

    if (medicalConditions && medicalConditions._id) {
      pullFields["medicalHistory.conditions"] = { _id: medicalConditions._id };
    }

    if (medicalMedications && medicalMedications._id) {
      pullFields["medicalHistory.Medications"] = {
        _id: medicalMedications._id,
      };
    }

    if (allergies && allergies._id) {
      pullFields["medicalHistory.Allergies"] = { _id: allergies._id };
    }

    if (Object.keys(pullFields).length === 0) {
      throw new Error("No valid item provided for deletion");
    }

    const updatedPatient = await Patient_Model.findOneAndUpdate(
      { userId },
      { $pull: pullFields },
      { new: true },
    );

    return updatedPatient;
  },

  addNewPaymentMethod: async (userId: string, payload: any) => {
    console.log("payload from service ", payload);

    const patient = await Patient_Model.findOne({ userId });

    if (!patient) {
      throw new Error("patient not found for this user");
    }

    const isFirstPaymentMethod = patient.paymentMethods.length === 0;

    const newMethod = {
      cardHolderName: payload.cardHolderName,
      cardNumber: payload.cardNumber,
      cvv: payload.cvv,
      expiryDate: payload.expiryDate,
      isDefault: isFirstPaymentMethod,
    };

    // push into nested array
    const updatedClinic = await Patient_Model.findOneAndUpdate(
      { userId },
      {
        $push: { paymentMethods: newMethod },
      },
      { new: true },
    );

    return updatedClinic;
  },
  setDefaultPaymentMethod: async (
    patientId: string,
    paymentMethodId: string,
  ) => {
    if (
      !mongoose.Types.ObjectId.isValid(patientId) ||
      !mongoose.Types.ObjectId.isValid(paymentMethodId)
    ) {
      throw { statusCode: 400, message: "Invalid ID" };
    }

    const patient = await Patient_Model.findById(patientId);

    if (!patient) {
      throw { statusCode: 404, message: "Patient not found" };
    }

    const paymentMethod = patient.paymentMethods.find(
      (method) => method._id.toString() === paymentMethodId,
    );

    if (!paymentMethod) {
      throw { statusCode: 404, message: "Payment method not found" };
    }

    // Remove default from all
    patient.paymentMethods.forEach((method) => {
      method.isDefault = false;
    });

    // Set selected as default
    paymentMethod.isDefault = true;

    await patient.save();

    return patient;
  },

  deletePatient: async (id: string) => {
    // 1. Find patient first
    const existingPatient = await Patient_Model.findOne({ _id: id });

    if (!existingPatient) {
      throw new Error("Patient not found");
    }


    // 2. Delete linked user
    await User_Model.findByIdAndDelete(existingPatient.userId);

    // 3. Delete patient
    await Patient_Model.findOneAndDelete({ _id: id });

    return {
      message: "Patient deleted successfully",
    };
  },
};
