import { setupTestDB, teardownTestDB } from "./helpers/db";

import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Category } from "../src/models/Category";

const app = createApp();

let adminToken: string;
let customerToken: string;

beforeAll(async () => {
  await setupTestDB();

  await User.create({
    name: "Category Test Admin",
    phone: "+920000000050",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "admin",
    phoneVerified: true,
    active: true,
  });
  await User.create({
    name: "Category Test Customer",
    phone: "+920000000051",
    passwordHash: await bcrypt.hash("Pass@123", 10),
    role: "customer",
    phoneVerified: true,
    active: true,
  });
  await Category.create({ name: "Already Inactive", icon: "Wrench", active: false });
  await Category.create({ name: "Already Active", icon: "Wrench", active: true });

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000050", password: "Pass@123" });
  adminToken = adminLogin.body.data.accessToken;

  const customerLogin = await request(app)
    .post("/api/auth/login")
    .send({ phone: "+920000000051", password: "Pass@123" });
  customerToken = customerLogin.body.data.accessToken;
});

afterAll(async () => {
  await teardownTestDB();
});

describe("categories", () => {
  it("only lists active categories by default", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.data.every((c: { active: boolean }) => c.active)).toBe(true);
    expect(res.body.data.some((c: { name: string }) => c.name === "Already Inactive")).toBe(false);
  });

  it("forbids a non-admin from creating a category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Plumbing", icon: "Wrench" });
    expect(res.status).toBe(403);
  });

  it("lets an admin create a category", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Plumbing", icon: "Wrench" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Plumbing");
  });

  it("rejects creating a category with a duplicate name", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Plumbing", icon: "Wrench" });
    expect(res.status).toBe(409);
  });

  it("lets an admin deactivate a category, which then drops out of the default listing", async () => {
    const created = await Category.findOne({ name: "Plumbing" });
    const del = await request(app)
      .delete(`/api/categories/${created!._id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    const list = await request(app).get("/api/categories");
    expect(list.body.data.some((c: { name: string }) => c.name === "Plumbing")).toBe(false);

    const listAll = await request(app).get("/api/categories?all=true");
    expect(listAll.body.data.some((c: { name: string }) => c.name === "Plumbing")).toBe(true);
  });
});
