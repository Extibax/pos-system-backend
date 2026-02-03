import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  tenant: mongoose.Types.ObjectId;
  name: string;
  sku: string;
  price: number;
  taxRate: number;
  category: string;
  stock: number;
  state: "ACTIVE" | "INACTIVE";
}

const productSchema = new Schema<IProduct>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0.07 },
    category: { type: String, default: "general" },
    stock: { type: Number, default: 0 },
    state: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

productSchema.index({ tenant: 1, sku: 1 }, { unique: true });

export const Product = mongoose.model<IProduct>("Product", productSchema);
