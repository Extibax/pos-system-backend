import { WebSocketServer, WebSocket } from "ws";
import { env } from "../config/env";

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function initWebSocket(): void {
  wss = new WebSocketServer({ port: env.WS_PORT });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`[WS] Client connected (total: ${clients.size})`);

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (total: ${clients.size})`);
    });

    ws.on("error", (err) => {
      console.error("[WS] Client error:", err.message);
      clients.delete(ws);
    });
  });

  console.log(`[WS] WebSocket server running on port ${env.WS_PORT}`);
}

export function broadcastUpdate(event: string, data: unknown): void {
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
