/**
 * Gemini API Client for API routes
 * Standalone version without src/ dependencies
 */

export interface GeminiResponse {
  text: string;
  error?: string;
}

export interface GeminiOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

/**
 * Call Gemini API from API routes
 */
export async function callGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      text: "",
      error: "Gemini API key not configured",
    };
  }

  const { temperature = 0.7, maxOutputTokens = 2048, model = "gemini-2.0-flash-exp" } = options;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        text: "",
        error: `Gemini API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return {
        text: "",
        error: "No response from Gemini",
      };
    }

    return {
      text: generatedText,
    };
  } catch (error) {
    return {
      text: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
