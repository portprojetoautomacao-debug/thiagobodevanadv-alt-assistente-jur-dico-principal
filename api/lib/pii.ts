/**
 * PII redaction utilities
 * - Redacts CPFs, CNPJs, emails, phone numbers and CNJ process numbers
 * - Designed as permissive/defensive redactor, not a full PII scanner
 */

export function redactPii(text: string): string {
  if (!text || typeof text !== "string") return text;

  // CPF (Brazilian) - 000.000.000-00 or 00000000000
  text = text.replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "[REDACTED_CPF]");
  text = text.replace(/\b\d{11}\b/g, "[REDACTED_CPF]");

  // CNPJ - 00.000.000/0000-00 or 00000000000000
  text = text.replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, "[REDACTED_CNPJ]");
  text = text.replace(/\b\d{14}\b/g, "[REDACTED_CNPJ]");

  // Emails
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");

  // Phone numbers (simple patterns)
  text = text.replace(/\b\+?\d{2}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g, "[REDACTED_PHONE]");
  text = text.replace(/\b\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g, "[REDACTED_PHONE]");

  // CNJ process number patterns like 0000000-00.0000.0.00.0000 or 0000000-00.0000.0.00.0000
  text = text.replace(/\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g, "[REDACTED_PROCESS]");
  text = text.replace(/\b\d{20}\b/g, "[REDACTED_PROCESS]");

  return text;
}

export default redactPii;
