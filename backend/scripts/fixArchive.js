import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Habit from "../models/Habit.js";

const run = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  // Show current state
  const allHabits = await db.collection("habits").find({}).toArray();
  console.log(`\nTotal habits in DB: ${allHabits.length}`);
  for (const h of allHabits) {
    console.log(
      `  ${h.name}: isArchived=${JSON.stringify(h.isArchived)} (${typeof h.isArchived})`,
    );
  }

  // Fix string "false" -> boolean false, string "true" -> boolean true
  const stringFalse = await db.collection("habits").updateMany(
    { isArchived: "false" },
    { $set: { isArchived: false } },
  );
  const stringTrue = await db.collection("habits").updateMany(
    { isArchived: "true" },
    { $set: { isArchived: true } },
  );
  console.log(
    `\nMigrated ${stringFalse.modifiedCount + stringTrue.modifiedCount} habits to boolean isArchived`,
  );

  // Verify
  const after = await db.collection("habits").find({}).toArray();
  console.log(`\nAfter migration:`);
  for (const h of after) {
    console.log(
      `  ${h.name}: isArchived=${JSON.stringify(h.isArchived)} (${typeof h.isArchived})`,
    );
  }

  await mongoose.disconnect();
  console.log("\nDone.");
};

run().catch(async (err) => {
  console.error("Migration failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});