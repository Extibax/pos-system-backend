import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { Invoice } from "../models/invoice.model";
import { broadcastUpdate } from "../services/sync.service";

const connection = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

export const invoiceQueue = new Queue("invoice-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Worker: processes invoices from the queue
const worker = new Worker(
  "invoice-processing",
  async (job: Job) => {
    const { invoiceId } = job.data;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    // Update state to PROCESSING
    invoice.state = "PROCESSING";
    await invoice.save();

    // Simulate processing logic (fiscal validation, stock deduction, etc.)
    await processInvoice(invoice);

    // Mark as completed
    invoice.state = "COMPLETED";
    invoice.processedAt = new Date();
    await invoice.save();

    // Notify connected clients via WebSocket
    broadcastUpdate("invoice:completed", {
      invoiceId: invoice._id,
      invoiceNo: invoice.invoiceNo,
      state: invoice.state,
    });

    return { invoiceId, state: "COMPLETED" };
  },
  {
    connection,
    concurrency: 5,
  }
);

async function processInvoice(invoice: any): Promise<void> {
  // Production patterns:
  // 1. Validate fiscal compliance
  // 2. Deduct stock per item
  // 3. Generate fiscal sequence number
  // 4. Log transaction for audit
  // This is where real business logic goes
}

worker.on("completed", (job) => {
  console.log(`[Queue] Invoice ${job.data.invoiceId} processed`);
});

worker.on("failed", async (job, err) => {
  if (!job) return;
  console.error(`[Queue] Invoice ${job.data.invoiceId} failed: ${err.message}`);

  // Update invoice state on final failure
  if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
    await Invoice.findByIdAndUpdate(job.data.invoiceId, {
      state: "FAILED",
      retryCount: job.attemptsMade,
    });

    broadcastUpdate("invoice:failed", {
      invoiceId: job.data.invoiceId,
      error: err.message,
    });
  }
});

export async function enqueueInvoice(invoiceId: string): Promise<void> {
  await invoiceQueue.add("process", { invoiceId }, {
    jobId: `invoice-${invoiceId}`, // prevents duplicate processing
  });
}

export { worker };
