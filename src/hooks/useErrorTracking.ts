import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { setUserContext, clearUserContext, setErrorTag } from '../services/error-tracking';

/**
 * Hook para rastrear usuário no Sentry
 * Use isso no seu componente de login/auth
 */
export function useUserTracking(userId?: string, email?: string, username?: string) {
  useEffect(() => {
    if (userId) {
      setUserContext(userId, email, username);
    } else {
      clearUserContext();
    }
  }, [userId, email, username]);
}

/**
 * Hook para rastrear navegação de páginas
 * Útil para entender fluxo do usuário
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    setErrorTag('current_page', location.pathname);
    
    // Iniciar breadcrumb
    Sentry.captureMessage(`Navigated to ${location.pathname}`, 'debug');
  }, [location.pathname]);
}

/**
 * Hook para rastrear errors em componentes
 */
export function useErrorHandler(componentName: string) {
  return (error: Error, info: { componentStack: string }) => {
    setErrorTag('error_boundary', componentName);
    
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: info.componentStack,
          componentName,
        },
      },
    });

    console.error(`Error in ${componentName}:`, error, info);
  };
}

/**
 * Hook para rastrear performance de funções assíncronas (Sentry v10+)
 */
export function useAsyncTracking(functionName: string) {
  return async <T,>(fn: () => Promise<T>): Promise<T> => {
    return await Sentry.startSpan(
      {
        name: functionName,
        op: 'async_operation',
      },
      async () => {
        try {
          const result = await fn();
          return result;
        } catch (error) {
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  };
}

/**
 * Componente wrapper com Error Boundary do Sentry
 */
export const ErrorBoundary = Sentry.ErrorBoundary;
