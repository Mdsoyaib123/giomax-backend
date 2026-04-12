export type TAccount = {
  email: string;
  password: string;
  role: "patient" | "doctor" | "solo_nurse" | " clinic" | "admin";
};

export interface TRegisterPayload extends TAccount {
  name: string;
}

export type TLoginPayload = {
  email: string;
  password: string;
  role: "patient" | "doctor" | "solo_nurse" | " clinic" | "admin";
  fcmToken: string;
  latitude?: number;
  longitude?: number;
};

export type TJwtUser = {
  email: string;
  role?: "patient" | "doctor" | "solo_nurse" | " clinic" | "admin";
};

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface IResetPasswordRequest {
  token: string;
  password: string;
}