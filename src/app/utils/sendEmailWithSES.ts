import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const sesClient = new SESv2Client({
  region: process.env.SMTP_AWS_REGION,
});

// console.log("AWS KEY:", process.env.AWS_ACCESS_KEY_ID);
// console.log("AWS SECRET:", process.env.AWS_SECRET_ACCESS_KEY);

export const sendEmailWithSES = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  const transporter = nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  } as any);

  await transporter.sendMail({
    from: process.env.SES_FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });
};
