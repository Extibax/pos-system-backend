import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { initWebSocket } from "./services/sync.service";
import invoiceRoutes from "./routes/invoice.routes";
import healthRoutes from "./routes/health.routes";

// Import worker to start processing
import "./queue/invoice.queue";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/invoices", invoiceRoutes);

// Start
async function bootstrap(): Promise<void> {
  await connectDatabase();
  initWebSocket();

  app.listen(env.PORT, () => {
    console.log(`[Server] API running on http://localhost:${env.PORT}`);
    console.log(`[Server] Health check: http://localhost:${env.PORT}/health`);
  });
}

bootstrap().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
