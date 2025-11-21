/**
 * DJEN API Client for Serverless Functions
 * 
 * API do Comunica PJe (DJEN) - Consulta de publicações do Diário de Justiça Eletrônico Nacional
 * Endpoint: https://comunicaapi.pje.jus.br/api/v1/comunicacao
 * 
 * Documentação oficial: https://comunicaapi.pje.jus.br/swagger/index.html
 * Versão: 1.0.3 (atualizada em 29/05/2025)
 * 
 * IMPORTANTE: Esta é a API do DJEN (publicações oficiais), diferente da API DataJud (metadados processuais)
 * 
 * Rate Limiting:
 * - Cabeçalhos de controle: x-ratelimit-limit, x-ratelimit-remaining
 * - Erro 429: aguardar 1 minuto antes de retomar
 * - Uso de múltiplos IPs para contornar limite é considerado abuso
 * 
 * Limites de consulta (10000 resultados máximo):
 * - Pesquisas com campos textuais ou OAB
 * - Pesquisas com 5 ou menos itensPorPagina
 * - Pesquisas com dataInicio != dataFim
 * - Pesquisas com numeroProcesso
 */

export interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string; // "E" para Edital, "D" para Diário Eletrônico
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

export interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

export interface DJENFilteredResult {
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
  nomeParte?: string;
  numeroProcesso?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  siglaTribunal?: string;
  numeroComunicacao?: number;
  pagina?: number;
  itensPorPagina?: number; // 5 ou 100
  meio?: 'E' | 'D'; // E = Edital, D = Diário
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;
const RATE_LIMIT_RETRY_DELAY = 60000; // 1 minuto conforme documentação

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function extractUFFromOAB(numeroOAB: string): string | undefined {
  const match = numeroOAB.match(/OAB\/([A-Z]{2})/i);
  return match ? match[1].toUpperCase() : undefined;
}

function extractNumeroFromOAB(numeroOAB: string): string | undefined {
  const match = numeroOAB.match(/OAB\/[A-Z]{2}\s*(\d+)/i);
  return match ? match[1] : undefined;
}

function buildQueryString(params: DJENQueryParams): string {
  const queryParams: string[] = [];
  
  if (params.numeroOab) queryParams.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`);
  if (params.ufOab) queryParams.push(`ufOab=${encodeURIComponent(params.ufOab)}`);
  if (params.nomeAdvogado) queryParams.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`);
  if (params.nomeParte) queryParams.push(`nomeParte=${encodeURIComponent(params.nomeParte)}`);
  if (params.numeroProcesso) queryParams.push(`numeroProcesso=${encodeURIComponent(params.numeroProcesso)}`);
  if (params.dataDisponibilizacaoInicio) queryParams.push(`dataDisponibilizacaoInicio=${params.dataDisponibilizacaoInicio}`);
  if (params.dataDisponibilizacaoFim) queryParams.push(`dataDisponibilizacaoFim=${params.dataDisponibilizacaoFim}`);
  if (params.siglaTribunal) queryParams.push(`siglaTribunal=${encodeURIComponent(params.siglaTribunal)}`);
  if (params.numeroComunicacao) queryParams.push(`numeroComunicacao=${params.numeroComunicacao}`);
  if (params.pagina) queryParams.push(`pagina=${params.pagina}`);
  if (params.itensPorPagina) queryParams.push(`itensPorPagina=${params.itensPorPagina}`);
  if (params.meio) queryParams.push(`meio=${params.meio}`);
  
  return queryParams.join('&');
}

/**
 * Consulta comunicações no DJEN (Diário de Justiça Eletrônico Nacional)
 * API do Comunica PJe - CNJ
 * 
 * Endpoint: GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
 * 
 * IMPORTANTE:
 * - Não requer autenticação
 * - Requer pelo menos um dos parâmetros: siglaTribunal, texto, nomeParte, nomeAdvogado, numeroOab, numeroProcesso
 * - Ou limitado a 5 itensPorPagina
 * - Respeita rate limiting (x-ratelimit-limit, x-ratelimit-remaining)
 * - Data no formato AAAA-MM-DD
 */
