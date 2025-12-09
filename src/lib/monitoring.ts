/**
 * Configuração de Monitoring e Alertas
 * Integração com Sentry para rastreamento de erros em produção
 */

/// <reference types="vite/client" />

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Configuração customizada para ambiente jurídico
export function initMonitoring() {
  if (!IS_PRODUCTION || !SENTRY_DSN) {
    console.log("[Monitoring] Sentry desabilitado em desenvolvimento");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? "production" : "development",
    release: `assistente-juridico@${APP_VERSION}`,
    
    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/assistente-juridico.*\.vercel\.app/,
          /^https:\/\/.*\.pje\.jus\.br/, // APIs externas
        ],
      }),
    ],
    
    // Sample rate (10% de eventos de performance)
    tracesSampleRate: 0.1,
    
    // Filtrar dados sensíveis (LGPD compliance)
    beforeSend(event, hint) {
      // Remover dados potencialmente sensíveis
      if (event.request?.url) {
        // Remove query params com dados sensíveis
        event.request.url = event.request.url.split("?")[0];
      }
      
      // Remove informações de processos dos breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message?.includes("CNJ") || breadcrumb.message?.includes("CPF")) {
            return { ...breadcrumb, message: "[REDACTED - LGPD]" };
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Ignorar erros conhecidos e não críticos
    ignoreErrors: [
      "ResizeObserver loop", // Erro comum de layout
      "Non-Error promise rejection", // Promisses não tratadas (não críticas)
      /^Loading chunk \d+ failed/, // Falhas de carregamento de chunks (timeout/network)
    ],
  });

  console.log("[Monitoring] Sentry inicializado");
}

// Helper para capturar exceções customizadas
export function captureException(error: Error, context?: Record<string, any>) {
  if (!IS_PRODUCTION) {
    console.error("[Dev Error]", error, context);
    return;
  }

  Sentry.captureException(error, {
    level: "error",
    extra: context,
  });
}

// Helper para capturar mensagens (não-erros)
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, any>) {
  if (!IS_PRODUCTION) {
    console.log(`[Dev ${level}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

// Adicionar contexto do usuário (após login)
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Não enviar dados sensíveis como nome completo
  });
  
  Sentry.setTag("user_role", user.role || "unknown");
}

// Limpar contexto (logout)
export function clearUserContext() {
  Sentry.setUser(null);
}
