import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";

const app = createApp();

let customerToken: string;

beforeAll(async () => {
  await setupTestDB();

  await User.create({
    name: "Role Guard Customer",
    phone: "+920000000030",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });

  const login = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000030", password: "Pass@123" });
  customerToken = login.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe("role guards", () => {
  it("forbids a customer from hitting a worker-only endpoint", async () => {
    const res = await request(app)
      .get("/api/workers/me")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/requires role: worker/i);
  });

  it("rejects requests with no auth token at all", async () => {
    const res = await request(app).get("/api/workers/me");
    expect(res.status).toBe(401);
  });
});
