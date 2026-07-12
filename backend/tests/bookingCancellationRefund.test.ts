import { setupTestDB, teardownTestDB } from "./helpers/db";

const refundsCreate = jest.fn().mockResolvedValue({ id: "re_test" });
jest.mock("../src/utils/stripe", () => ({
  getStripe: () => ({ refunds: { create: refundsCreate } }),
  toStripeAmount: (rupees: number) => Math.round(rupees * 100),
}));

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { WorkerProfile } from "../src/models/WorkerProfile";
import { Booking } from "../src/models/Booking";

const app = createApp();

let customerToken: string;
let workerId: string;

beforeAll(async () => {
  await setupTestDB();

  const customer = await User.create({
    name: "Refund Test Customer",
    phone: "+920000000030",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  const workerUser = await User.create({
    name: "Refund Test Worker",
    phone: "+920000000031",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "worker",
    phoneVerified: true,
    active: true,
  });
  const category = await Category.create({ name: "Refund Test Category", icon: "Wrench" });
  const workerProfile = await WorkerProfile.create({
    user: workerUser._id,
    category: category._id,
    priceFrom: 500,
  });
  workerId = workerProfile._id.toString();

  const login = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000030", password: "Pass@123" });
  customerToken = login.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

async function makeBooking(overrides: Partial<{ status: string; paymentMethod: string; paymentStatus: string; stripePaymentIntentId: string }>) {
  const booking = await Booking.create({
    customer: (await User.findOne({ phone: "+920000000030" }))!._id,
    worker: workerId,
    category: (await Category.findOne({ name: "Refund Test Category" }))!._id,
    date: "2026-08-01",
    time: "10:00",
    address: "Test address",
    estimatedPrice: 1000,
    status: overrides.status ?? "pending",
    paymentMethod: overrides.paymentMethod ?? "stripe",
    paymentStatus: overrides.paymentStatus ?? "paid",
    stripePaymentIntentId: overrides.stripePaymentIntentId ?? "pi_test",
  });
  return booking._id.toString();
}

describe("booking cancellation refunds", () => {
  beforeEach(() => refundsCreate.mockClear());

  it("refunds in full with no fee when cancelled before the worker is en route", async () => {
    const id = await makeBooking({ status: "pending" });
    const res = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "cancelled" });

    expect(res.status).toBe(200);
    expect(res.body.data.cancellationFee).toBe(0);
    expect(res.body.data.refundAmount).toBe(1000);
    expect(res.body.data.paymentStatus).toBe("refunded");
    expect(refundsCreate).toHaveBeenCalledWith({ payment_intent: "pi_test", amount: 100000 });
  });

  it("withholds a cancellation fee when the customer cancels after the worker is on the way", async () => {
    const id = await makeBooking({ status: "on_the_way" });
    const res = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "cancelled" });

    expect(res.status).toBe(200);
    expect(res.body.data.cancellationFee).toBe(200);
    expect(res.body.data.refundAmount).toBe(800);
    expect(res.body.data.paymentStatus).toBe("refunded");
    expect(refundsCreate).toHaveBeenCalledWith({ payment_intent: "pi_test", amount: 80000 });
  });

  it("does not touch Stripe or payment fields for cash bookings", async () => {
    const id = await makeBooking({ status: "on_the_way", paymentMethod: "cash", paymentStatus: "pending", stripePaymentIntentId: undefined });
    const res = await request(app)
      .patch(`/api/bookings/${id}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "cancelled" });

    expect(res.status).toBe(200);
    expect(res.body.data.cancellationFee).toBeUndefined();
    expect(res.body.data.paymentStatus).toBe("pending");
    expect(refundsCreate).not.toHaveBeenCalled();
  });
});
