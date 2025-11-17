/*
 * Wraps window.spark.kv methods to add robust JSON detection and improved errors
 * when the runtime or proxy returns HTML (eg. index.html / login page / 404 HTML)
 * instead of the expected JSON payload.
 */

// TypeScript interfaces for Spark global objects
interface SparkKV {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<unknown>
  delete: (key: string) => Promise<void>
  keys: () => Promise<string[]>
  [key: string]: unknown // for other properties that might exist
}

interface SparkLLM {
  (prompt: string, model: string, jsonResponse?: boolean): Promise<unknown>
}

interface SparkGlobal {
  kv?: SparkKV
  llm?: SparkLLM
}

interface SparkWindow extends Window {
  spark?: SparkGlobal
}

// Type for response objects that can be either fetch Response or plain object with text()
interface ResponseLike {
  text: () => Promise<string>
  json?: () => Promise<unknown>
  headers?: {
    get: (name: string) => string | null
  }
}

export function applySparkClientFixes() {
  if (typeof window === 'undefined') return;
  const w = window as SparkWindow;
  if (!w.spark?.kv) return;

  try {
    const original = { ...w.spark.kv };

    async function parseJSONSafely(response: Response | ResponseLike | null): Promise<unknown> {
      if (!response) return undefined;
      // response may be a fetch Response object or a plain object with text()
      let contentType = '';
      if (response.headers && typeof response.headers.get === 'function') {
        contentType = response.headers.get('content-type') || '';
      }

      try {
        // If the server already set JSON content type, just parse
        if (contentType.includes('application/json')) {
          if (typeof response.json === 'function') {
            return await response.json();
          }
        }
      } catch (err) {
        // ignore; we'll try other methods
      }

      // Fall back to text and inspect
      if (!response || typeof response.text !== 'function') {
        return undefined;
      }
      const text = await response.text();
      const trimmed = (text || '').trim();
      if (!trimmed) return undefined;

      // If it looks like HTML, log a clear error
      if (trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE')) {
        console.error(`Spark KV endpoint returned HTML instead of JSON. Inspect network request to /_spark/kv/* and http proxy rewrites. Response starts with: ${trimmed.slice(0, 120)}`);
        throw new Error('Failed to parse KV key response: expected JSON but received HTML. This often means your dev proxy or runtime proxy returned index.html or a login page. Check environment variables and API proxy rules.');
      }

      // Otherwise attempt JSON parse
      try {
        return JSON.parse(trimmed);
      } catch (err) {
        console.error('Failed to parse KV key response as JSON. Response body (truncated):', trimmed.slice(0, 120));
        throw new Error('Failed to parse KV key response: not valid JSON');
      }
    }

    // build wrappers for methods we want to patch
    const patchedKV: SparkKV = {
      async get(key: string) {
        try {
          // Prefer calling the original if available (it may throw in plugin), otherwise implement ourselves
          if (typeof original.get === 'function') {
            try {
              return await original.get(key);
            } catch (err) {
              // if plugin throws failed-to-parse, try to fetch directly to provide more context
              // continue to fallback
            }
          }

          const res = await fetch(`/_spark/kv/${encodeURIComponent(key)}`, { method: 'GET', headers: { 'Content-Type': 'text/plain' } });
          if (!res.ok) {
            if (res.status === 404) return undefined;
            const body = await res.text();
            throw new Error(`Failed to fetch KV key: ${res.status} ${res.statusText} - ${body.slice(0, 600)}`);
          }
          return await parseJSONSafely(res);
        } catch (err) {
          console.error('Error in wrapped spark.kv.get():', err);
          throw err;
        }
      },
      async keys() {
        try {
          if (typeof original.keys === 'function') {
            try {
              return await original.keys();
            } catch (err) {
              // fallback to direct fetch
            }
          }

          const res = await fetch('/_spark/kv', { method: 'GET' });
          if (!res.ok) throw new Error(`Failed to fetch KV keys: ${res.status} ${res.statusText}`);
          try {
            return await res.json() as string[];
          } catch (err) {
            console.error('Failed to parse KV keys response as JSON. Will attempt to inspect text.');
            const text = await res.text();
            if (text.trim().startsWith('<')) {
              console.error('KV keys request returned HTML. Inspect network and proxy (/_spark/kv). Response:', text.slice(0, 300));
              throw new Error('Failed to parse KV keys response: expected JSON but received HTML');
            }
            throw err;
          }
        } catch (err) {
          console.error('Error in wrapped spark.kv.keys():', err);
          throw err;
        }
      },
      async set(key: string, value: unknown) {
        if (typeof original.set === 'function') {
          try {
            return await original.set(key, value);
          } catch (err) {
            // fallback
          }
        }
        const res = await fetch(`/_spark/kv/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(value),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Failed to set KV key: ${res.status} ${res.statusText} - ${body.slice(0, 300)}`);
        }
        return value;
      },
      async delete(key: string) {
        if (typeof original.delete === 'function') {
          try {
            return await original.delete(key);
          } catch (err) {
            // fallback
          }
        }
        const res = await fetch(`/_spark/kv/${encodeURIComponent(key)}`, { method: 'DELETE' });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Failed to delete KV key: ${res.status} ${res.statusText} - ${body.slice(0, 300)}`);
        }
        return undefined;
      },
    };

    // Keep other properties of kv that might be used (events etc.)
    for (const k of Object.keys(original)) {
      if (!(k in patchedKV)) {
        patchedKV[k] = original[k];
      }
    }

    w.spark.kv = patchedKV;

    console.info('Applied spark client fixes: kv methods patched for improved error handling and diagnostics');
  } catch (err) {
    console.warn('Unable to apply spark client fixes:', err);
  }
}

// Additional wrapper to make spark.llm safer to diagnose HTML responses
export function applySparkLLMFixes() {
  if (typeof window === 'undefined') return;
  const w = window as SparkWindow;
  if (!w.spark?.llm) return;

  try {
    const originalLlm = w.spark.llm;
    w.spark.llm = async function (prompt: string, model: string, jsonResponse?: boolean): Promise<unknown> {
      try {
        // Call original first
        return await originalLlm(prompt, model, jsonResponse);
      } catch (err: unknown) {
        // If parse error likely caused by HTML, try to detect and provide better diagnostics
        const errorMessage = err instanceof Error ? err.message : String(err);
        const isParseError = errorMessage.includes("Unexpected token '<'") || errorMessage.includes('Failed to parse');
        if (!isParseError) throw err;

        try {
          const body = JSON.stringify({ messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: String(prompt) }], model: model, response_format: jsonResponse ? { type: 'json_object' } : { type: 'text' } });
          const res = await fetch('/_spark/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
          const contentType = res.headers.get('content-type') || '';
          const text = await res.text();
          if (!res.ok) {
            throw new Error(`LLM request failed: ${res.status} ${res.statusText} - ${text.slice(0, 600)}`);
          }
          if (contentType.includes('text/html') || contentType.trim().startsWith('text/html')) {
            console.error('LLM endpoint returned HTML. Response (truncated):', text.slice(0, 500));
            throw new Error('LLM request returned HTML. Check /_spark/llm proxy, credentials, and that the runtime is available.');
          }
          if (contentType.includes('application/json')) {
            let data: unknown;
            try {
              data = JSON.parse(text);
            } catch (e) {
              throw new Error('LLM response claimed JSON but failed to parse: ' + e + ' - ' + text.slice(0, 500));
            }
            // try to extract the expected content if possible
            if (data && typeof data === 'object' && 'choices' in data) {
              const choices = (data as { choices?: Array<{ message?: { content?: unknown } }> }).choices;
              if (choices?.[0]?.message?.content) return choices[0].message.content;
            }
            return data;
          }
          // if not JSON nor HTML, return text
          return text;
        } catch (e) {
          console.error('LLM diagnostic fetch failed:', e);
          // Lança um erro combinando informações do erro de diagnóstico e do erro original
          const diagnosticMessage = e instanceof Error ? e.message : String(e);
          const originalMessage = err instanceof Error ? err.message : String(err);
          throw new Error(
            `LLM diagnostic fetch failed: ${diagnosticMessage} | Original error: ${originalMessage}`
          );
        }
      }
    };
    console.info('Applied spark LLM fixes: wrapped spark.llm with HTML/JSON diagnostics');
  } catch (err) {
    console.warn('Unable to apply spark LLM fixes:', err);
  }
}
