export function getRelativeDateDescription(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Agora mesmo";
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString("pt-BR");
}

/**
 * Valida componentes numéricos de uma data no formato DD/MM/YYYY
 */
export function validateDateComponents(day: number, month: number, year: number): boolean {
  return (
    !Number.isNaN(day) &&
    !Number.isNaN(month) &&
    !Number.isNaN(year) &&
    day >= 1 &&
    day <= 31 &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000
  );
}

/**
 * Parseia data no formato brasileiro DD/MM/YYYY para Date
 * Retorna null se formato inválido
 */
export function parseBrazilianDate(dateStr: string): Date | null {
  const parts = dateStr.split("/").map((p) => p.trim());
  if (parts.length !== 3) {
    return null;
  }

  const [day, month, year] = parts;
  const dayNum = Number.parseInt(day, 10);
  const monthNum = Number.parseInt(month, 10);
  const yearNum = Number.parseInt(year, 10);

  if (!validateDateComponents(dayNum, monthNum, yearNum)) {
    return null;
  }

  // Criar data em UTC para evitar problemas de timezone
  return new Date(Date.UTC(yearNum, monthNum - 1, dayNum, 12, 0, 0));
}

/**
 * Converte string de data para objeto Date
 * Suporta formato brasileiro (DD/MM/YYYY) e ISO
 */
export function parseDeadlineDate(endDate: string): Date | null {
  if (endDate.includes("/")) {
    return parseBrazilianDate(endDate);
  }

  const date = new Date(endDate);
  return Number.isNaN(date.getTime()) ? null : date;
}
