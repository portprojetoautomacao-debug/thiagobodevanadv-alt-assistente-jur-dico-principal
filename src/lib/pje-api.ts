/**
 * PJe Direct API Integration
 * 
 * Official CNJ PJe (Processo Judicial Eletrônico) API for direct access to court data
 * Documentation: https://docs.pje.jus.br/manuais-basicos/padroes-de-api-do-pje/
 * 
 * This provides direct access to court systems using PJe, which includes:
 * - Process information
 * - Movements and updates
 * - Documents
 * - Publications and notifications
 */

import type { 
  UnifiedPublication, 
  PublicationSearchParams,
  PublicationSourceConfig 
} from './publication-sources-types'

export interface PJeConfig extends PublicationSourceConfig {
  source: 'pje_direct'
  tribunalUrl?: string
  username?: string
  password?: string
}

export interface PJeProcesso {
  numeroProcesso: string
  classe?: string
  assunto?: string
  orgaoJulgador?: string
  dataAjuizamento?: string
  valor?: number
  partes?: Array<{
    tipo: string
    nome: string
    cpfCnpj?: string
  }>
  advogados?: Array<{
    nome: string
    oab: string
  }>
  movimentos?: Array<{
    data: string
    codigo: string
    descricao: string
    observacao?: string
  }>
}

export interface PJePublicacao {
  id: string
  numeroProcesso: string
  tipo: string
  data: string
  conteudo: string
  destinatarios?: string[]
  advogados?: string[]
}

const PJE_TRIBUNAL_URLS: Record<string, string> = {
  'trf1': 'https://pje1g.trf1.jus.br/pje',
  'trf2': 'https://pje2.trf2.jus.br/pje',
  'trf3': 'https://pje1g.trf3.jus.br/pje',
  'trf4': 'https://pje2g.trf4.jus.br/pje',
  'trf5': 'https://pje.trf5.jus.br/pje',
  'tst': 'https://pje.tst.jus.br/pje',
  'tjac': 'https://pje.tjac.jus.br/pje',
  'tjal': 'https://pje.tjal.jus.br/pje',
  'tjam': 'https://pje.tjam.jus.br/pje',
  'tjap': 'https://pje.tjap.jus.br/pje',
  'tjba': 'https://pje.tjba.jus.br/pje',
  'tjce': 'https://pje.tjce.jus.br/pje',
  'tjdft': 'https://pje.tjdft.jus.br/pje',
  'tjes': 'https://pje.tjes.jus.br/pje',
  'tjgo': 'https://pje.tjgo.jus.br/pje',
  'tjma': 'https://pje.tjma.jus.br/pje',
  'tjmg': 'https://pje.tjmg.jus.br/pje',
  'tjms': 'https://pje.tjms.jus.br/pje',
  'tjmt': 'https://pje.tjmt.jus.br/pje',
  'tjpa': 'https://pje.tjpa.jus.br/pje',
  'tjpb': 'https://pje.tjpb.jus.br/pje',
  'tjpe': 'https://pje.tjpe.jus.br/pje',
  'tjpi': 'https://pje.tjpi.jus.br/pje',
  'tjpr': 'https://pje.tjpr.jus.br/pje',
  'tjrj': 'https://pje.tjrj.jus.br/pje',
  'tjrn': 'https://pje.tjrn.jus.br/pje',
  'tjro': 'https://pje.tjro.jus.br/pje',
  'tjrr': 'https://pje.tjrr.jus.br/pje',
  'tjrs': 'https://pje.tjrs.jus.br/pje',
  'tjsc': 'https://pje.tjsc.jus.br/pje',
  'tjse': 'https://pje.tjse.jus.br/pje',
  'tjsp': 'https://pje.tjsp.jus.br/pje',
  'tjto': 'https://pje.tjto.jus.br/pje',
}

export class PJeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public tribunal?: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'PJeAPIError'
  }
}

/**
 * Note: PJe requires authentication and many tribunals restrict API access
 * This is a framework implementation. Actual usage requires:
 * 1. Credentials from the tribunal
 * 2. VPN/whitelist access in some cases
 * 3. Specific API documentation from each tribunal
 */
export async function consultarPublicacoesPJe(
  params: PublicationSearchParams,
  config?: PJeConfig
): Promise<UnifiedPublication[]> {
  const publications: UnifiedPublication[] = []
  
  // Check if configured
  if (!config?.enabled) {
    throw new PJeAPIError('PJe integration not enabled')
  }
  
  const tribunals = params.tribunals || ['trf1']
  
  for (const tribunal of tribunals) {
    const baseUrl = PJE_TRIBUNAL_URLS[tribunal.toLowerCase()]
    
    if (!baseUrl) {
      console.warn(`PJe URL not configured for tribunal: ${tribunal}`)
      continue
    }
    
    try {
      // This is a placeholder - actual implementation requires:
      // 1. Authentication endpoint call
      // 2. Session token management
      // 3. Specific API endpoints per tribunal
      
      // Example endpoint (varies by tribunal):
      // const url = `${baseUrl}/api/v1/publicacoes`
      
      // For now, return a note that this requires configuration
      console.info(`PJe integration for ${tribunal} requires specific tribunal credentials`)
      
    } catch (error) {
      console.error(`Error consulting PJe for ${tribunal}:`, error)
    }
  }
  
  return publications
}

/**
 * Get tribunal URL for PJe access
 */
export function getPJeTribunalUrl(tribunal: string): string | null {
  return PJE_TRIBUNAL_URLS[tribunal.toLowerCase()] || null
}

/**
 * Check if tribunal has PJe available
 */
export function isTribunalPJeAvailable(tribunal: string): boolean {
  return tribunal.toLowerCase() in PJE_TRIBUNAL_URLS
}

/**
 * Get list of all tribunals with PJe
 */
export function getTribunaisComPJe(): string[] {
  return Object.keys(PJE_TRIBUNAL_URLS)
}
