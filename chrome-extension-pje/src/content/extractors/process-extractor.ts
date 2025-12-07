/**
 * Extrator de processos do painel PJe
 */

import { PJE_SELECTORS } from '../../shared/constants';
import { ProcessoPJe } from '../../shared/types';
import { cleanProcessNumber, formatCNJ, isValidCNJ, parseDate } from '../../shared/utils';

export class ProcessExtractor {
  /**
   * Extrai todos os processos visíveis no painel
   */
  public extractProcessos(): ProcessoPJe[] {
    const processos: ProcessoPJe[] = [];
    const rows = document.querySelectorAll(PJE_SELECTORS.PROCESSO_ROW);
    
    console.log(`[ProcessExtractor] Encontradas ${rows.length} linhas de processo`);
    
    rows.forEach((row, index) => {
      try {
        const processo = this.extractProcessoFromRow(row as HTMLElement);
        if (processo && isValidCNJ(processo.numero)) {
          processos.push(processo);
        } else if (processo) {
          console.warn(`[ProcessExtractor] Processo inválido na linha ${index}:`, processo.numero);
        }
      } catch (error) {
        console.error(`[ProcessExtractor] Erro na linha ${index}:`, error);
      }
    });
    
    console.log(`[ProcessExtractor] ${processos.length} processos válidos extraídos`);
    return processos;
  }

  private extractProcessoFromRow(row: HTMLElement): ProcessoPJe | null {
    // Número do processo
    const numeroEl = row.querySelector(PJE_SELECTORS.NUMERO_PROCESSO);
    const numeroTexto = numeroEl?.textContent?.trim() || '';
    
    if (!numeroTexto) {
      return null;
    }

    const numero = cleanProcessNumber(numeroTexto);
    const numeroFormatado = formatCNJ(numeroTexto);

    // Classe e assunto
    const classeEl = row.querySelector(PJE_SELECTORS.CLASSE);
    const classe = classeEl?.textContent?.trim() || '';

    const assuntoEl = row.querySelector(PJE_SELECTORS.ASSUNTO);
    const assunto = assuntoEl?.textContent?.trim() || '';

    // Partes
    const parteAutorEl = row.querySelector(PJE_SELECTORS.PARTE_AUTOR);
    const parteReuEl = row.querySelector(PJE_SELECTORS.PARTE_REU);
    
    let parteAutor = parteAutorEl?.textContent?.trim() || '';
    let parteReu = parteReuEl?.textContent?.trim() || '';

    // Se não encontrou partes separadas, tenta extrair do formato "AUTOR X RÉU"
    if (!parteAutor && !parteReu) {
      const partesText = row.textContent || '';
      const match = partesText.match(/([A-Z\s]+)\s+X\s+([A-Z\s]+)/);
      if (match) {
        parteAutor = match[1].trim();
        parteReu = match[2].trim();
      }
    }

    // Vara e comarca
    const varaEl = row.querySelector(PJE_SELECTORS.VARA);
    const vara = varaEl?.textContent?.trim() || '';
    
    const comarcaMatch = vara.match(/Comarca de (.+?)(?:\s|$)/i);
    const comarca = comarcaMatch ? comarcaMatch[1].trim() : '';

    // Último movimento
    const movimentoEl = row.querySelector(PJE_SELECTORS.MOVIMENTO);
    const movimentoDescricao = movimentoEl?.textContent?.trim() || '';

    const dataEl = row.querySelector(PJE_SELECTORS.DATA);
    const dataTexto = dataEl?.textContent?.trim() || '';
    const dataMovimento = parseDate(dataTexto);

    // Situação
    const situacaoEl = row.querySelector(PJE_SELECTORS.SITUACAO);
    const situacaoTexto = situacaoEl?.textContent?.trim().toLowerCase() || '';
    
    const situacao = situacaoTexto.includes('baixado') ? 'baixado' as const
                   : situacaoTexto.includes('arquivado') ? 'arquivado' as const
                   : 'ativo' as const;

    // Valor da causa (se disponível)
    const valorEl = row.querySelector('.valor-causa, [data-valor]');
    const valor = valorEl?.textContent?.trim();

    return {
      numero,
      numeroFormatado,
      classe,
      assunto,
      parteAutor,
      parteReu,
      vara,
      comarca,
      ultimoMovimento: {
        descricao: movimentoDescricao,
        data: dataTexto,
        timestamp: dataMovimento.getTime()
      },
      situacao,
      valor,
      distribuicao: dataTexto
    };
  }
}
