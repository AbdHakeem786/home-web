import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { WorkerProfile } from "../src/models/WorkerProfile";
import { Booking } from "../src/models/Booking";

const app = createApp();

let customerAToken: string;
let customerBToken: string;
let bookingId: string;

beforeAll(async () => {
  await setupTestDB();

  const customerA = await User.create({
    name: "Customer A",
    phone: "+920000000010",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  const customerB = await User.create({
    name: "Customer B",
    phone: "+920000000011",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  const workerUser = await User.create({
    name: "Test Worker",
    phone: "+920000000012",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "worker",
    phoneVerified: true,
    active: true,
  });
  const category = await Category.create({ name: "Test Category", icon: "Wrench" });
  const workerProfile = await WorkerProfile.create({
    user: workerUser._id,
    category: category._id,
    priceFrom: 500,
  });
  const booking = await Booking.create({
    customer: customerA._id,
    worker: workerProfile._id,
    category: category._id,
    date: "2026-08-01",
    time: "10:00",
    address: "Test address",
    estimatedPrice: 500,
  });
  bookingId = booking._id.toString();

  const loginA = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000010", password: "Pass@123" });
  customerAToken = loginA.body.data.accessToken;

  const loginB = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000011", password: "Pass@123" });
  customerBToken = loginB.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe("booking access control (IDOR)", () => {
  it("allows the owning customer to view their booking", async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${customerAToken}`);
    expect(res.status).toBe(200);
  });

  it("forbids a different customer from viewing someone else's booking", async () => {
    const res = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${customerBToken}`);
    expect(res.status).toBe(403);
  });
});
