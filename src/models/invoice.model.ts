import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface IPayment {
  method: "CASH" | "CARD" | "TRANSFER" | "MIXED";
  amount: number;
  reference?: string;
}

export interface IInvoice extends Document {
  tenant: mongoose.Types.ObjectId;
  invoiceNo: number;
  cashier: string;
  items: IInvoiceItem[];
  payments: IPayment[];
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  totalAmount: number;
  state: "PENDING" | "QUEUED" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED";
  queuedAt?: Date;
  processedAt?: Date;
  retryCount: number;
  idempotencyKey: string;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0.07 },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    method: {
      type: String,
      enum: ["CASH", "CARD", "TRANSFER", "MIXED"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    reference: { type: String },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    invoiceNo: { type: Number, required: true },
    cashier: { type: String, required: true },
    items: { type: [invoiceItemSchema], required: true, default: [] },
    payments: { type: [paymentSchema], required: true, default: [] },
    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    state: {
      type: String,
      enum: ["PENDING", "QUEUED", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED"],
      default: "PENDING",
    },
    queuedAt: { type: Date },
    processedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenant: 1, invoiceNo: 1 }, { unique: true });
invoiceSchema.index({ state: 1 });
invoiceSchema.index({ idempotencyKey: 1 }, { unique: true });

export const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);
