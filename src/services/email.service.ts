import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, code: string) => {
  await resend.emails.send({
    from: 'Expense Tracker <onboarding@resend.dev>',
    to: email,
    subject: 'Verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #4F46E5;">${code}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

export const sendTwoFactorEmail = async (email: string, code: string) => {
  await resend.emails.send({
    from: 'Expense Tracker <onboarding@resend.dev>',
    to: email,
    subject: 'Your login verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>Two Factor Authentication</h2>
        <p>Your login verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #4F46E5;">${code}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't try to login, secure your account immediately.</p>
      </div>
    `,
  });
};