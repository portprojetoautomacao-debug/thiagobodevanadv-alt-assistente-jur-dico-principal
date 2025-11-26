import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- DJEN CLIENT (INLINE) ---

interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  tipoDocumento: string;
  nomeClasse: string;
  codigoClasse: string;
  numeroComunicacao: number;
  ativo: boolean;
  hash: string;
  datadisponibilizacao: string;
  meiocompleto: string;
  numeroprocessocommascara: string;
  destinatarios: Array<{
    nome: string;
    polo: string;
    comunicacao_id: number;
  }>;
  destinatarioadvogados: Array<{
    id: number;
    comunicacao_id: number;
    advogado_id: number;
    created_at: string;
    updated_at: string;
    advogado: {
      id: number;
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

interface DJENFilteredResult {
  id: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso: string;
  orgao: string;
  meio: string;
  link: string;
  hash: string;
  matchType: 'nome' | 'oab' | 'ambos';
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}

interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: 'E' | 'D';
}

const DJEN_TIMEOUT = 30000;
const DJEN_DELAY = 1000;

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {};
  const value = numeroOAB.trim();
  const matchOABPattern = value.match(/OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i);
  if (matchOABPattern) return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  const matchNumericUF = value.match(/(\d+)\s*\/\s*([A-Z]{2})/i);
  if (matchNumericUF) return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  const matchNumeric = value.match(/^(\d+)$/);
  if (matchNumeric) return { numero: matchNumeric[1] };
  return {};
}

function buildDJENQueryString(params: DJENQueryParams): string {
  const queryParams: string[] = [];
  if (params.numeroOab) queryParams.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`);
  if (params.ufOab) queryParams.push(`ufOab=${encodeURIComponent(params.ufOab)}`);
  if (params.nomeAdvogado) queryParams.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`);
  if (params.dataDisponibilizacaoInicio) queryParams.push(`dataDisponibilizacaoInicio=${params.dataDisponibilizacaoInicio}`);
  if (params.dataDisponibilizacaoFim) queryParams.push(`dataDisponibilizacaoFim=${params.dataDisponibilizacaoFim}`);
  if (params.siglaTribunal) queryParams.push(`siglaTribunal=${encodeURIComponent(params.siglaTribunal)}`);
  if (params.pagina) queryParams.push(`pagina=${params.pagina}`);
  if (params.itensPorPagina) queryParams.push(`itensPorPagina=${params.itensPorPagina}`);
  if (params.meio) queryParams.push(`meio=${params.meio}`);
  return queryParams.join('&');
}

