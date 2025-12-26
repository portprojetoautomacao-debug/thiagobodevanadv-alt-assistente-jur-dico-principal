import type { Expediente } from "@/types";

/**
 * Type guard para validar se um valor desconhecido é um array de Expedientes
 *
 * @param data - Valor a ser validado
 * @returns true se data é Expediente[], false caso contrário
 *
 * @example
 * ```typescript
 * const data: unknown = await fetchData();
 * if (isExpedienteArray(data)) {
 *   // TypeScript sabe que data é Expediente[]
 *   data.forEach(exp => console.log(exp.id));
 * }
 * ```
 */
export function isExpedienteArray ( data: unknown ): data is Expediente[]
{
  return (
    Array.isArray( data ) &&
    data.length > 0 &&
    typeof data[ 0 ] === "object" &&
    data[ 0 ] !== null &&
    "id" in data[ 0 ]
  );
}
