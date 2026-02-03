import { z } from "zod";
import { Invoice, IInvoice } from "../models/invoice.model";
import { calculateItem, calculateTotals } from "../utils/invoice-calculator";
import { enqueueInvoice } from "../queue/invoice.queue";
import { randomUUID } from "crypto";

// Validation schemas
const itemSchema = z.object({
  product: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(1).optional(),
});

const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "TRANSFER", "MIXED"]),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  items: z.array(itemSchema).min(1),
  payments: z.array(paymentSchema).min(1),
  discount: z.number().nonnegative().default(0),
  cashier: z.string().min(1),
  idempotencyKey: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export async function createInvoice(tenantId: string, input: CreateInvoiceInput): Promise<IInvoice> {
  const idempotencyKey = input.idempotencyKey || randomUUID();

  // Idempotency check: if already exists, return it
  const existing = await Invoice.findOne({ idempotencyKey });
  if (existing) return existing;

  // Calculate items and totals
  const calculatedItems = input.items.map(calculateItem);
  const totals = calculateTotals(calculatedItems, input.discount);

  // Get next invoice number for this tenant
  const lastInvoice = await Invoice.findOne({ tenant: tenantId }).sort({ invoiceNo: -1 });
  const invoiceNo = (lastInvoice?.invoiceNo ?? 0) + 1;

  const invoice = await Invoice.create({
    tenant: tenantId,
    invoiceNo,
    cashier: input.cashier,
    items: calculatedItems,
    payments: input.payments,
    ...totals,
    state: "QUEUED",
    queuedAt: new Date(),
    idempotencyKey,
  });

  // Send to processing queue
  await enqueueInvoice(invoice._id.toString());

  return invoice;
}

export interface ListOptions {
  page: number;
  limit: number;
  state?: string;
}

export async function listInvoices(tenantId: string, options: ListOptions) {
  const { page, limit, state } = options;
  const filter: Record<string, unknown> = { tenant: tenantId };
  if (state) filter.state = state;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getInvoiceById(tenantId: string, invoiceId: string) {
  return Invoice.findOne({ _id: invoiceId, tenant: tenantId }).lean();
}