async function consultarComunicacoes(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<{ response: DJENResponse | null; rateLimitInfo: { limit?: number; remaining?: number } }> {
  const queryString = buildQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Extrair informações de rate limiting
    const rateLimitInfo = {
      limit: response.headers.get('x-ratelimit-limit') 
        ? parseInt(response.headers.get('x-ratelimit-limit')!) 
        : undefined,
      remaining: response.headers.get('x-ratelimit-remaining')
        ? parseInt(response.headers.get('x-ratelimit-remaining')!)
        : undefined
    };

    // Handle rate limiting
    if (response.status === 429) {
      console.warn(`[DJEN] Rate limit exceeded. Aguarde 1 minuto antes de nova requisição.`);
      return { response: null, rateLimitInfo };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn(`[DJEN] Resposta não é JSON`);
      return { response: null, rateLimitInfo };
    }

    const data = await response.json() as DJENResponse;
    
    console.log(`[DJEN] Consulta retornou ${data.count} comunicações. Rate limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit}`);
    
    return { response: data, rateLimitInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error querying comunicacoes:`, error);
    return { response: null, rateLimitInfo: {} };
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Consulta comunicações DJEN para um advogado específico
 * Usa a API oficial /api/v1/comunicacao com filtros adequados
 * 
 * @param tribunais - Array de siglas de tribunais (ex: ['TJMG', 'TRT3', 'STJ'])
 * @param nomeAdvogado - Nome completo do advogado
 * @param numeroOAB - Número da OAB no formato "OAB/UF 123456" ou apenas número
 * @param dataInicio - Data inicial no formato AAAA-MM-DD (opcional, padrão: hoje)
 * @param dataFim - Data final no formato AAAA-MM-DD (opcional, padrão: dataInicio)
 * @param meio - 'D' para Diário, 'E' para Edital (opcional)
 * @returns Resultados filtrados e erros encontrados
 */
export async function consultarDJENForLawyer(
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string,
  meio?: 'D' | 'E'
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}> {
  if (!nomeAdvogado && !numeroOAB) {
    throw new Error('É necessário fornecer pelo menos nomeAdvogado ou numeroOAB');
  }

  const defaultDate = formatDate(new Date());
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || queryDataInicio; // Usar mesma data se não especificado
  
  let numeroOabNumerico: string | undefined;
  let ufOab: string | undefined;
  
  if (numeroOAB) {
    ufOab = extractUFFromOAB(numeroOAB);
    numeroOabNumerico = extractNumeroFromOAB(numeroOAB);
  }

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  // Processar tribunais sequencialmente para respeitar rate limiting
  for (const tribunal of tribunais) {
    try {
      console.log(`[DJEN] Consultando ${tribunal} para ${nomeAdvogado || numeroOAB}`);
      
      // Montar parâmetros de consulta
      const queryParams: DJENQueryParams = {
        siglaTribunal: tribunal,
        dataDisponibilizacaoInicio: queryDataInicio,
        dataDisponibilizacaoFim: queryDataFim,
        itensPorPagina: 100, // Máximo permitido
        pagina: 1
      };

      // Adicionar filtros opcionais
      if (nomeAdvogado) {
        queryParams.nomeAdvogado = nomeAdvogado;
      }
      
      if (numeroOabNumerico) {
        queryParams.numeroOab = numeroOabNumerico;
      }
      
      if (ufOab) {
        queryParams.ufOab = ufOab;
      }
      
      if (meio) {
        queryParams.meio = meio;
      }

      const { response, rateLimitInfo } = await consultarComunicacoes(queryParams, DEFAULT_TIMEOUT);

      // Verificar rate limiting
      if (!response) {
        rateLimitWarning = true;
        console.warn(`[DJEN] Rate limit atingido ou erro na consulta de ${tribunal}`);
        erros.push({ 
          tribunal, 
          erro: 'Rate limit excedido. Aguarde 1 minuto antes de nova tentativa.' 
        });
        
        // Aguardar 1 minuto conforme documentação
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY));
        continue;
      }

      // Processar comunicações encontradas
      for (const comunicacao of response.items) {
        // Determinar tipo de match
        let matchType: 'nome' | 'oab' | 'ambos' = 'nome';
        
        const temAdvogado = comunicacao.destinatarioadvogados.some(dest => {
          const matchNome = nomeAdvogado 
            ? normalizeText(dest.advogado.nome).includes(normalizeText(nomeAdvogado))
            : false;
          const matchOab = numeroOabNumerico
            ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab
            : false;
          
          if (matchNome && matchOab) {
            matchType = 'ambos';
            return true;
          } else if (matchOab) {
            matchType = 'oab';
            return true;
          } else if (matchNome) {
            matchType = 'nome';
            return true;
          }
          return false;
        });

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
            advogados: comunicacao.destinatarioadvogados.map(dest => ({
              nome: dest.advogado.nome,
              numero_oab: dest.advogado.numero_oab,
              uf_oab: dest.advogado.uf_oab
            }))
          });
        }
      }

      // Log de rate limiting
      if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining < 10) {
        console.warn(`[DJEN] Rate limit baixo: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} requisições restantes`);
      }

      // Delay entre tribunais para respeitar rate limiting
      if (tribunais.indexOf(tribunal) < tribunais.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY));
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      erros.push({ tribunal, erro: errorMessage });
      console.error(`[DJEN] Erro consultando ${tribunal}:`, errorMessage);
    }
  }

  console.log(`[DJEN] Consulta finalizada: ${resultados.length} comunicações encontradas em ${tribunais.length} tribunais`);

  return { 
    resultados, 
    erros,
    rateLimitWarning: rateLimitWarning ? true : undefined
  };
}

/**
 * Download de caderno completo do DJEN (arquivo compactado)
 * Endpoint: GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio}
 * 
 * ATENÇÃO: Este endpoint retorna metadados e URL temporária (5 minutos) para download
 * Os cadernos do dia atual são disponibilizados a partir das 02:00
 * 
 * @param siglaTribunal - Sigla do tribunal (ex: 'TJMG', 'TRT3')
 * @param data - Data no formato AAAA-MM-DD
 * @param meio - 'E' para Edital, 'D' para Diário Eletrônico
 */
export async function downloadCadernoDJEN(
  siglaTribunal: string,
  data: string,
  meio: 'E' | 'D' = 'D'
): Promise<{
  tribunal: string;
  sigla_tribunal: string;
  meio: string;
  status: string;
  versao: string;
  data: string;
  total_comunicacoes: number;
  numero_paginas: number;
  hash: string;
  url: string; // URL temporária válida por 5 minutos
} | null> {
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${siglaTribunal}/${data}/${meio}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[DJEN] Erro ao baixar caderno: HTTP ${response.status}`);
      return null;
    }

    const caderno = await response.json();
    console.log(`[DJEN] Caderno disponível: ${caderno.total_comunicacoes} comunicações, ${caderno.numero_paginas} páginas`);
    
    return caderno;
  } catch (error) {
    console.error(`[DJEN] Erro ao baixar caderno:`, error);
    return null;
  }
}
