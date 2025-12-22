/*
 * Script injetado no contexto da página para interceptar XHR e fetch
 * - Captura requests/responses para endpoints do PJe
 * - Envia eventos para o content script via window.postMessage
 *
 * Observações de segurança/privacidade:
 * - Apenas monitora URLs que contenham "/pje/" por padrão
 * - Não envia o corpo completo ao content script; envia uma versão sanitizada mínima
 */
(function () {
  try {
    const allowedHostPattern = /https?:\/\/.+?pje\./i;

    // Sanitização defensiva (privacidade): truncar strings e redigir PII comum (CPF/email)
    // OBS: Este script roda no contexto da página, então não importamos utilitários do bundle.
    function sanitizeForPostMessage(value: any, depth = 0): any {
      const MAX_DEPTH = 4;
      const MAX_KEYS = 50;
      const MAX_ARRAY = 20;
      const MAX_SNIPPET = 500;

      const cpfRegex = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

      const sanitizeString = (s: string) => {
        const redacted = s
          .replace(cpfRegex, "[REDACTED_CPF]")
          .replace(emailRegex, "[REDACTED_EMAIL]");
        return redacted.length > MAX_SNIPPET ? redacted.slice(0, MAX_SNIPPET) : redacted;
      };

      try {
        if (value == null) return value;
        const t = typeof value;

        if (t === "string") return sanitizeString(value);
        if (t === "number" || t === "boolean") return value;

        // Evitar serialização de objetos complexos/DOM
        if (t === "function") return undefined;

        if (depth >= MAX_DEPTH) {
          // Se for stringificável, retornar um snapshot curto; caso contrário, sinalizar truncamento
          try {
            return sanitizeString(JSON.stringify(value));
          } catch (_) {
            return "[TRUNCATED]";
          }
        }

        if (Array.isArray(value)) {
          const sliced = value.slice(0, MAX_ARRAY);
          return sliced.map((v) => sanitizeForPostMessage(v, depth + 1));
        }

        if (t === "object") {
          const out: any = {};
          const keys = Object.keys(value).slice(0, MAX_KEYS);
          for (const k of keys) {
            out[k] = sanitizeForPostMessage(value[k], depth + 1);
          }
          if (Object.keys(value).length > MAX_KEYS) {
            out._sanitization = { truncated: true, piiRemoved: true };
          }
          return out;
        }

        // Fallback
        return sanitizeString(String(value));
      } catch (_) {
        return "[SANITIZATION_FAILED]";
      }
    }

    // Utilitário para enviar mensagem ao content script
    function sendToContent(detail: any) {
      window.postMessage({ source: "PJE_NETWORK_HOOK", detail }, "*");
    }

    // Hook para XMLHttpRequest
    (function () {
      const XHR = (window as any).XMLHttpRequest;
      if (!XHR) return;

      const open = XHR.prototype.open;
      const send = XHR.prototype.send;

      XHR.prototype.open = function (method: string, url: string, ...rest: any[]) {
        (this as any).__pje_hook_url = url;
        (this as any).__pje_hook_method = method;
        return open.apply(this, [method, url, ...rest]);
      };

      XHR.prototype.send = function (body?: any) {
        const url = (this as any).__pje_hook_url;
        try {
          if (url && allowedHostPattern.test(url)) {
            const start = Date.now();
            const onLoad = () => {
              try {
                const responseText = this.responseText;
                let body = null;
                // Tentar capturar JSON se for um endpoint relevante ou se parecer JSON
                // PJe usa POST para carregar detalhes, então precisamos do corpo da resposta
                if (
                  responseText &&
                  (responseText.trim().startsWith("{") || responseText.trim().startsWith("["))
                ) {
                  try {
                    body = JSON.parse(responseText);
                  } catch {
                    // Não é JSON válido, ignorar corpo
                  }
                }

                sendToContent({
                  type: "xhr",
                  url,
                  method: (this as any).__pje_hook_method,
                  status: this.status,
                  duration: Date.now() - start,
                  responseLength: responseText ? responseText.length : 0,
                  // Enviar corpo parseado SOMENTE em forma sanitizada (truncado + PII redigida)
                  body: body ? sanitizeForPostMessage(body) : null,
                  bodySanitized: true,
                });
              } catch (e) {
                console.error("[PJe Network Hook] XHR onLoad error:", e);
              }
            };
            this.addEventListener("load", onLoad);
          }
        } catch (e) {
          console.error("[PJe Network Hook] XHR error:", e);
        }

        return send.apply(this, [body]);
      };
    })();

    // Hook para fetch
    (function () {
      if (!(window as any).fetch) return;
      const origFetch = window.fetch.bind(window as any);
      window.fetch = function (input: RequestInfo, init?: RequestInit) {
        try {
          const url = typeof input === "string" ? input : (input as Request).url;
          if (url && allowedHostPattern.test(url)) {
            const start = Date.now();
            return origFetch(input, init).then(async (response: Response) => {
              const cloned = response.clone();
              let len = 0;
              let body = null;
              try {
                const text = await cloned.text();
                len = text?.length || 0;
                if (text && (text.trim().startsWith("{") || text.trim().startsWith("["))) {
                  try {
                    body = JSON.parse(text);
                  } catch (_) {}
                }
              } catch (_) {
                len = -1;
              }

              sendToContent({
                type: "fetch",
                url,
                method: (init && init.method) || "GET",
                status: response.status,
                duration: Date.now() - start,
                responseLength: len,
                body: body ? sanitizeForPostMessage(body) : null,
                bodySanitized: true,
              });

              return response;
            });
          }
        } catch (e) {
          // ignore
        }
        return origFetch(input, init);
      };
    })();

    // Hook jQuery ajax if present
    (function () {
      try {
        const $ = (window as any).jQuery || (window as any).$;
        if ($ && $.ajax) {
          const origAjax = $.ajax;
          $.ajax = function (...args: any[]) {
            try {
              const settings = args[0] && typeof args[0] === "object" ? args[0] : args[1] || {};
              const url = settings.url || args[0];
              if (url && allowedHostPattern.test(url)) {
                const start = Date.now();
                const originalSuccess = settings.success;
                settings.success = function (data: any, ...restArgs: any[]) {
                  try {
                    sendToContent({
                      type: "jquery-ajax",
                      url,
                      duration: Date.now() - start,
                      payloadSize: JSON.stringify(data).length,
                    });
                  } catch {
                    // Erro ao processar callback
                  }
                  if (originalSuccess) originalSuccess.call(this, data, ...restArgs);
                };
              }
            } catch {
              // Erro ao configurar hook jQuery
            }
            return origAjax.apply(this, args as any);
          };
        }
      } catch {
        // jQuery não disponível ou erro ao criar hook
      }
    })();
  } catch (err) {
    // fail silently
  }
})();
