/* eslint-disable no-console */
import { connectDB, disconnectDB } from "../config/db";
import { WorkerProfile } from "../models/WorkerProfile";
import { WalletTransaction } from "../models/WalletTransaction";

async function backfill() {
  await connectDB();

  const profiles = await WorkerProfile.find({});
  console.log(`Backfilling walletBalance for ${profiles.length} worker profile(s)...`);

  for (const profile of profiles) {
    const [credits, debits] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { worker: profile._id, type: "credit" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { worker: profile._id, type: "debit" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);
    const balance = (credits[0]?.total ?? 0) - (debits[0]?.total ?? 0);
    profile.walletBalance = balance;
    await profile.save();
    console.log(`  ${profile._id.toString()} -> walletBalance = ${balance}`);
  }

  console.log("Backfill complete.");
  await disconnectDB();
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
