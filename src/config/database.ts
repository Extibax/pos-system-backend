import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log(`[DB] Connected to MongoDB: ${env.MONGO_URI}`);
  } catch (error) {
    console.error("[DB] Connection failed:", error);
    process.exit(1);
  }
}
