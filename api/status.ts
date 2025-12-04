import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  generateHealthCheck,
  handleCronHealthRequest,
  handleSparkLoaded,
  handleWatchdogRequest,
} from "./lib/status-logic.js";

/**
 * Configura headers CORS
 */
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Status Endpoint
 * Combines Health Check and Spark Loaded functionality
 *
 * Access:
 * - /api/status?type=health (Health Check)
 * - /api/status?type=loaded (Spark Loaded)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  const type = req.query.type as string;

  // Spark Loaded Logic
  if (type === "loaded" || req.url?.includes("/loaded")) {
    if (handleSparkLoaded(req, res)) {
      return;
    }
  }

  // Watchdog last result (read-only)
  if (type === "watchdog") {
    await handleWatchdogRequest(req, res);
    return;
  }

  // Cron health (fila agentes + watchdog + próximos backups)
  if (type === "cron-health") {
    await handleCronHealthRequest(req, res);
    return;
  }

  // Health Check Logic (Default)
  generateHealthCheck(res);
}
