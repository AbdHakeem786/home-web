import path from "path";
import dotenv from "dotenv";

// Load the real .env first so JWT secrets etc are available, then redirect
// MONGO_URI to a "_test" database on the same cluster so tests never touch
// real/dev data. This file must be the first import in every test file.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const baseUri = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/restmenu_home";
const [beforeQuery, query] = baseUri.split("?");
process.env.MONGO_URI = query ? `${beforeQuery}_test?${query}` : `${beforeQuery}_test`;
process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../../src/config/db";

export async function setupTestDB(): Promise<void> {
  await connectDB();
}

export async function teardownTestDB(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await disconnectDB();
}
