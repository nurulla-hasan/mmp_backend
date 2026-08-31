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
    subject: 'Mouza Map Pro Email Verification',
    text: `Your verification code is ${otp}. It expires in ${env.OTP_EXPIRES_IN_SECONDS} seconds.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 10px;">
        <h2 style="color: #16a34a; margin-top: 0;">Mouza Map Pro</h2>
        <p>Your email verification OTP code is:</p>
        <div style="background-color: #f0fdf4; border: 1px dashed #16a34a; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #15803d;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code will expire in ${Math.round(env.OTP_EXPIRES_IN_SECONDS / 60)} minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, otp: string): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'production') throw new Error('Email service is not configured');
    console.log(`Development password reset code for ${email}: ${otp}`);
    return;
  }

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Mouza Map Pro Password Reset Code',
    text: `Your password reset code is ${otp}. It expires in ${env.OTP_EXPIRES_IN_SECONDS} seconds.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 10px;">
        <h2 style="color: #16a34a; margin-top: 0;">Mouza Map Pro</h2>
        <p>You requested to reset your account password. Use the following 6-digit OTP code to complete the process:</p>
        <div style="background-color: #fefce8; border: 1px dashed #ca8a04; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #a16207;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code will expire in ${Math.round(env.OTP_EXPIRES_IN_SECONDS / 60)} minutes. If you did not make this request, please change your password or contact support immediately.</p>
      </div>
    `,
  });
};
