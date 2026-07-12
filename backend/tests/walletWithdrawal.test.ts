import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";
import { WorkerProfile } from "../src/models/WorkerProfile";

const app = createApp();

let workerToken: string;
let workerProfileId: string;

beforeAll(async () => {
  await setupTestDB();

  const workerUser = await User.create({
    name: "Wallet Test Worker",
    phone: "+920000000020",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "worker",
    phoneVerified: true,
    active: true,
  });
  const category = await Category.create({ name: "Wallet Test Category", icon: "Wrench" });
  const profile = await WorkerProfile.create({
    user: workerUser._id,
    category: category._id,
    priceFrom: 500,
    walletBalance: 100,
  });
  workerProfileId = profile._id.toString();

  const login = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000020", password: "Pass@123" });
  workerToken = login.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe("wallet withdrawal", () => {
  it("rejects a withdrawal that exceeds the balance", async () => {
    const res = await request(app)
      .post("/api/wallet/withdraw")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ amount: 999, method: "bank", accountDetails: "1234567890" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/exceeds wallet balance/i);
  });

  it("only allows one of two concurrent withdrawals to succeed when they'd overdraw the balance", async () => {
    const withdraw = () =>
      request(app)
        .post("/api/wallet/withdraw")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({ amount: 100, method: "bank", accountDetails: "1234567890" });

    const [res1, res2] = await Promise.all([withdraw(), withdraw()]);
    const statuses = [res1.status, res2.status].sort();

    // Exactly one request should succeed (200) and the other should be rejected (400) -
    // this is the atomic $gte/$inc guard from walletController.requestWithdrawal.
    expect(statuses).toEqual([200, 400]);

    const summary = await request(app)
      .get("/api/wallet/summary")
      .set("Authorization", `Bearer ${workerToken}`);
    expect(summary.body.data.balance).toBe(0);
  });
});
