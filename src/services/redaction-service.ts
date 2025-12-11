/**
 * Redaction Service
 *
 * Serviço para anonimização/redação de dados sensíveis conforme LGPD
 *
 * Features:
 * - Redação configurável de nomes, CPF, CNPJ, telefones, endereços
 * - Modos de redação: complete, partial, none
 * - Compliance com LGPD Art. 5º, I e II
 *
 * @module redaction-service
 */

// Tipos de redação suportados
export type RedactionMode = "none" | "partial" | "complete";

export interface RedactionConfig {
  // Modo geral de redação (pode ser sobrescrito por tipo)
  mode: RedactionMode;

  // Redação específica por tipo de dado
  names?: RedactionMode;
  cpf?: RedactionMode;
  cnpj?: RedactionMode;
  telefone?: RedactionMode;
  endereco?: RedactionMode;
  email?: RedactionMode;

  // Se true, aplica redação em todo o sistema
  enabled: boolean;
}

export interface RedactionResult {
  originalText: string;
  redactedText: string;
  redactionsApplied: {
    type: string;
    count: number;
    mode: RedactionMode;
  }[];
}

/**
 * Configuração padrão de redação
 *
 * Por padrão, mantém os dados completos para uso interno do escritório.
 * Redação deve ser ativada explicitamente quando necessário
 * (ex: compartilhamento externo, relatórios públicos, etc.)
 */
const DEFAULT_CONFIG: RedactionConfig = {
  mode: "none",
  enabled: false,
};

class RedactionService {
  private config: RedactionConfig;

  constructor(config?: Partial<RedactionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Atualiza configuração de redação
   */
  setConfig(config: Partial<RedactionConfig>): void {
    // Merge config, ensuring proper override of mode values
    this.config = {
      ...this.config,
      ...config,
      // Clear specific modes when changing global mode (unless explicitly set)
      ...(config.mode && !config.names ? { names: undefined } : {}),
      ...(config.mode && !config.cpf ? { cpf: undefined } : {}),
      ...(config.mode && !config.cnpj ? { cnpj: undefined } : {}),
      ...(config.mode && !config.telefone ? { telefone: undefined } : {}),
      ...(config.mode && !config.endereco ? { endereco: undefined } : {}),
      ...(config.mode && !config.email ? { email: undefined } : {}),
    };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): RedactionConfig {
    return { ...this.config };
  }

  /**
   * Verifica se redação está habilitada
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Redaciona nomes de pessoas
   *
   * Modos:
   * - none: "João da Silva Santos" → "João da Silva Santos"
   * - partial: "João da Silva Santos" → "João S."
   * - complete: "João da Silva Santos" → "[NOME_REDACTED]"
   */
  redactName(name: string, mode?: RedactionMode): string {
    const effectiveMode = mode !== undefined ? mode : (this.config.names || this.config.mode);

    if (effectiveMode === "none" || !this.config.enabled) {
      return name;
    }

    if (effectiveMode === "complete") {
      return "[NOME_REDACTED]";
    }

    // Modo partial: mantém primeiro nome + inicial do sobrenome
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return name; // Nome único, não redacionar

    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0);

    return `${firstName} ${lastInitial}.`;
  }

  /**
   * Redaciona CPF
   *
   * Modos:
   * - none: "123.456.789-01" → "123.456.789-01"
   * - partial: "123.456.789-01" → "12*.***.*89-**"
   * - complete: "123.456.789-01" → "[CPF_REDACTED]"
   */
  redactCPF(cpf: string, mode?: RedactionMode): string {
    const effectiveMode = mode !== undefined ? mode : (this.config.cpf || this.config.mode);

    if (effectiveMode === "none" || !this.config.enabled) {
      return cpf;
    }

    if (effectiveMode === "complete") {
      return "[CPF_REDACTED]";
    }

    // Modo partial: mostra apenas os 2 primeiros e 2 dígitos do meio (posições 7-8)
    const digitsOnly = cpf.replace(/\D/g, "");
    if (digitsOnly.length !== 11) return cpf; // CPF inválido

    const first2 = digitsOnly.substring(0, 2);
    const middle2 = digitsOnly.substring(7, 9);

    return `${first2}*.***.*${middle2}-**`;
  }

