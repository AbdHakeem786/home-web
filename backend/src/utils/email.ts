import crypto from "crypto";
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.email.user || !env.email.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env.email.user, pass: env.email.pass },
    });
  }
  return transporter;
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * No real SMTP account is wired up until EMAIL_USER/EMAIL_PASS are set (see
 * backend/.env.example). Until then the link is logged so the flow can be
 * tested end to end; swap in a Gmail App Password (or any SMTP creds) when ready.
 */
export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${env.frontendUrl}/verify-email?token=${token}`;
  const t = getTransporter();

  if (!t) {
    if (env.nodeEnv !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[email] verification link for ${to}: ${link}`);
    }
    return;
  }

  await t.sendMail({
    from: env.email.from,
    to,
    subject: "Verify your RestMenu Home account",
    html: `<p>Hi ${name},</p><p>Click the link below to verify your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}
