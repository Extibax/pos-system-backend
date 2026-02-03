import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/auth";
import { createInvoice, createInvoiceSchema, listInvoices, getInvoiceById } from "../services/invoice.service";
import { success, created, error } from "../utils/response";

const router = Router();

// All invoice routes require authentication
router.use(authenticate);

// POST /invoices — Create invoice and enqueue for processing
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      error(res, 400, parsed.error.errors.map((e) => e.message).join(", "));
      return;
    }

    const invoice = await createInvoice(req.auth!.tenant, parsed.data);
    created(res, invoice, "Invoice queued for processing");
  } catch (err: any) {
    error(res, 500, err.message);
  }
});

// GET /invoices — List with pagination and optional state filter
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const state = req.query.state as string | undefined;

    const result = await listInvoices(req.auth!.tenant, { page, limit, state });
    success(res, result);
  } catch (err: any) {
    error(res, 500, err.message);
  }
});

// GET /invoices/:id — Get single invoice
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await getInvoiceById(req.auth!.tenant, req.params.id as string);
    if (!invoice) {
      error(res, 404, "Invoice not found");
      return;
    }
    success(res, invoice);
  } catch (err: any) {
    error(res, 500, err.message);
  }
});

export default router;
