import { Redis } from "@upstash/redis";
import { timingSafeEqual } from "crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Performs a timing-safe string comparison to prevent timing attacks.
 * Returns false if either string is empty or undefined.
 */
function safeCompare(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security: Block this endpoint in production and preview environments
  // This endpoint allows data injection and should only be used for testing/debugging
  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    return res.status(404).json({ error: "Not found" });
  }

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 1. Check KV Connection
    if (
      !process.env.UPSTASH_REDIS_REST_URL ||
      !process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN"
      );
    }

    const kv = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const ping = await kv.ping();
    results.checks = {
      ...(results.checks as Record<string, unknown>),
      kv: { status: "ok", ping },
    };

    // 2. Check Queues (only counts, no sensitive data)
    const taskQueue = ((await kv.get("agent-task-queue")) as unknown[]) || [];
    const notificationQueue =
      ((await kv.get("notification-queue")) as unknown[]) || [];

    results.checks = {
      ...(results.checks as Record<string, unknown>),
      queues: {
        taskQueueLength: taskQueue.length,
        notificationQueueLength: notificationQueue.length,
      },
    };

    // 3. Check Monitored Lawyers (only count, no names for privacy)
    const lawyers = ((await kv.get("monitored-lawyers")) as unknown[]) || [];
    results.checks = {
      ...(results.checks as Record<string, unknown>),
      lawyers: {
        count: lawyers.length,
      },
    };

    // 4. Inject Test Data (Optional via ?inject=true) - only in non-production
    if (req.query.inject === "true") {
      // Inject Test Notification
      const testNotification = {
        id: crypto.randomUUID(),
        type: "system",
        title: "Teste de Sistema",
        message: "Esta é uma notificação de teste gerada manualmente.",
        createdAt: new Date().toISOString(),
        sent: false,
      };
      (notificationQueue as unknown[]).push(testNotification);
      await kv.set("notification-queue", notificationQueue);

      // Inject Test Task
      const testTask = {
        id: crypto.randomUUID(),
        agentId: "harvey",
        type: "system_test",
        status: "pending",
        priority: "medium",
        createdAt: new Date().toISOString(),
        data: { source: "manual_test" },
      };
      (taskQueue as unknown[]).push(testTask);
      await kv.set("agent-task-queue", taskQueue);

      results.injected = {
        notification: testNotification.id,
        task: testTask.id,
      };
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({
      error: "System check failed",
      details: error instanceof Error ? error.message : String(error),
      results,
    });
  }
}
