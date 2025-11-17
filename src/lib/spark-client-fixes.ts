/*
 * Wraps window.spark.kv methods to add robust JSON detection and improved errors
 * when the runtime or proxy returns HTML (eg. index.html / login page / 404 HTML)
 * instead of the expected JSON payload.
 */

export function applySparkClientFixes() {
  if (typeof window === 'undefined') return;
  const w: any = window as any;
  if (!w.spark || !w.spark.kv) return;

  try {
    const original = { ...w.spark.kv };

    async function parseJSONSafely(response: Response | { text: () => Promise<string> } | null) {
      if (!response) return undefined;
      // response may be a fetch Response object or a plain object with text()
      let contentType = '';
      // @ts-ignore
      if (response.headers && typeof response.headers.get === 'function') {
        // @ts-ignore
        contentType = response.headers.get('content-type') || '';
      }

      try {
        // If the server already set JSON content type, just parse
        if (contentType.includes('application/json')) {
          // @ts-ignore
          return await response.json();
        }
      } catch (err) {
        // ignore; we'll try other methods
      }

      // Fall back to text and inspect
      // @ts-ignore
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
    w.spark.kv = {
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
            return await res.json();
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
      async set(key: string, value: any) {
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
      if (!(k in w.spark.kv)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        w.spark.kv[k] = original[k];
      }
    }

    console.info('Applied spark client fixes: kv methods patched for improved error handling and diagnostics');
  } catch (err) {
    console.warn('Unable to apply spark client fixes:', err);
  }
}

// Additional wrapper to make spark.llm safer to diagnose HTML responses
export function applySparkLLMFixes() {
  if (typeof window === 'undefined') return;
  const w: any = window as any;
  if (!w.spark || !w.spark.llm) return;

  try {
    const originalLlm = w.spark.llm;
    w.spark.llm = async function (prompt: any, model: any, jsonResponse?: boolean) {
      try {
        // Call original first
        return await originalLlm(prompt, model, jsonResponse);
      } catch (err: any) {
        // If parse error likely caused by HTML, try to detect and provide better diagnostics
        const isParseError = err && typeof err.message === 'string' && (err.message.includes("Unexpected token '<'") || err.message.includes('Failed to parse'));
        if (!isParseError) throw err;

        try {
          const body = JSON.stringify({ messages: [{ role: 'system', content: 'You are a helpful assistant.' }, { role: 'user', content: String(prompt) }], model: model, response_format: jsonResponse ? { type: 'json_object' } : { type: 'text' } });
          const res = await fetch('/_spark/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
          const contentType = res.headers.get('content-type') || '';
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(`LLM request failed: ${res.status} ${res.statusText} - ${txt.slice(0, 600)}`);
          }
          if (contentType.includes('text/html') || contentType.trim().startsWith('text/html')) {
            const txt = await res.text();
            console.error('LLM endpoint returned HTML. Response (truncated):', txt.slice(0, 500));
            throw new Error('LLM request returned HTML. Check /_spark/llm proxy, credentials, and that the runtime is available.');
          }
          if (contentType.includes('application/json')) {
            const data = await res.json();
            // try to extract the expected content if possible
            if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
            return data;
          }
          const text = await res.text();
          // if not JSON nor HTML, return text
          return text;
        } catch (e) {
          console.error('LLM diagnostic fetch failed:', e);
          throw err;
        }
      }
    };
    console.info('Applied spark LLM fixes: wrapped spark.llm with HTML/JSON diagnostics');
  } catch (err) {
    console.warn('Unable to apply spark LLM fixes:', err);
  }
}
