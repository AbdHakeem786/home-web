import { setupTestDB, teardownTestDB } from "./helpers/db";

// The real Stripe SDK verifies the `stripe-signature` header via HMAC, which needs a live
// webhook secret to construct. We only care that our handler reacts correctly to a given
// event shape, so swap in a fake `constructEvent` that just parses the raw body back to JSON -
// the signature header still has to be present as a string for the controller's own guard.
jest.mock("../src/utils/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (rawBody: Buffer) => JSON.parse(rawBody.toString()),
    },
  }),
  toStripeAmount: (rupees: number) => Math.round(rupees * 100),
}));

import request from "supertest";
import { createApp } from "../src/app";
import { Booking } from "../src/models/Booking";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { WorkerProfile } from "../src/models/WorkerProfile";

const app = createApp();

let phoneCounter = 0;

async function makeBooking(stripePaymentIntentId: string, paymentStatus: string) {
  const suffix = String(++phoneCounter).padStart(2, "0");
  const customer = await User.create({
    name: `Webhook Customer ${stripePaymentIntentId}`,
    phone: `+92000000070${suffix}`,
    passwordHash: "x",
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  const workerUser = await User.create({
    name: `Webhook Worker ${stripePaymentIntentId}`,
    phone: `+92000000080${suffix}`,
    passwordHash: "x",
    role: "worker",
    phoneVerified: true,
    active: true,
  });
  const category = await Category.create({ name: `Webhook Category ${stripePaymentIntentId}`, icon: "Wrench" });
  const worker = await WorkerProfile.create({ user: workerUser._id, category: category._id, priceFrom: 500 });
  const booking = await Booking.create({
    customer: customer._id,
    worker: worker._id,
    category: category._id,
    date: "2026-08-01",
    time: "10:00",
    address: "Test address",
    estimatedPrice: 1000,
    paymentMethod: "stripe",
    paymentStatus,
    stripePaymentIntentId,
  });
  return booking._id.toString();
}

beforeAll(setupTestDB);
afterAll(teardownTestDB);

describe("stripe webhook", () => {
  it("marks a booking paid on payment_intent.succeeded", async () => {
    const bookingId = await makeBooking("pi_succeed_1", "pending");

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "test-sig")
      .send({ type: "payment_intent.succeeded", data: { object: { id: "pi_succeed_1" } } });

    expect(res.status).toBe(200);
    const booking = await Booking.findById(bookingId);
    expect(booking!.paymentStatus).toBe("paid");
  });

  it("marks a booking failed on payment_intent.payment_failed", async () => {
    const bookingId = await makeBooking("pi_fail_1", "pending");

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "test-sig")
      .send({ type: "payment_intent.payment_failed", data: { object: { id: "pi_fail_1" } } });

    expect(res.status).toBe(200);
    const booking = await Booking.findById(bookingId);
    expect(booking!.paymentStatus).toBe("failed");
  });

  it("marks a booking refunded on charge.refunded and records the refunded amount", async () => {
    const bookingId = await makeBooking("pi_refund_1", "paid");

    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "test-sig")
      .send({
        type: "charge.refunded",
        data: { object: { payment_intent: "pi_refund_1", amount_refunded: 50000 } },
      });

    expect(res.status).toBe(200);
    const booking = await Booking.findById(bookingId);
    expect(booking!.paymentStatus).toBe("refunded");
    expect(booking!.refundAmount).toBe(500);
  });

  it("ignores unrelated event types without erroring", async () => {
    const res = await request(app)
      .post("/api/webhooks/stripe")
      .set("stripe-signature", "test-sig")
      .send({ type: "customer.created", data: { object: {} } });

    expect(res.status).toBe(200);
  });
});
