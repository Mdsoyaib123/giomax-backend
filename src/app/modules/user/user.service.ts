
import { TUser } from "./user.interface";
import { User_Model } from "./user.schema";
import bcrypt from "bcrypt";
import { Patient_Model } from "../patient/patient.model";
import mongoose from "mongoose";
import { SoloNurse_Model } from "../soloNurse/soloNurse.model";
import { Clinic_Model } from "../clinic/clinic.model";
import crypto from "crypto";
import { Doctor_Model } from "../doctor/doctor.model";
import { sendEmail } from "../../utils/sendEmail";
import { sendEmailWithSES } from "../../utils/sendEmailWithSES";
import { sendSMS } from "../../utils/sendSMS";

const generateRandomCodeForPatient = () => {
  return Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join("");
};

const generateRandomCodeForPatientForNumber = () => {
  return Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join("");
};

const generateRandomCodeForSoloNurse = () => {
  return Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join("");
};

const generateRandomCodeForClinic = () => {
  return Array.from({ length: 6 }, () => crypto.randomInt(0, 10)).join("");
};

const generateRandomPassword = () => {
  return Array.from({ length: 8 }, () => crypto.randomInt(0, 10)).join("");
};

export const createPatient = async (
  payload: any,
  nidFront: any,
  nidBack: any,
) => {
  console.log("paylaod", payload, nidFront, nidBack);
  const session = await mongoose.startSession();
  session.startTransaction();

  const verificationCode = generateRandomCodeForPatient();
  const verificationCodeForNumber = generateRandomCodeForPatientForNumber();
  // console.log("from service", payload);
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

    // If birthday has not occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    // Optional: validate minimum age
    if (age < 0) {
      throw new Error("Invalid age calculated");
    }

    payload.age = age; // store or use age
  }

  try {
    // 1. Check if email already exists
    const existingEmail = await User_Model.findOne(
      { email: payload.email },

      null,
      { session },
    );

    if (existingEmail && existingEmail.isVerified === true) {
      throw new Error("The provided email is already registered.");
    }

    if (existingEmail && existingEmail.isVerified === false) {
      await Patient_Model.deleteOne({ userId: existingEmail._id }, { session });
      await User_Model.deleteOne({ email: payload.email }, { session });
    }

    // Extract
    const { fullName,surname, email, password, comfirmPassword, ...patientPayload } =
      payload;

    // 2. Check password === confirm password
    if (password !== comfirmPassword) {
      throw new Error("Password and confirm password do not match.");
    }

    // 3. Hash Password
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);
    if (isNaN(saltRounds)) {
      throw new Error(
        "Invalid bcrypt salt round value in environment variable.",
      );
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Prepare user data
    const newUserData = {
      fullName,
      surname,
      email,
      password: hashedPassword,
      comfirmPassword: hashedPassword,
      role: "patient",
      verificationCode,
      verificationCodeForNumber,
    };

    const address = {
      addressLabel: payload.addressLabel,
      streetNumber: payload.streetNumber,
      apartmentNumber: payload.apartmentNumber,
      city: payload.city,
      state: payload.state,
      zipCode: payload.zipCode,
    };

    patientPayload.address = address;

    // 5. Create User with session
    const newUser = await User_Model.create([newUserData], { session });
    const createdUser = newUser[0];
    console.log("new user", createdUser);

    // 6. Create Patient using new userId
    const newPatient = await Patient_Model.create(
      [
        {
          ...patientPayload,
          nidFrontImageUrl: nidFront,
          nidBackImageUrl: nidBack,
          age: payload.age,
          userId: createdUser._id,
        },
      ],
      { session },
    );

    // 7. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    await sendEmail({
      to: email,
      subject: "Your Patient Account Verification Code",
      html: `
        <h2>Welcome, ${fullName}</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Verification Code:</strong> ${verificationCode}</p>
        <p>Please use this code to verify your account.</p>
      `,
    });

    // await sendEmailWithSES({
    //   to: email,
    //   subject: "Your Patient Account Verification Code",
    //   html: `
    //     <h2>Welcome, ${fullName}</h2>
    //     <p>Your account has been created successfully.</p>
    //     <p><strong>Verification Code:</strong> ${verificationCode}</p>
    //     <p>Please use this code to verify your account.</p>
    //   `,
    // });

    try {
      const result = await sendSMS({
        phone: payload.phoneNumber,
        message: `Your account verification code is: ${verificationCodeForNumber}`,
      });

      console.log(result);
    } catch (err: any) {
      console.error("SMS failed:", err);
    }

    return newPatient[0];
  } catch (error) {
    // ❌ If anything fails → rollback all operations
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const createSoloNurse = async (payload: any) => {
  // console.log("solo nurse datra ", payload);
  const session = await mongoose.startSession();
  session.startTransaction();

  const verificationCode = generateRandomCodeForSoloNurse();
  console.log("nurse code ", verificationCode);
  try {
    const { fullName, email, password, comfirmPassword, ...nursePayload } =
      payload;

    // Check email
    const existingEmail = await User_Model.findOne({ email }, null, {
      session,
    });

    if (existingEmail && existingEmail.isVerified === false) {
      await SoloNurse_Model.deleteOne(
        { userId: existingEmail._id },
        { session },
      );
      await User_Model.deleteOne({ email: payload.email }, { session });
    }

    if (existingEmail && existingEmail.isVerified === true) {
      throw new Error("Email already exists.");
    }

    // Validate passwords
    if (password !== comfirmPassword) {
      throw new Error("Password and confirm password do not match.");
    }

    // Hash password
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);
    const hashedPass = await bcrypt.hash(password, saltRounds);

    const newUser = await User_Model.create(
      [
        {
          fullName,
          email,
          password: hashedPass,
          comfirmPassword: hashedPass,
          role: "solo_nurse",
          verificationCode,
        },
      ],
      { session },
    );

    const createdNurse = await SoloNurse_Model.create(
      [{ ...nursePayload, availability: [], userId: newUser[0]._id }],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    await sendEmail({
      to: email,
      subject: "Your Solo Nurse Account Verification Code",
      html: `
        <h2>Welcome, ${fullName}</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Verification Code:</strong> ${verificationCode}</p>
        <p>Please use this code to verify your account.</p>
      `,
    });

    return createdNurse[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const createClinic = async (payload: any) => {
  // console.log('from service',payload);
  const session = await mongoose.startSession();
  session.startTransaction();

  const verificationCode = generateRandomCodeForClinic();

  try {
    const { fullName, email, password, comfirmPassword, ...clinicpayload } =
      payload;

    if (payload.IBanNumber) {
      clinicpayload.paymentAndEarnings = {
        withdrawalMethods: {
          IBanNumber: payload.IBanNumber,
        },
      };
    }

    // Check email
    const existingEmail = await User_Model.findOne({ email }, null, {
      session,
    });

    if (existingEmail && existingEmail.isVerified === false) {
      await Clinic_Model.deleteOne({ userId: existingEmail._id }, { session });
      await User_Model.deleteOne({ email: payload.email }, { session });
    }

    if (existingEmail && existingEmail.isVerified === true) {
      throw new Error("Email already exists.");
    }

    // Validate passwords
    if (password !== comfirmPassword) {
      throw new Error("Password and confirm password do not match.");
    }

    // Hash password
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);
    const hashedPass = await bcrypt.hash(password, saltRounds);

    const newUser = await User_Model.create(
      [
        {
          fullName,
          email,
          password: hashedPass,
          comfirmPassword: hashedPass,
          role: "clinic",
          verificationCode,
        },
      ],
      { session },
    );

    const createClinic = await Clinic_Model.create(
      [{ ...clinicpayload, userId: newUser[0]._id }],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    await sendEmail({
      to: email,
      subject: "Your Clinic Account Verification Code",
      html: `
        <h2>Welcome, ${fullName}</h2>
        <p>Your account has been created successfully.</p>
        <p><strong>Verification Code:</strong> ${verificationCode}</p>
        <p>Please use this code to verify your account.</p>
      `,
    });

    return createClinic[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
const createDoctor = async (payload: any) => {
  console.log("payload", payload);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      clinicId,
      doctorName,
      email,
      availability,
      availableDateRange,
      slotTimeDuration,

      ...doctorPayload
    } = payload;
    let parsedAvailability: any[] = [];

    if (payload.availability) {
      // Case 1: availability is an array
      if (Array.isArray(payload.availability)) {
        parsedAvailability = payload.availability.map((item: any) =>
          typeof item === "string" ? JSON.parse(item) : item,
        );
      } else if (typeof payload.availability === "string") {
        console.log("hit hit hist");
        parsedAvailability = JSON.parse(payload.availability);
      }
    }

    const days = parsedAvailability.map((a) => a?.day?.toLowerCase());
    const duplicateDays = days.filter(
      (day, index) => days.indexOf(day) !== index,
    );

    if (duplicateDays.length > 0) {
      throw new Error(
        `Duplicate availability day found: ${[...new Set(duplicateDays)].join(
          ", ",
        )}`,
      );
    }

    console.log("availbility data", parsedAvailability);

    let parsedAvailableDateRange: any | undefined;

    if (availableDateRange !== undefined) {
      let rangeObj: any;

      // 🟢 Case 1: FormData → string
      if (typeof availableDateRange === "string") {
        rangeObj = JSON.parse(availableDateRange);
      }
      // 🟢 Case 2: JSON body → object
      else {
        rangeObj = availableDateRange;
      }

      parsedAvailableDateRange = {
        startDate: rangeObj.startDate
          ? new Date(rangeObj.startDate)
          : undefined,

        endDate: rangeObj.endDate ? new Date(rangeObj.endDate) : undefined,

        isEnabled: rangeObj.isEnabled ?? false,
      };
    }

    // 1️⃣ Check if email already exists
    const existingUser = await User_Model.findOne({ email }).session(session);
    if (existingUser) {
      throw new Error("Email already exists.");
    }

    // 2️⃣ Generate & hash password
    const password = generateRandomPassword();
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUND);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3️⃣ Create user
    const [newUser] = await User_Model.create(
      [
        {
          fullName: doctorName,
          email,
          password: hashedPassword,
          comfirmPassword: hashedPassword,
          role: "doctor",
        },
      ],
      { session },
    );

    // 4️⃣ Create doctor profile
    const [newDoctor] = await Doctor_Model.create(
      [
        {
          ...doctorPayload,
          userId: newUser._id,
          clinicId,
          availability: parsedAvailability || [],
          availableDateRange: parsedAvailableDateRange, // 👈 ADD HERE
          slotTimeDuration,
        },
      ],
      { session },
    );

    // 5️⃣ Send login credentials email
    await sendEmail({
      to: email,
      subject: "Your Doctor Account Login Credentials",
      html: `
        <h2>Welcome, Dr. ${doctorName}</h2>
        <p>Your doctor account has been created successfully.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Please login and change your password immediately.</p>
      `,
    });

    await session.commitTransaction();
    session.endSession();

    return newDoctor;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getAdmin = async () => {
  const admin = await User_Model.findOne({ role: "admin" });
  return admin;
};

const verifyUser = async (
  userId: string,
  code?: string,
  codeForNumber?: string,
) => {
  console.log("data", userId, code, codeForNumber);

  const user = await User_Model.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }


  // Verify Email Code
  if (code) {
    if (user.verificationCode !== code) {
      throw new Error("Invalid verification code");
    }

    user.isVerified = true;
    user.verificationCode = undefined; // Clear after success
  }

  // Verify Mobile Code (optional)
  if (codeForNumber) {
    if (user.verificationCodeForNumber !== codeForNumber) {
      throw new Error("Invalid verification code for number");
    }

    user.isMobileVerified = true;
    user.verificationCodeForNumber = undefined; // Clear after success
  }

  await user.save();

  // Send email only when email verification is successful
  if (code && user.role !== "patient") {
    await sendEmail({
      to: user.email,
      subject: "Your Account Has Been Verified, Now wait for admin approval",
      html: `
        <h2>Hello, ${user.fullName}</h2>
        <p>Your account has been verified successfully.</p>
        <p>Please wait for admin approval to access all features.</p>
      `,
    });
  }

  return user;
};
const addAdminApproval = async (userId: string) => {
  const user = await User_Model.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.isAdminVerified = true;
  await user.save();
  return user;
};

export const UserService = {
  createPatient,
  createSoloNurse,
  createClinic,
  createDoctor,
  getAdmin,
  verifyUser,
  addAdminApproval,
};
