const getEnvVar = (key: string, defaultValue?: string, logError: boolean = true): string => {
  const value = import.meta.env[key] || defaultValue

  // Only log error if no value and no default provided AND logging is enabled
  if (!value && !defaultValue && logError) {
    console.error(`Missing required environment variable: ${key}`)
  }

  return value || ''
}

export const config = {
  google: {
    clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', ''),
    redirectUri: getEnvVar('VITE_REDIRECT_URI', window.location.origin),
  },
  datajud: {
    apiKey: getEnvVar('VITE_DATAJUD_API_KEY', '', false), // Optional - no error logging
  },
  todoist: {
    apiKey: getEnvVar('VITE_TODOIST_API_KEY', '', false), // Optional - no error logging
  },
  app: {
    environment: getEnvVar('VITE_APP_ENV', 'development'),
    isDevelopment: getEnvVar('VITE_APP_ENV', 'development') === 'development',
    isProduction: getEnvVar('VITE_APP_ENV', 'development') === 'production',
  },
} as const

export const validateConfig = (): boolean => {
  const errors: string[] = []

  if (!config.google.clientId) {
    errors.push('Google Client ID is not configured')
  }

  if (!config.google.redirectUri) {
    errors.push('Redirect URI is not configured')
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    console.error('\nPlease check your .env file and ensure all required variables are set.')
    console.error('See OAUTH_SETUP.md for configuration instructions.')
    return false
  }

  return true
}
