import { loadStripe } from "@stripe/stripe-js";

const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || "";

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
