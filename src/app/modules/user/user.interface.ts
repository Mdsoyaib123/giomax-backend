export type TUser = {
  fullName: string;
  profileImage?: string;
  email: string;
  password: string;
  comfirmPassword: string;
  role: "patient" | "doctor" | "solo_nurse" | " clinic" | "admin";
  dateOfBirth?: Date;
  age?: number;
  fcmToken?: string;
  isVerified?: boolean;
  isMobileVerified?: boolean;
  verificationCode?: string;
  verificationCodeForNumber?: string;
  isAdminVerified?: boolean;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
};
