/**
 * LLM Service for API routes
 * Standalone version without src/ dependencies
 */

export interface LLMExecuteOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  feature?: string;
}

/**
 * Execute LLM prompt (currently uses Gemini)
 */
export async function execute(prompt: string, options: LLMExecuteOptions = {}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("LLM API key not configured");
  }

  const { temperature = 0.7, maxTokens = 2048, model = "gemini-2.0-flash-exp" } = options;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!generatedText) {
    throw new Error("No response from LLM");
  }

  return generatedText;
}

export const llmService = {
  execute,
};
