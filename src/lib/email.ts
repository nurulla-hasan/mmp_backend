import nodemailer from 'nodemailer';
import { env } from '../config/index.js';

const isEmailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

export const sendVerificationEmail = async (email: string, otp: string): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'production') throw new Error('Email service is not configured');
    console.log(`Development verification code for ${email}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Mouza Map Pro email verification',
    text: `Your verification code is ${otp}. It expires in ${env.OTP_EXPIRES_IN_SECONDS} seconds.`,
    html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>It expires in ${env.OTP_EXPIRES_IN_SECONDS} seconds.</p>`,
  });
};
