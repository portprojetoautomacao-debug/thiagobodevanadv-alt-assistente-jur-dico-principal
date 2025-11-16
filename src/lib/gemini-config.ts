export const getGeminiApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    throw new Error(
      'VITE_GEMINI_API_KEY não configurada. ' +
      'Configure a chave da API do Gemini no arquivo .env. ' +
      'Consulte GEMINI_API_SETUP.md para instruções.'
    )
  }
  
  return apiKey
}

export const isGeminiConfigured = (): boolean => {
  try {
    getGeminiApiKey()
    return true
  } catch {
    return false
  }
}

export const validateGeminiApiKey = (apiKey: string): boolean => {
  return apiKey.startsWith('AIza') && apiKey.length > 30
}
