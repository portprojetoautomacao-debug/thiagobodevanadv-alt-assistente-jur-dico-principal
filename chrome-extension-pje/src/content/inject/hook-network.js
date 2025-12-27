// Hook network (JS) - injected into page context
(function () {
  try {
    const allowedHostPattern = /https?:\/\/.+?pje\./i;

    function sendToContent(detail) {
      window.postMessage({ source: "PJE_NETWORK_HOOK", detail }, "*");
    }

    // XHR hook
    (function () {
      const XHR = window.XMLHttpRequest;
      if (!XHR) return;
      const open = XHR.prototype.open;
      const send = XHR.prototype.send;

      XHR.prototype.open = function (method, url, ...rest) {
        this.__pje_hook_url = url;
        this.__pje_hook_method = method;
        return open.apply(this, [method, url, ...rest]);
      };

      XHR.prototype.send = function (body) {
        const url = this.__pje_hook_url;
        try {
          if (url && allowedHostPattern.test(url)) {
            const start = Date.now();
            const onLoad = () => {
              try {
                const responseText = this.responseText;
                sendToContent({
                  type: "xhr",
                  url,
                  method: this.__pje_hook_method,
                  status: this.status,
                  duration: Date.now() - start,
                  responseLength: responseText ? responseText.length : 0,
                });
              } catch (e) {}
            };
            this.addEventListener("load", onLoad);
          }
        } catch (e) {}
        return send.apply(this, [body]);
      };
    })();

    // fetch hook
    (function () {
      if (!window.fetch) return;
      const origFetch = window.fetch.bind(window);
      window.fetch = function (input, init) {
        try {
          const url = typeof input === "string" ? input : input.url;
          if (url && allowedHostPattern.test(url)) {
            const start = Date.now();
            return origFetch(input, init).then(function (response) {
              const cloned = response.clone();
              let len = 0;
              try {
                return cloned
                  .text()
                  .then(function (text) {
                    len = text ? text.length : 0;
                    sendToContent({
                      type: "fetch",
                      url,
                      method: (init && init.method) || "GET",
                      status: response.status,
                      duration: Date.now() - start,
                      responseLength: len,
                    });
                    return response;
                  })
                  .catch(function () {
                    sendToContent({
                      type: "fetch",
                      url,
                      method: (init && init.method) || "GET",
                      status: response.status,
                      duration: Date.now() - start,
                      responseLength: -1,
                    });
                    return response;
                  });
              } catch (_) {
                sendToContent({
                  type: "fetch",
                  url,
                  method: (init && init.method) || "GET",
                  status: response.status,
                  duration: Date.now() - start,
                  responseLength: -1,
                });
                return response;
              }
            });
          }
        } catch (e) {}
        return origFetch(input, init);
      };
    })();

    // jQuery AJAX hook
    (function () {
      try {
        const $ = window.jQuery || window.$;
        if ($ && $.ajax) {
          const origAjax = $.ajax;
          $.ajax = function () {
            try {
              const settings =
                arguments[0] && typeof arguments[0] === "object"
                  ? arguments[0]
                  : arguments[1] || {};
              const url = settings.url || arguments[0];
              if (url && allowedHostPattern.test(url)) {
                const start = Date.now();
                const originalSuccess = settings.success;
                settings.success = function (data) {
                  try {
                    sendToContent({
                      type: "jquery-ajax",
                      url,
                      duration: Date.now() - start,
                      payloadSize: JSON.stringify(data).length,
                    });
                  } catch (e) {}
                  if (originalSuccess) originalSuccess.apply(this, arguments);
                };
              }
            } catch (e) {}
            return origAjax.apply(this, arguments);
          };
        }
      } catch (e) {}
    })();
  } catch (err) {}
})();
