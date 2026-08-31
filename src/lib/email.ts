import path from 'node:path';
import ejs from 'ejs';
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

export const sendVerificationEmail = async (
  email: string,
  otp: string,
  name: string = 'User',
): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'production') throw new Error('Email service is not configured');
    console.log(`Development verification code for ${email}: ${otp}`);
    return;
  }

  const templatePath = path.join(process.cwd(), 'src/templates/registration-otp.ejs');
  const expirationMinutes = Math.round(env.OTP_EXPIRES_IN_SECONDS / 60);

  const html = await ejs.renderFile(templatePath, {
    name,
    email,
    otp,
    expirationMinutes,
  });

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'ইমেইল ভেরিফিকেশন কোড - Mouza Map Pro',
    text: `আপনার ভেরিফিকেশন কোড: ${otp}। মেয়াদ: ${expirationMinutes} মিনিট।`,
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  name: string = 'User',
): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'production') throw new Error('Email service is not configured');
    console.log(`Development password reset code for ${email}: ${otp}`);
    return;
  }

  const templatePath = path.join(process.cwd(), 'src/templates/forgot-password-otp.ejs');
  const expirationMinutes = Math.round(env.OTP_EXPIRES_IN_SECONDS / 60);

  const html = await ejs.renderFile(templatePath, {
    name,
    email,
    otp,
    expirationMinutes,
  });

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'পাসওয়ার্ড রিসেট কোড - Mouza Map Pro',
    text: `আপনার পাসওয়ার্ড রিসেট কোড: ${otp}। মেয়াদ: ${expirationMinutes} মিনিট।`,
    html,
  });
};
