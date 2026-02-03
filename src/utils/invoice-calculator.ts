import { IInvoiceItem } from "../models/invoice.model";

interface ItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  product?: string;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateItem(input: ItemInput): IInvoiceItem {
  const taxRate = input.taxRate ?? 0.07;
  const subtotal = round(input.quantity * input.unitPrice);
  const tax = round(subtotal * taxRate);
  const total = round(subtotal + tax);

  return {
    product: input.product as any,
    name: input.name,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    taxRate,
    subtotal,
    tax,
    total,
  };
}

export function calculateTotals(items: IInvoiceItem[], discount = 0) {
  const subtotal = round(items.reduce((sum, item) => sum + item.subtotal, 0));
  const totalTax = round(items.reduce((sum, item) => sum + item.tax, 0));
  const totalDiscount = round(discount);
  const totalAmount = round(subtotal + totalTax - totalDiscount);

  return { subtotal, totalTax, totalDiscount, totalAmount };
}
