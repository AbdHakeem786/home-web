import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";

const app = createApp();

beforeAll(async () => {
  await setupTestDB();
  await User.create({
    name: "Test Customer",
    phone: "+920000000001",
    passwordHash: await bcrypt.hash("Correct@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
});

afterAll(async () => {
  await teardownTestDB();
});

describe("login", () => {
  it("succeeds with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phone: "+920000000001", password: "Correct@123" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("rejects wrong password without revealing which field was wrong", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phone: "+920000000001", password: "WrongPassword" });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid phone number or password");
  });

  it("locks the account after 5 failed attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/auth/login")
        .send({ phone: "+920000000001", password: "WrongPassword" });
    }
    const res = await request(app)
      .post("/api/auth/login")
      .send({ phone: "+920000000001", password: "Correct@123" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/too many failed attempts/i);
  });
});
