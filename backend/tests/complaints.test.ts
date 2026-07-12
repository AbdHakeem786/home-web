import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";

const app = createApp();

let customerAToken: string;
let customerBToken: string;
let adminToken: string;

beforeAll(async () => {
  await setupTestDB();

  await User.create({
    name: "Complaint Customer A",
    phone: "+920000000060",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  await User.create({
    name: "Complaint Customer B",
    phone: "+920000000061",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  await User.create({
    name: "Complaint Admin",
    phone: "+920000000062",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "admin",
    phoneVerified: true,
    active: true,
  });

  const loginA = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000060", password: "Pass@123" });
  customerAToken = loginA.body.data.accessToken;

  const loginB = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000061", password: "Pass@123" });
  customerBToken = loginB.body.data.accessToken;

  const loginAdmin = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000062", password: "Pass@123" });
  adminToken = loginAdmin.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe("complaints", () => {
  it("lets a user raise a complaint", async () => {
    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${customerAToken}`)
      .send({ subject: "Worker was late", description: "Waited over an hour past the booked slot." });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("open");
  });

  it("only shows a customer their own complaints under /mine", async () => {
    await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${customerBToken}`)
      .send({ subject: "Payment issue", description: "Card was charged twice for one booking." });

    const mine = await request(app)
      .get("/api/complaints/mine")
      .set("Authorization", `Bearer ${customerAToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].subject).toBe("Worker was late");
  });

  it("forbids a non-admin from listing all complaints", async () => {
    const res = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${customerAToken}`);
    expect(res.status).toBe(403);
  });

  it("lets an admin list and resolve complaints", async () => {
    const list = await request(app)
      .get("/api/complaints")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(2);

    const complaintId = list.body.data[0].id;
    const update = await request(app)
      .patch(`/api/complaints/${complaintId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "resolved", adminNote: "Refunded the customer." });
    expect(update.status).toBe(200);
    expect(update.body.data.status).toBe("resolved");
    expect(update.body.data.adminNote).toBe("Refunded the customer.");
  });
});
