// GitLab Error Tracking Integration
// DSN: https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042

import * as Sentry from "@sentry/react";

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
export function initErrorTracking() {
  Sentry.init({
    // GitLab Error Tracking DSN
    dsn: "https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042",
    
    // Environment
    environment: import.meta.env.MODE || "development",
    
    // Release version
    release: import.meta.env.VITE_APP_VERSION || "unknown",
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    
    // Replay sample rate
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Debug mode
    debug: import.meta.env.MODE !== "production",
    
    // Capture breadcrumbs
    maxBreadcrumbs: 50,
    
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
    ],
  });

  console.log("✅ Sentry Error Tracking initialized");
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
 * Start performance monitoring span (Sentry v10+)
 * Returns a callback that can be used to wrap async operations
 * 
 * @deprecated Use Sentry.startSpan directly for better performance tracking
 * @example
 * ```ts
 * await Sentry.startSpan({ name: 'myOperation', op: 'task' }, async (span) => {
 *   // Your async operation here
 *   return result;
 * });
 * ```
 */
export function startTransaction(name: string, op: string = "http.request") {
  // This is a compatibility shim for legacy code
  // Modern code should use Sentry.startSpan directly with a proper callback
  console.warn('startTransaction is deprecated. Use Sentry.startSpan directly.');
  return null;
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
