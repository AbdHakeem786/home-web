import { setupTestDB, teardownTestDB } from "./helpers/db";

let mockPayload: Record<string, unknown> | null = null;
const verifyIdToken = jest.fn().mockImplementation(async () => ({
  getPayload: () => mockPayload,
}));
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken })),
}));

import request from "supertest";
import { createApp } from "../src/app";
import { User } from "../src/models/User";

const app = createApp();

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

function setGooglePayload(email: string, sub: string, overrides: Record<string, unknown> = {}) {
  mockPayload = {
    email,
    email_verified: true,
    sub,
    name: "Google Test User",
    picture: "https://example.com/pic.jpg",
    ...overrides,
  };
}

describe("google sign-in role handling", () => {
  it("creates a new account with the requested role", async () => {
    setGooglePayload("new-worker@example.com", "google-sub-1");
    const res = await request(app).post("/api/auth/google").send({ idToken: "fake-google-id-token-1234567890", role: "worker" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("worker");
  });

  it("defaults a new account to customer when no role is requested", async () => {
    setGooglePayload("new-customer@example.com", "google-sub-2");
    const res = await request(app).post("/api/auth/google").send({ idToken: "fake-google-id-token-1234567890" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("customer");
  });

  it("rejects signing up as customer when the Google account is already a worker", async () => {
    setGooglePayload("existing-worker@example.com", "google-sub-3");
    // First call registers the account as a worker.
    await request(app).post("/api/auth/google").send({ idToken: "fake-google-id-token-1234567890", role: "worker" });

    // Signing up again as "customer" with the same Google account must not silently
    // log into the existing worker account - this was the reported bug.
    const res = await request(app).post("/api/auth/google").send({ idToken: "fake-google-id-token-1234567890", role: "customer" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered as a worker/i);

    const user = await User.findOne({ email: "existing-worker@example.com" });
    expect(user?.role).toBe("worker");
  });

  it("allows plain login (no requested role) into an existing account regardless of its role", async () => {
    setGooglePayload("login-worker@example.com", "google-sub-4");
    await request(app).post("/api/auth/google").send({ idToken: "fake-google-id-token-1234567890", role: "worker" });

    const res = await request(app).post("/api/auth/google").send({ idToken: "fake-google-id-token-1234567890" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe("worker");
  });
});
