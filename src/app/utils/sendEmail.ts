// import nodemailer from "nodemailer";

// export const sendEmail = async ({
//   to,
//   subject,
//   text,
//   html,
// }: {
//   to: string;
//   subject: string;
//   text?: string;
//   html?: string;
// }) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject,
//     text,
//     html,
//   });
// };


import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailPayload) => {
  if (!html && !text) {
    throw new Error("Either html or text is required.");
  }

  const emailPayload: CreateEmailOptions = {
    from: process.env.EMAIL_FROM || "MedConnect <noreply@medconnect.com.ge>",
    to,
    subject,
    ...(html ? { html } : { text: text! }),
  };

  const { data, error } = await resend.emails.send(emailPayload);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};