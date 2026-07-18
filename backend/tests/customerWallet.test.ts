import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { WorkerProfile } from "../src/models/WorkerProfile";

const app = createApp();

let customerToken: string;
let customerId: string;
let workerId: string;
let categoryId: string;

beforeAll(async () => {
  await setupTestDB();

  const customer = await User.create({
    name: "Wallet Test Customer",
    phone: "+920000000040",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
    walletBalance: 300,
  });
  customerId = customer._id.toString();

  const workerUser = await User.create({
    name: "Wallet Booking Worker",
    phone: "+920000000041",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "worker",
    phoneVerified: true,
    active: true,
  });
  const category = await Category.create({ name: "Wallet Booking Category", icon: "Wrench" });
  categoryId = category._id.toString();
  const workerProfile = await WorkerProfile.create({
    user: workerUser._id,
    category: category._id,
    priceFrom: 500,
    verified: true,
  });
  workerId = workerProfile._id.toString();

  const login = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000040", password: "Pass@123" });
  customerToken = login.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

function bookingPayload(overrides: Record<string, unknown> = {}) {
  return {
    workerId,
    categoryId,
    date: "2026-09-01",
    time: "10:00",
    address: "Test address",
    description: "Fix the thing",
    estimatedPrice: 1000,
    paymentMethod: "cash",
    ...overrides,
  };
}

describe("customer wallet", () => {
  it("reports the starting balance via the summary endpoint", async () => {
    const res = await request(app)
      .get("/api/customer-wallet/summary")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe(300);
  });

  it("redeems wallet balance on a booking, capped to what's owed, and records a debit", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(bookingPayload({ walletAmount: 300 }));

    expect(res.status).toBe(201);
    expect(res.body.data.walletAmount).toBe(300);

    const summary = await request(app)
      .get("/api/customer-wallet/summary")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(summary.body.data.balance).toBe(0);

    const txns = await request(app)
      .get("/api/customer-wallet/transactions")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(txns.body.data[0]).toMatchObject({ type: "debit", amount: 300 });
  });

  it("rejects a booking that asks for more wallet credit than the balance", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(bookingPayload({ walletAmount: 50 }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient wallet balance/i);
  });

  it("refunds the wallet portion in full when the booking is cancelled", async () => {
    await User.findByIdAndUpdate(customerId, { walletBalance: 200 });

    const created = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(bookingPayload({ walletAmount: 150 }));
    expect(created.status).toBe(201);

    const afterBalance = await request(app)
      .get("/api/customer-wallet/summary")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(afterBalance.body.data.balance).toBe(50);

    const cancelled = await request(app)
      .patch(`/api/bookings/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "cancelled" });
    expect(cancelled.status).toBe(200);

    const refundedBalance = await request(app)
      .get("/api/customer-wallet/summary")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(refundedBalance.body.data.balance).toBe(200);

    const txns = await request(app)
      .get("/api/customer-wallet/transactions")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(txns.body.data[0]).toMatchObject({ type: "credit", amount: 150 });
  });
});

describe("admin wallet credit", () => {
  it("rejects non-admins", async () => {
    const res = await request(app)
      .post(`/api/admin/customers/${customerId}/wallet-credit`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ amount: 100 });
    expect(res.status).toBe(403);
  });
});
