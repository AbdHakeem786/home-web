/* eslint-disable no-console */
import { connectDB, disconnectDB } from "../config/db";
import { Category } from "../models/Category";

const categories = [
  { name: "Plumbing", icon: "Wrench" },
  { name: "Electrician", icon: "Zap" },
  { name: "Carpenter", icon: "Hammer" },
  { name: "Cleaner", icon: "Sparkles" },
  { name: "Painter", icon: "PaintRoller" },
  { name: "AC Repair", icon: "Snowflake" },
  { name: "Mason", icon: "Bricks" },
  { name: "Gardener", icon: "Flower2" },
  { name: "Handyman", icon: "Settings2" },
  { name: "Water Tank Cleaning", icon: "Droplets" },
  { name: "CCTV Installer", icon: "Camera" },
  { name: "Internet Technician", icon: "Wifi" },
];

async function seed() {
  await connectDB();

  console.log("Seeding categories...");
  for (const c of categories) {
    await Category.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true });
  }

  console.log("Seed complete.");
  await disconnectDB();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
