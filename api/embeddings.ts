import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "./lib/auth";
import { withTimeout } from "./lib/timeout";

const BodySchema = z.object({ text: z.string().min(1) });

async function callOpenAIEmbedding(apiKey: string, text: string) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-large", input: text }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI embedding error: ${res.status} - ${txt}`);
  }

  const data = await res.json();
  return data.data?.[0]?.embedding;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Allow local development without API key if running in DEV
  if (process.env.NODE_ENV !== "development") {
    if (!requireApiKey(req, res, "EMBEDDINGS_API_KEY")) return;
  }

  const parsed = BodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.format() });
  }

  const text = parsed.data.text;

  try {
    // Prefer OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const emb = await withTimeout(30000, callOpenAIEmbedding(process.env.OPENAI_API_KEY, text));
      return res
        .status(200)
        .json({ embedding: emb, model: "text-embedding-3-large", dimensions: emb?.length });
    }

    // Fallback: GeminI - not implemented thoroughly here; require proper key
    if (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) {
      // Minimal fallback for Gemini: document that this should be implemented
      return res
        .status(500)
        .json({
          error:
            "Gemini embedding not configured. Use OPENAI_API_KEY for embeddings or implement Gemini endpoint.",
        });
    }

    return res
      .status(500)
      .json({ error: "No embedding provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY." });
  } catch (err) {
    console.error("Embeddings error:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
