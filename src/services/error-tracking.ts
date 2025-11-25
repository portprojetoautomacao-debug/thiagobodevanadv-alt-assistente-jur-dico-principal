// GitLab Error Tracking Integration
// DSN: https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042

import * as Sentry from "@sentry/react";

/**
 * Check if Sentry DSN is valid and reachable
 */
async function checkSentryConnectivity(): Promise<boolean> {
  try {
    // Test basic connectivity to GitLab Error Tracking
    await fetch('https://observe.gitlab.com/errortracking/api/v1/projects/76299042/envelope/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: '', // Empty envelope for connectivity test
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    // Even if it fails, as long as we get a response (not network error), consider it reachable
    return true;
  } catch (error) {
    console.warn('Sentry connectivity check failed:', error);
    return false;
  }
}

/**
 * Initialize Sentry for Error Tracking
 *
 * Features:
 * - Automatic error capture
 * - Performance monitoring
 * - User identification
 * - Session tracking
 * - Source maps support
 */
export async function initErrorTracking() {
  try {
    // Check connectivity first (only in production)
    if (import.meta.env.MODE === "production") {
      const isReachable = await checkSentryConnectivity();
      if (!isReachable) {
        console.warn('Sentry: GitLab Error Tracking not reachable, skipping initialization');
        return;
      }
    }

    Sentry.init({
      // GitLab Error Tracking DSN
      dsn: "https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042",

      // Environment
      environment: import.meta.env.MODE || "development",

      // Release version
      release: import.meta.env.VITE_APP_VERSION || "unknown",

      // Integrations - Atualizado para Sentry v10
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.browserTracingIntegration(),
      ],

      // Performance monitoring - Atualizado para v10
      tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,

      // Replay sample rate
      replaysSessionSampleRate: import.meta.env.MODE === "production" ? 0.1 : 0.0,
      replaysOnErrorSampleRate: 1.0,

      // Debug mode
      debug: import.meta.env.MODE !== "production",

      // Capture breadcrumbs
      maxBreadcrumbs: 50,

      // Before send hook para filtrar erros
      beforeSend: (event, hint) => {
        // Filtrar erros de rede relacionados ao Sentry/GitLab
        if (hint.originalException &&
            hint.originalException instanceof Error &&
            hint.originalException.message?.includes('observe.gitlab.com')) {
          console.warn('Sentry: Filtering GitLab Error Tracking network error');
          return null; // Não enviar o erro
        }

        // Filtrar outros erros de rede
        if (event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('Failed to fetch') ||
              error?.value?.includes('NetworkError') ||
              error?.value?.includes('observe.gitlab.com')) {
            console.warn('Sentry: Filtering network error');
            return null;
          }
        }

        return event;
      },

      // Ignore errors
      ignoreErrors: [
        // Browser extensions
        "top.GLOBALS",
        // Random plugins/extensions
        "originalCreateNotification",
        "canvas.contentDocument",
        "MyApp_RemoveAllHighlights",
        // See http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
        "Can't find variable: ZiteReader",
        "jigsaw is not defined",
        "ComboSearch is not defined",
        // Network errors
        "Failed to fetch",
        "NetworkError",
        "observe.gitlab.com",
        // React DevTools
        "React DevTools",
        // Vite HMR
        "vite",
        // Spark related
        "_spark",
      ],

      // Deny URLs
      denyUrls: [
        /observe\.gitlab\.com/,
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        /^safari-extension:\/\//i,
      ],
    });

    console.log("✅ Sentry Error Tracking initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Sentry:", error);
    // Não lançar erro para não quebrar a aplicação
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email: email || undefined,
    username: username || undefined,
  });
  
  console.log(`✅ User context set: ${username || email || userId}`);
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
  console.log("✅ User context cleared");
}

/**
 * Set custom tags for error tracking
 */
export function setErrorTag(key: string, value: string | number) {
  Sentry.setTag(key, value);
}

/**
 * Capture error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
  
  console.error("❌ Error captured:", error.message);
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: "fatal" | "error" | "warning" | "info" | "debug" = "info") {
  Sentry.captureMessage(message, level);
  
  console.log(`📝 Message captured [${level}]: ${message}`);
}

/**
 * Capture API error
 */
export function captureApiError(
  error: Error,
  method: string,
  url: string,
  statusCode?: number,
  responseBody?: unknown
) {
  Sentry.captureException(error, {
    contexts: {
      api: {
        method,
        url,
        statusCode,
        responseBody: typeof responseBody === 'string' 
          ? responseBody.substring(0, 1000)
          : JSON.stringify(responseBody).substring(0, 1000),
      },
    },
    tags: {
      error_type: "api_error",
      http_method: method,
      http_status: statusCode,
    },
  });
  
  console.error(`❌ API Error captured: ${method} ${url} (${statusCode})`);
}

/**
 * Legacy function for backwards compatibility
 * 
 * @deprecated This function is deprecated and should not be used.
 * Use Sentry.startSpan() directly instead:
 * 
 * @example
 * ```ts
 * await Sentry.startSpan({ name: 'myOperation', op: 'task' }, async (span) => {
 *   // Your async operation here
 *   return result;
 * });
 * ```
 * 
 * @throws {Error} Always throws an error to prevent silent failures
 */
export function startTransaction(_name: string, _op: string = "http.request"): never {
  throw new Error(
    'startTransaction is deprecated in Sentry v10+. ' +
    'Use Sentry.startSpan() directly. ' +
    'See: https://docs.sentry.io/platforms/javascript/guides/react/performance/'
  );
}

/**
 * Flush pending events before shutdown
 */
export async function flushErrors(timeout: number = 2000) {
  try {
    await Sentry.close(timeout);
    console.log("✅ Error tracking flushed");
  } catch (error) {
    console.warn("Error flushing Sentry:", error);
  }
}
