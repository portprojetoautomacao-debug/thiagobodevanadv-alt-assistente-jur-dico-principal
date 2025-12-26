/**
 * Document Sanitizer - LGPD/GDPR Compliance
 *
 * Sanitiza PII (Personally Identifiable Information) de documentos
 * antes de enviar para logs, monitoring ou armazenamento
 */

/**
 * Sanitiza dados pessoais de acordo com LGPD/GDPR
 * Remove CPF, CNPJ, emails, telefones, etc.
 */
export function sanitizePII ( data: any ): any
{
  if ( !data ) return data;

  const cpfRegex = /\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}/g;
  const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{14}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\(?\d{2}\)?\s?)?(\d{4,5})-?(\d{4})/g;

  // Se é string, sanitiza diretamente
  if ( typeof data === 'string' )
  {
    return data
      .replace( cpfRegex, '[CPF_REDACTED]' )
      .replace( cnpjRegex, '[CNPJ_REDACTED]' )
      .replace( emailRegex, '[EMAIL_REDACTED]' )
      .replace( phoneRegex, '[PHONE_REDACTED]' );
  }

  // Se é array, sanitiza cada item
  if ( Array.isArray( data ) )
  {
    return data.map( item => sanitizePII( item ) );
  }

  // Se é objeto, sanitiza recursivamente
  if ( typeof data === 'object' )
  {
    const sanitized: any = {};

    for ( const key in data )
    {
      // Campos sensíveis conhecidos
      if ( [ 'cpf', 'cnpj', 'email', 'telefone', 'senha', 'password', 'token', 'apiKey' ].includes( key.toLowerCase() ) )
      {
        sanitized[ key ] = '[REDACTED]';
      } else
      {
        sanitized[ key ] = sanitizePII( data[ key ] );
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Trunca conteúdo grande para evitar logs enormes
 */
export function truncateContent ( content: string, maxLength: number = 500 ): string
{
  if ( !content || content.length <= maxLength )
  {
    return content;
  }

  return content.slice( 0, maxLength ) + '... [truncated]';
}

/**
 * Sanitiza documento completo (usado na Chrome Extension)
 */
export function sanitizeDocumentoForSync ( documento: any )
{
  try
  {
    const MAX_SNIPPET = 500;

    const snippet = sanitizePII( documento.conteudo || "" );
    const truncated = snippet.length > MAX_SNIPPET;
    const truncatedSnippet = truncated ? snippet.slice( 0, MAX_SNIPPET ) : snippet;

    return {
      id: documento.id,
      tipo: documento.tipo,
      conteudo: truncatedSnippet,
      dataExtracao: documento.dataExtracao,
      metadados: {
        ...documento.metadados,
        _sanitization: { truncated, piiRemoved: true },
      },
    };
  } catch ( e )
  {
    console.warn( "[Sanitizer] Erro ao sanitizar documento", e );
    return {
      id: documento.id,
      tipo: documento.tipo,
      conteudo: "",
      dataExtracao: documento.dataExtracao,
      metadados: {
        ...documento.metadados,
        _sanitization: { truncated: true, piiRemoved: true, error: true }
      },
    };
  }
}
