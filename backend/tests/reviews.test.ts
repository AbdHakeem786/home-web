import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { WorkerProfile } from "../src/models/WorkerProfile";
import { Booking } from "../src/models/Booking";

const app = createApp();

let customerToken: string;
let workerProfileId: string;
let completedBookingId: string;
let pendingBookingId: string;

beforeAll(async () => {
  await setupTestDB();

  const customer = await User.create({
    name: "Review Test Customer",
    phone: "+920000000040",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  const workerUser = await User.create({
    name: "Review Test Worker",
    phone: "+920000000041",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "worker",
    phoneVerified: true,
    active: true,
  });
  const category = await Category.create({ name: "Review Test Category", icon: "Wrench" });
  const workerProfile = await WorkerProfile.create({
    user: workerUser._id,
    category: category._id,
    priceFrom: 500,
  });
  workerProfileId = workerProfile._id.toString();

  const completedBooking = await Booking.create({
    customer: customer._id,
    worker: workerProfile._id,
    category: category._id,
    date: "2026-08-01",
    time: "10:00",
    address: "Test address",
    estimatedPrice: 1000,
    status: "completed",
  });
  completedBookingId = completedBooking._id.toString();

  const pendingBooking = await Booking.create({
    customer: customer._id,
    worker: workerProfile._id,
    category: category._id,
    date: "2026-08-02",
    time: "10:00",
    address: "Test address",
    estimatedPrice: 1000,
    status: "pending",
  });
  pendingBookingId = pendingBooking._id.toString();

  const login = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000040", password: "Pass@123" });
  customerToken = login.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe("reviews", () => {
  it("rejects a review for a booking that isn't completed", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: pendingBookingId, rating: 5, comment: "Great!" });
    expect(res.status).toBe(400);
  });

  it("lets the customer review a completed booking and updates the worker's rating", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: completedBookingId, rating: 4, comment: "Solid work" });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(4);

    const worker = await WorkerProfile.findById(workerProfileId);
    expect(worker!.rating).toBe(4);
    expect(worker!.reviewCount).toBe(1);

    const list = await request(app).get(`/api/reviews/worker/${workerProfileId}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  it("rejects a second review on the same booking", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ bookingId: completedBookingId, rating: 2, comment: "Again" });
    expect(res.status).toBe(409);
  });
});
