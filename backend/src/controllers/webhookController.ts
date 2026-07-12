import { Request, Response } from "express";
import Stripe from "stripe";
import { Booking } from "../models/Booking";
import { env } from "../config/env";
import { getStripe } from "../utils/stripe";

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers["stripe-signature"];
  if (!env.stripe.webhookSecret || typeof signature !== "string") {
    res.status(400).send("Stripe webhook not configured");
    return;
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
    return;
  }

  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await Booking.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { paymentStatus: event.type === "payment_intent.succeeded" ? "paid" : "failed" }
    );
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (intentId) {
      // Only backfill paymentStatus here - refunds triggered from our own cancellation flow
      // already set the precise cancellationFee/refundAmount split on the booking directly.
      await Booking.findOneAndUpdate(
        { stripePaymentIntentId: intentId, paymentStatus: { $ne: "refunded" } },
        { paymentStatus: "refunded", refundAmount: charge.amount_refunded / 100 }
      );
    }
  }

  res.status(200).json({ received: true });
}
