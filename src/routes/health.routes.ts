import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { invoiceQueue } from "../queue/invoice.queue";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const queueCounts = await invoiceQueue.getJobCounts();

  res.json({
    status: dbState === 1 ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbState === 1 ? "connected" : "disconnected",
      queue: {
        waiting: queueCounts.waiting,
        active: queueCounts.active,
        completed: queueCounts.completed,
        failed: queueCounts.failed,
      },
    },
  });
});

export default router;