  /**
   * Redaciona CNPJ
   *
   * Modos:
   * - none: "12.345.678/0001-90" → "12.345.678/0001-90"
   * - partial: "12.345.678/0001-90" → "12.***.678/****-**"
   * - complete: "12.345.678/0001-90" → "[CNPJ_REDACTED]"
   */
  redactCNPJ(cnpj: string, mode?: RedactionMode): string {
    const effectiveMode = mode !== undefined ? mode : (this.config.cnpj || this.config.mode);

    if (effectiveMode === "none" || !this.config.enabled) {
      return cnpj;
    }

    if (effectiveMode === "complete") {
      return "[CNPJ_REDACTED]";
    }

    // Modo partial: mostra apenas os 2 primeiros e 3 últimos dígitos antes do /
    const digitsOnly = cnpj.replace(/\D/g, "");
    if (digitsOnly.length !== 14) return cnpj; // CNPJ inválido

    const first2 = digitsOnly.substring(0, 2);
    const mid3 = digitsOnly.substring(5, 8);

    return `${first2}.***.${mid3}/****-**`;
  }

  /**
   * Redaciona telefone
   *
   * Modos:
   * - none: "(11) 98765-4321" → "(11) 98765-4321"
   * - partial: "(11) 98765-4321" → "(11) 9****-4321"
   * - complete: "(11) 98765-4321" → "[TELEFONE_REDACTED]"
   */
  redactTelefone(telefone: string, mode?: RedactionMode): string {
    const effectiveMode = mode || this.config.telefone || this.config.mode;

    if (effectiveMode === "none" || !this.config.enabled) {
      return telefone;
    }

    if (effectiveMode === "complete") {
      return "[TELEFONE_REDACTED]";
    }

    // Modo partial: mantém DDD e últimos 4 dígitos
    const digitsOnly = telefone.replace(/\D/g, "");
    if (digitsOnly.length < 10) return telefone; // Telefone inválido

    const ddd = digitsOnly.substring(0, 2);
    const last4 = digitsOnly.substring(digitsOnly.length - 4);

    return `(${ddd}) *****-${last4}`;
  }

  /**
   * Redaciona endereço
   *
   * Modos:
   * - none: "Rua das Flores, 123, Apto 45, São Paulo/SP" → texto completo
   * - partial: "Rua das Flores, 123, Apto 45, São Paulo/SP" → "Rua das Flores, ***, São Paulo/SP"
   * - complete: "Rua das Flores, 123, Apto 45, São Paulo/SP" → "[ENDERECO_REDACTED]"
   */
  redactEndereco(endereco: string, mode?: RedactionMode): string {
    const effectiveMode = mode !== undefined ? mode : (this.config.endereco || this.config.mode);

    if (effectiveMode === "none" || !this.config.enabled) {
      return endereco;
    }

    if (effectiveMode === "complete") {
      return "[ENDERECO_REDACTED]";
    }

    // Modo partial: remover números e complementos, manter rua e cidade
    return endereco
      .replace(/,?\s*\d+/g, ", ***") // Números
      .replace(/,?\s*apto?\s*\d+/gi, "") // Apartamento
      .replace(/,?\s*bloco?\s*[a-zA-Z0-9]+/gi, "") // Bloco
      .replace(/,\s*,/g, ",") // Vírgulas duplicadas
      .trim();
  }

  /**
   * Redaciona email
   *
   * Modos:
   * - none: "joao.silva@empresa.com.br" → "joao.silva@empresa.com.br"
   * - partial: "joao.silva@empresa.com.br" → "j***@empresa.com.br"
   * - complete: "joao.silva@empresa.com.br" → "[EMAIL_REDACTED]"
   */
  redactEmail(email: string, mode?: RedactionMode): string {
    const effectiveMode = mode !== undefined ? mode : (this.config.email || this.config.mode);

    if (effectiveMode === "none" || !this.config.enabled) {
      return email;
    }

    if (effectiveMode === "complete") {
      return "[EMAIL_REDACTED]";
    }

    // Modo partial: mostra apenas primeira letra do user e domínio completo
    const [user, domain] = email.split("@");
    if (!domain) return email; // Email inválido

    const firstChar = user.charAt(0);
    return `${firstChar}***@${domain}`;
  }

