import mongoose, { Schema, Document } from "mongoose";

export interface ITenant extends Document {
  name: string;
  slug: string;
  settings: {
    currency: string;
    taxRate: number;
    timezone: string;
  };
  state: "ACTIVE" | "SUSPENDED";
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    settings: {
      currency: { type: String, default: "USD" },
      taxRate: { type: Number, default: 0.07 },
      timezone: { type: String, default: "America/Panama" },
    },
    state: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export const Tenant = mongoose.model<ITenant>("Tenant", tenantSchema);
