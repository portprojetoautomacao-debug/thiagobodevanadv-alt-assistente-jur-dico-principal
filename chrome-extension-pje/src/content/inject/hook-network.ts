// @ts-nocheck
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
                  } catch (e) {
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
                  body: body, // Enviar corpo parseado se for JSON
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
                body: body,
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
                settings.success = function (data: any) {
                  try {
                    sendToContent({
                      type: "jquery-ajax",
                      url,
                      duration: Date.now() - start,
                      payloadSize: JSON.stringify(data).length,
                    });
                  } catch (e) {}
                  if (originalSuccess) originalSuccess.apply(this, arguments as any);
                };
              }
            } catch (e) {}
            return origAjax.apply(this, args as any);
          };
        }
      } catch (e) {
        // ignore
      }
    })();
  } catch (err) {
    // fail silently
  }
})();