async function consultarComunicacoes(params: DJENQueryParams): Promise<{ response: DJENResponse | null; rateLimitInfo: { limit?: number; remaining?: number } }> {
  const queryString = buildDJENQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' }, signal: controller.signal });
    clearTimeout(timeoutId);
    const rateLimitInfo = {
      limit: response.headers.get('x-ratelimit-limit') ? parseInt(response.headers.get('x-ratelimit-limit')!) : undefined,
      remaining: response.headers.get('x-ratelimit-remaining') ? parseInt(response.headers.get('x-ratelimit-remaining')!) : undefined
    };
    if (response.status === 429) return { response: null, rateLimitInfo };
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as DJENResponse;
    return { response: data, rateLimitInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error:`, error);
    return { response: null, rateLimitInfo: {} };
  }
}

function formatDJENDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function consultarDJENForLawyer(tribunais: string[], nomeAdvogado?: string, numeroOAB?: string, dataInicio?: string, dataFim?: string, meio?: 'D' | 'E'): Promise<{ resultados: DJENFilteredResult[]; erros: Array<{ tribunal: string; erro: string }>; rateLimitWarning?: boolean }> {
  if (!nomeAdvogado && !numeroOAB) throw new Error('É necessário fornecer pelo menos nomeAdvogado ou numeroOAB');
  
  const defaultDate = formatDJENDate(new Date());
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || queryDataInicio;
  
  let numeroOabNumerico: string | undefined;
  let ufOab: string | undefined;
  if (numeroOAB) {
    const parsed = parseOAB(numeroOAB);
    numeroOabNumerico = parsed.numero;
    ufOab = parsed.uf;
  }

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for (const tribunal of tribunais) {
    try {
      const queryParams: DJENQueryParams = {
        siglaTribunal: tribunal,
        dataDisponibilizacaoInicio: queryDataInicio,
        dataDisponibilizacaoFim: queryDataFim,
        itensPorPagina: 100,
        pagina: 1
      };
      if (nomeAdvogado) queryParams.nomeAdvogado = nomeAdvogado;
      if (numeroOabNumerico) queryParams.numeroOab = numeroOabNumerico;
      if (ufOab) queryParams.ufOab = ufOab;
      if (meio) queryParams.meio = meio;

      const { response, rateLimitInfo } = await consultarComunicacoes(queryParams);
      if (!response) {
        rateLimitWarning = true;
        erros.push({ tribunal, erro: 'Rate limit ou erro na consulta' });
        continue;
      }

      for (const comunicacao of response.items) {
        let matchType: 'nome' | 'oab' | 'ambos' = 'nome';
        const temAdvogado = comunicacao.destinatarioadvogados?.some(dest => {
          const matchNome = nomeAdvogado ? normalizeText(dest.advogado.nome).includes(normalizeText(nomeAdvogado)) : false;
          const matchOab = numeroOabNumerico ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab : false;
          if (matchNome && matchOab) { matchType = 'ambos'; return true; }
          if (matchOab) { matchType = 'oab'; return true; }
          if (matchNome) { matchType = 'nome'; return true; }
          return false;
        }) || false;

        if (temAdvogado) {
          resultados.push({
            id: comunicacao.id,
            tribunal: comunicacao.siglaTribunal,
            data: comunicacao.data_disponibilizacao,
            tipo: comunicacao.tipoComunicacao,
            teor: comunicacao.texto,
            numeroProcesso: comunicacao.numero_processo,
            orgao: comunicacao.nomeOrgao,
            meio: comunicacao.meiocompleto || comunicacao.meio,
            link: comunicacao.link,
            hash: comunicacao.hash,
            matchType,
            advogados: comunicacao.destinatarioadvogados?.map(dest => ({ nome: dest.advogado.nome, numero_oab: dest.advogado.numero_oab, uf_oab: dest.advogado.uf_oab })) || []
          });
        }
      }

      if (tribunais.indexOf(tribunal) < tribunais.length - 1) await new Promise(resolve => setTimeout(resolve, DJEN_DELAY));
    } catch (error) {
      erros.push({ tribunal, erro: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  }

  return { resultados, erros, rateLimitWarning: rateLimitWarning ? true : undefined };
}

// --- DEADLINE CALCULATION LOGIC ---

// Feriados nacionais fixos
const feriadosNacionais2025 = [
  '2025-01-01', // Ano Novo
  '2025-04-18', // Sexta-feira Santa
  '2025-04-21', // Tiradentes
  '2025-05-01', // Dia do Trabalho
  '2025-06-19', // Corpus Christi
  '2025-09-07', // Independência
  '2025-10-12', // Nossa Senhora Aparecida
  '2025-11-02', // Finados
  '2025-11-15', // Proclamação da República
  '2025-11-20', // Consciência Negra
  '2025-12-25', // Natal
];

const feriadosDF2025 = [
  '2025-04-21', // Fundação de Brasília
  '2025-11-30', // Dia do Evangélico
];

// Recesso forense (CNJ Resolução 298/2019)
const recessoForense2025 = {
  start: '2025-12-20',
  end: '2026-01-06',
};

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Domingo ou Sábado
}

function isFeriado(date: Date, tribunalCode?: string): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  // Feriados nacionais
  if (feriadosNacionais2025.includes(dateStr)) {
    return true;
  }
  
  // Feriados específicos por tribunal
  if (tribunalCode?.includes('DF') || tribunalCode?.includes('TJDFT')) {
    if (feriadosDF2025.includes(dateStr)) {
      return true;
    }
  }
  
  return false;
}

function isRecessoForense(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return dateStr >= recessoForense2025.start && dateStr <= recessoForense2025.end;
}

function isDiaUtil(date: Date, tribunalCode?: string): boolean {
  if (isWeekend(date)) return false;
  if (isFeriado(date, tribunalCode)) return false;
  if (isRecessoForense(date)) return false;
  return true;
}

function calcularPrazo(
  startDate: Date,
  businessDays: number,
  tribunalCode?: string
): {
  deadline: string;
  businessDays: number;
  calendarDays: number;
  reasoning: string[];
  holidays: string[];
  alerts: Array<{ type: string; days: number; message: string }>;
} {
  const reasoning: string[] = [];
  const holidays: string[] = [];
  const currentDate = new Date(startDate);
  let daysAdded = 0;
  let calendarDays = 0;

  reasoning.push(`Data inicial: ${currentDate.toLocaleDateString('pt-BR')}`);
  reasoning.push(`Dias úteis a contar: ${businessDays}`);

  while (daysAdded < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    calendarDays++;

    if (isDiaUtil(currentDate, tribunalCode)) {
      daysAdded++;
    } else {
      const reason = isWeekend(currentDate)
        ? 'Final de semana'
        : isFeriado(currentDate, tribunalCode)
        ? 'Feriado'
        : 'Recesso forense';
      
      holidays.push(`${currentDate.toLocaleDateString('pt-BR')} - ${reason}`);
      reasoning.push(`Dia ${currentDate.toLocaleDateString('pt-BR')} desconsiderado (${reason})`);
    }
  }

  reasoning.push(`Total de dias corridos: ${calendarDays}`);
  reasoning.push(`Vencimento: ${currentDate.toLocaleDateString('pt-BR')}`);

  return {
    deadline: currentDate.toISOString(),
    businessDays,
    calendarDays,
    reasoning,
    holidays,
    alerts: [
      {
        type: 'warning',
        days: 3,
        message: 'Prazo se aproximando - verificar providências',
      },
      {
        type: 'critical',
        days: 1,
        message: 'URGENTE: Último dia para protocolo',
      },
    ],
  };
}

// --- DJEN CHECK LOGIC ---

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

async function handleDJENCheck(req: VercelRequest, res: VercelResponse) {
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
        id: comunicacao.id ? String(comunicacao.id) : crypto.randomUUID(),
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

async function handleDeadlineCalculation(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      startDate,
      businessDays = 15,
      tribunalCode,
    } = req.body as {
      startDate: string;
      businessDays?: number;
      tribunalCode?: string;
    };

    if (!startDate) {
      return res.status(400).json({
        error: 'Missing required field: startDate',
      });
    }

    const start = new Date(startDate);
    
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        error: 'Invalid startDate format',
      });
    }

    const result = calcularPrazo(start, businessDays, tribunalCode);

    return res.status(200).json({
      ok: true,
      ...result,
      metadata: {
        tribunalCode: tribunalCode || 'Nacional',
        calculatedAt: new Date().toISOString(),
        recessoForense: isRecessoForense(new Date(result.deadline))
          ? 'Vencimento durante recesso forense'
          : null,
      },
    });

  } catch (error) {
    console.error('[Deadline Calculate API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// --- MAIN HANDLER ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const service = req.query.service as string;

  if (service === 'djen') {
    return handleDJENCheck(req, res);
  }

  if (service === 'deadline') {
    return handleDeadlineCalculation(req, res);
  }

  return res.status(400).json({ error: 'Invalid service specified. Use ?service=djen or ?service=deadline' });
}
