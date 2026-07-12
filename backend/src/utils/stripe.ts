import Stripe from "stripe";
import { env } from "../config/env";

let client: Stripe | null = null;

/** Lazily constructed so the app can still boot without Stripe configured (cash-only bookings still work). */
export function getStripe(): Stripe {
  if (!env.stripe.secretKey) {
    throw new Error("Stripe is not configured on this server (missing STRIPE_SECRET_KEY).");
  }
  if (!client) {
    client = new Stripe(env.stripe.secretKey);
  }
  return client;
}

/** PKR is not a Stripe zero-decimal currency, so amounts are sent in paisa (rupees * 100). */
export function toStripeAmount(rupees: number): number {
  return Math.round(rupees * 100);
}
