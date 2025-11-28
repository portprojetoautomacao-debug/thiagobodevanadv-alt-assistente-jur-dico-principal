/**
 * Environment Configuration Loader (Safe for Vite + SSR)
 *
 * - Usa import.meta.env para capturar variáveis
 * - Evita erros em ambientes sem window (SSR/Vercel Edge)
 * - Logging inteligente (somente quando realmente necessário)
 * - Mantém estrutura limpa e compatível com o projeto Gemini-first
 */

// Safe origin resolver (evita erro se não houver window)
const getOrigin = () => {
  try {
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost'
  } catch {
    return 'http://localhost'
  }
}

/**
 * getEnvVar
 * Lê variável do import.meta.env com fallback seguro
 */
const getEnvVar = (
  key: string,
  defaultValue?: string,
  logError: boolean = true
): string => {
  const value = import.meta.env[key]

  if ((!value || value === '') && !defaultValue && logError) {
    console.error(`Missing required environment variable: ${key}`)
  }

  return (typeof value === 'string' ? value : '') || defaultValue || ''
}

// ============================================================================
// CONFIG OBJECT (FINAL)
// ============================================================================

export const config = {
  google: {
    clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', ''),
    redirectUri: getEnvVar('VITE_REDIRECT_URI', getOrigin())
  },

  github: {
    oauthClientId: getEnvVar('VITE_GITHUB_OAUTH_CLIENT_ID', ''),
    oauthClientSecret: getEnvVar('GITHUB_OAUTH_CLIENT_SECRET', '')
  },

  gitlab: {
    oauthClientId: getEnvVar('GITLAB_CLIENT_ID', ''),
    oauthClientSecret: getEnvVar('GITLAB_CLIENT_SECRET', ''),
    redirectUri: getEnvVar(
      'GITLAB_REDIRECT_URI',
      `${getOrigin()}/api/auth/callback/gitlab`
    )
  },

  datajud: {
    apiKey: getEnvVar('VITE_DATAJUD_API_KEY', '', false) // opcional
  },

  todoist: {
    apiKey: getEnvVar('VITE_TODOIST_API_KEY', '', false),
    webhookSecret: getEnvVar('TODOIST_WEBHOOK_SECRET', '', false),
    icalUrl: getEnvVar('TODOIST_ICAL_URL', '', false)
  },

  app: {
    environment: getEnvVar('VITE_APP_ENV', 'development'),
    isDevelopment: getEnvVar('VITE_APP_ENV', 'development') === 'development',
    isProduction: getEnvVar('VITE_APP_ENV', 'development') === 'production'
  }
} as const

// ============================================================================
// CONFIG VALIDATION
// ============================================================================

export const validateConfig = (): boolean => {
  const errors: string[] = []

  if (!config.google.clientId) {
    errors.push('Google Client ID is not configured')
  }

  if (!config.google.redirectUri) {
    errors.push('Redirect URI is not configured')
  }

  // Optional OAuth configs
  if (!config.github.oauthClientId) {
    console.warn('GitHub OAuth Client ID is not configured (optional)')
  }

  if (!config.github.oauthClientSecret) {
    console.warn('GitHub OAuth Client Secret is not configured (optional)')
  }

  if (!config.gitlab.oauthClientId) {
    console.warn('GitLab OAuth Client ID is not configured (optional)')
  }

  if (!config.gitlab.oauthClientSecret) {
    console.warn('GitLab OAuth Client Secret is not configured (optional)')
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:')
    errors.forEach(e => console.error(' - ' + e))
    console.error(
      '\nPlease check your .env file and ensure all required variables are set.'
    )
    console.error('See OAUTH_SETUP.md for configuration instructions.')
    return false
  }

  return true
}