  /**
   * Aplica redação em texto livre
   *
   * Detecta automaticamente e redaciona: CPF, CNPJ, telefones, emails
   * Nomes devem ser redacionados explicitamente com redactName()
   */
  redactText(text: string): RedactionResult {
    if (!this.config.enabled) {
      return {
        originalText: text,
        redactedText: text,
        redactionsApplied: [],
      };
    }

    let redacted = text;
    const redactionsApplied: RedactionResult["redactionsApplied"] = [];

    // CPF: 123.456.789-01 ou 12345678901
    const cpfPattern = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
    const cpfMatches = text.match(cpfPattern);
    if (cpfMatches && cpfMatches.length > 0) {
      const cpfMode = this.config.cpf || this.config.mode;
      cpfMatches.forEach((cpf) => {
        redacted = redacted.replace(cpf, this.redactCPF(cpf, cpfMode));
      });
      redactionsApplied.push({
        type: "CPF",
        count: cpfMatches.length,
        mode: cpfMode,
      });
    }

    // CNPJ: 12.345.678/0001-90 ou 12345678000190
    const cnpjPattern = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
    const cnpjMatches = text.match(cnpjPattern);
    if (cnpjMatches && cnpjMatches.length > 0) {
      const cnpjMode = this.config.cnpj || this.config.mode;
      cnpjMatches.forEach((cnpj) => {
        redacted = redacted.replace(cnpj, this.redactCNPJ(cnpj, cnpjMode));
      });
      redactionsApplied.push({
        type: "CNPJ",
        count: cnpjMatches.length,
        mode: cnpjMode,
      });
    }

    // Email
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatches = text.match(emailPattern);
    if (emailMatches && emailMatches.length > 0) {
      const emailMode = this.config.email || this.config.mode;
      emailMatches.forEach((email) => {
        redacted = redacted.replace(email, this.redactEmail(email, emailMode));
      });
      redactionsApplied.push({
        type: "Email",
        count: emailMatches.length,
        mode: emailMode,
      });
    }

    // Telefone: (11) 98765-4321, +55 11 98765-4321
    const telefonePattern = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g;
    const telefoneMatches = text.match(telefonePattern);
    if (telefoneMatches && telefoneMatches.length > 0) {
      const telefoneMode = this.config.telefone || this.config.mode;
      telefoneMatches.forEach((tel) => {
        // Evitar redacionar números de processo (formato similar)
        if (tel.includes(".") || tel.length > 15) return;
        redacted = redacted.replace(tel, this.redactTelefone(tel, telefoneMode));
      });
      redactionsApplied.push({
        type: "Telefone",
        count: telefoneMatches.length,
        mode: telefoneMode,
      });
    }

    return {
      originalText: text,
      redactedText: redacted,
      redactionsApplied,
    };
  }

  /**
   * Redaciona objeto recursivamente
   *
   * Útil para sanitizar objetos JSON antes de salvar ou enviar
   */
  redactObject<T extends Record<string, unknown>>(obj: T): T {
    if (!this.config.enabled) {
      return obj;
    }

    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        // Aplicar redação em strings
        const result = this.redactText(value);
        redacted[key] = result.redactedText;
      } else if (Array.isArray(value)) {
        // Redacionar arrays
        redacted[key] = value.map((item) =>
          typeof item === "string"
            ? this.redactText(item).redactedText
            : typeof item === "object" && item !== null
              ? this.redactObject(item as Record<string, unknown>)
              : item
        );
      } else if (typeof value === "object" && value !== null) {
        // Redacionar objetos aninhados
        redacted[key] = this.redactObject(value as Record<string, unknown>);
      } else {
        // Manter outros tipos (number, boolean, null, undefined)
        redacted[key] = value;
      }
    }

    return redacted as T;
  }
}

// Singleton instance com configuração padrão
export const redactionService = new RedactionService();

// Factory para criar instância customizada
export function createRedactionService(config: Partial<RedactionConfig>): RedactionService {
  return new RedactionService(config);
}
