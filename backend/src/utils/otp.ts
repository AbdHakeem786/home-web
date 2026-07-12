import crypto from "crypto";
import { env } from "../config/env";

/** Generates a 6-digit numeric OTP string. */
export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + env.otpExpiresMin * 60 * 1000);
}

/**
 * No real SMS/email provider is wired up yet (see frontend README — OTP is
 * mocked). In development we log the code so it can be tested end to end;
 * swap this out for Twilio/SMS gateway integration when ready.
 */
export function deliverOtp(phone: string, code: string): void {
  if (env.nodeEnv !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[otp] code for ${phone}: ${code}`);
  }
  // TODO: integrate real SMS provider here.
}
