/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sanitizador de documentos: redaction (CPFs, emails) e truncamento
 */
export function sanitizeDocumentoForSync(documento: any) {
  try {
    const MAX_SNIPPET = 500;
    const cpfRegex = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    const snippet = (documento.conteudo || "")
      .replace(cpfRegex, "[REDACTED_CPF]")
      .replace(emailRegex, "[REDACTED_EMAIL]");
    const truncated = snippet.length > MAX_SNIPPET;
    const truncatedSnippet = truncated ? snippet.slice(0, MAX_SNIPPET) : snippet;

    const sanitized: any = {
      id: documento.id,
      tipo: documento.tipo,
      // Enviar apenas snippet truncado e redigido; NÃO enviar o conteúdo original completo
      conteudo: truncatedSnippet,
      dataExtracao: documento.dataExtracao,
      metadados: {
        ...documento.metadados,
        // Indica que o conteúdo foi truncado e que PII foi removido
        _sanitization: { truncated: truncated, piiRemoved: true },
      },
    };

    return sanitized;
  } catch (e) {
    console.warn("[PJe Sync] Falha ao sanitizar documento, descartando conteúdo sensível", e);
    // Em caso de falha, enviar apenas metadados sem conteúdo
    return {
      id: documento.id,
      tipo: documento.tipo,
      conteudo: "",
      dataExtracao: documento.dataExtracao,
      metadados: { ...documento.metadados, _sanitization: { truncated: true, piiRemoved: true } },
    };
  }
}
