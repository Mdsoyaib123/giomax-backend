import { profile } from "console";
import { z } from "zod";

const create_user = z
  .object({
    fullName: z.string({ message: "Full name is required" }),
    profileImage: z.string().optional(),
    email: z.string({ message: "Email is required" }),
    password: z.string({ message: "Password is required" }),
    comfirmPassword: z.string({ message: "Comfirm Password is required" }),
    role: z.enum(["patient", "doctor", "solo_nurse", "clinic", "admin"], {
      message:
        "Role must be one of 'patient', 'solo_nurse', 'clinic', or 'admin'",
    }),
  })
  .refine((data) => data.password === data.comfirmPassword, {
    message: "Password and Confirm Password must match",
    path: ["comfirmPassword"],
  });

export const user_validations = {
  create_user,
};
