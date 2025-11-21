/**
 * Endpoint para verificar DJEN em tempo real
 * Usa API oficial Comunica PJe (CNJ)
 * 
 * Path: /api/djen/check
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { consultarDJENForLawyer } from '../../lib/api/djen-client';

interface DJENCheckRequest {
  tribunais?: string[];
  oab?: string;
  ufOab?: string;
  lawyerName?: string;
}

interface DJENResult {
  tribunal: string;
  publicacoes: Array<{
    id: string;
    data: string;
    processo?: string;
    tipo: string;
    conteudo: string;
    advogado?: string;
    link?: string;
  }>;
  erro?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      tribunais = ['TJMG', 'TRT3', 'TST', 'STJ'],
      oab = '184404',
      ufOab = 'MG',
      lawyerName = 'Thiago Bodevan Veiga'
    } = req.body as DJENCheckRequest;

    console.log(`[DJEN Check] Consultando DJEN para ${lawyerName} (OAB ${oab}/${ufOab}) em ${tribunais.length} tribunais`);

    // Usar API real do DJEN (Comunica PJe)
    const { resultados, erros, rateLimitWarning } = await consultarDJENForLawyer(
      tribunais,
      lawyerName,
      `${oab}/${ufOab}`,
      undefined, // dataInicio (padrão: hoje)
      undefined, // dataFim (padrão: dataInicio)
      'D' // Diário Eletrônico
    );

    console.log(`[DJEN Check] Encontradas ${resultados.length} comunicações`);

    // Transformar resultados para formato esperado
    const resultadosFormatados: DJENResult[] = [];
    const tribunaisMap = new Map<string, DJENResult>();

    // Agrupar por tribunal
    for (const comunicacao of resultados) {
      if (!tribunaisMap.has(comunicacao.tribunal)) {
        tribunaisMap.set(comunicacao.tribunal, {
          tribunal: comunicacao.tribunal,
          publicacoes: []
        });
      }

      const tribunalResult = tribunaisMap.get(comunicacao.tribunal)!;
      tribunalResult.publicacoes.push({
        id: String(comunicacao.id),
        data: comunicacao.data,
        processo: comunicacao.numeroProcesso,
        tipo: comunicacao.tipo,
        conteudo: comunicacao.teor || 'Ver documento completo',
        advogado: comunicacao.advogados?.join(', '),
        link: comunicacao.link
      });
    }

    // Converter mapa para array
    resultadosFormatados.push(...tribunaisMap.values());

    // Adicionar tribunais sem publicações
    for (const tribunal of tribunais) {
      if (!tribunaisMap.has(tribunal)) {
        resultadosFormatados.push({
          tribunal,
          publicacoes: []
        });
      }
    }

    // Adicionar erros
    const errosFormatados = erros.map(e => ({
      tribunal: e.tribunal,
      erro: e.erro
    }));

    const publicacoesEncontradas = resultados.length;

    return res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      tribunaisConsultados: tribunais.length,
      publicacoesEncontradas,
      resultados: resultadosFormatados,
      erros: errosFormatados.length > 0 ? errosFormatados : undefined,
      rateLimitWarning,
      apiUsed: 'Comunica PJe (API Oficial CNJ)',
      endpoint: 'https://comunicaapi.pje.jus.br/api/v1/comunicacao',
      lawyer: {
        name: lawyerName,
        oab: `${oab}/${ufOab}`
      }
    });

  } catch (error) {
    console.error('[DJEN Check API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
