/*
 * Wraps window.spark.kv methods to add robust JSON detection and improved errors
 * when the runtime or proxy returns HTML (eg. index.html / login page / 404 HTML)
 * instead of the expected JSON payload.
 * 
 * Also patches Spark initialization to handle localization errors gracefully.
 * 
 * @deprecated Este módulo é legado do Spark. O sistema agora usa Gemini 2.5 Pro.
 * Mantido apenas para compatibilidade com código existente.
 */

// TypeScript interfaces for Spark global objects
interface SparkKV {
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
  keys: () => Promise<string[]>
  [key: string]: unknown
}

interface SparkLLM {
  (prompt: string, modelName?: string, jsonMode?: boolean): Promise<string>
}

// Extend Window interface to include spark
declare global {
  interface Window {
    spark?: {
      kv?: SparkKV
      llm?: SparkLLM
    }
  }
}

interface ResponseLike {
  text: () => Promise<string>
  json?: () => Promise<unknown>
  headers?: {
    get: (name: string) => string | null
  }
}

/**
 * Patches Spark client to suppress localization errors that don't affect functionality
 */
export function patchSparkLocalization() {
  if (typeof window === 'undefined') return;

  // Intercept console errors to suppress RegisterClientLocalizationsError
  const originalError = console.error;
  console.error = function (...args: unknown[]) {
    const firstArg = args[0];
    if (firstArg && typeof firstArg === 'object' && 'name' in firstArg) {
      if (firstArg.name === 'RegisterClientLocalizationsError') {
        console.warn('Spark localization error suppressed (non-critical):', args);
        return;
      }
    }
    originalError.apply(console, args);
  };
}

export function patchFileReader() {
  if (typeof window === 'undefined') return;

  const originalReadAsText = FileReader.prototype.readAsText;
  FileReader.prototype.readAsText = function (blob, encoding) {
    if (!(blob instanceof Blob)) {
      console.warn('FileReader.readAsText called with non-Blob argument:', blob);
      // Evita o crash chamando o callback de erro ou apenas retornando
      if (this.onerror) {
        const event = new ProgressEvent('error');
        // @ts-expect-error - onerror pode ser null
        this.onerror(event);
      }
      return;
    }
    return originalReadAsText.call(this, blob, encoding);
  };
}

export function applySparkClientFixes() {
  if (typeof window === 'undefined') return;

  // Apply localization patch first
  patchSparkLocalization();

  // Apply FileReader patch to prevent crashes
  patchFileReader();

  const w = window as Window & { spark?: { kv?: SparkKV; llm?: SparkLLM } };

  try {
    // Se spark não existir, cria um mock seguro para evitar crash
    w.spark ??= {} as { kv?: SparkKV; llm?: SparkLLM };

    // Se kv não existir, cria um mock
    w.spark.kv ??= {} as SparkKV;

    const spark = w.spark;
    const original = { ...spark.kv };

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
      async get<T>(key: string): Promise<T | undefined> {
        try {
          // Prefer calling the original if available (it may throw in plugin), otherwise implement ourselves
          if (typeof original.get === 'function') {
            try {
              return await original.get<T>(key);
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
          return await parseJSONSafely(res) as T | undefined;
        } catch (err) {
          console.error('Error in wrapped spark.kv.get():', err);
          throw err;
        }
      },
      async keys(): Promise<string[]> {
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
      async set<T>(key: string, value: T): Promise<void> {
        if (typeof original.set === 'function') {
          try {
            return await original.set<T>(key, value);
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
      if (spark.kv && !(k in spark.kv)) {
        (spark.kv as Record<string, unknown>)[k] = original[k];
      }
    }

    spark.kv = patchedKV;

    console.info('Applied spark client fixes: kv methods patched for improved error handling and diagnostics');
  } catch (err) {
    console.warn('Unable to apply spark client fixes:', err);
  }
}

export function applySparkLLMFixes() {
  if (typeof window === 'undefined') return;
  const w = window as Window & { spark?: { kv?: SparkKV; llm?: SparkLLM } };
  if (!w.spark?.llm) return;

  try {
    const originalLlm = w.spark.llm;
    w.spark.llm = async function (prompt: string, model?: string, jsonResponse?: boolean): Promise<string> {
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
              const choices = data.choices as Array<{ message?: { content?: unknown } }>;
              if (choices?.[0]?.message?.content) return String(choices[0].message.content);
            }
            return JSON.stringify(data);
          }
          // if not JSON nor HTML, return text
          return text;
        } catch (e) {
          console.error('LLM diagnostic fetch failed:', e);
          const diagnosticMsg = e instanceof Error ? e.message : String(e);
          const originalMsg = err instanceof Error ? err.message : String(err);
          throw new Error(
            `LLM diagnostic fetch failed: ${diagnosticMsg} | Original error: ${originalMsg}`
          );
        }
      }
    };
    console.info('Applied spark LLM fixes: wrapped spark.llm with HTML/JSON diagnostics');
  } catch (err) {
    console.warn('Unable to apply spark LLM fixes:', err);
  }
}
