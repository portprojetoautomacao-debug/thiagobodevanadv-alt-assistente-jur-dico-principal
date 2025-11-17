/**
 * Multi-Source Publication Aggregator
 * 
 * Unified interface for querying legal publications from multiple sources:
 * - DJEN (Diário de Justiça Eletrônico Nacional)
 * - DataJud (CNJ API)
 * - PJe (Processo Judicial Eletrônico)
 * - Diários Oficiais (Official Gazettes)
 * - Third-party aggregators (future: JusBrasil, Escavador APIs)
 * 
 * This is the main entry point for publication searches across all sources.
 */

import type {
  PublicationSource,
  UnifiedPublication,
  PublicationSearchParams,
  PublicationSearchResult,
  PublicationSourceConfig,
  SourceCapabilities
} from './publication-sources-types'

export type {
  PublicationSource,
  UnifiedPublication,
  PublicationSearchParams,
  PublicationSearchResult,
  PublicationSourceConfig,
  SourceCapabilities
}

import { consultarDJEN, type DJENConfig, type DJENFilteredResult } from './djen-api'
import { consultarProcessoDatajud, type DatajudProcesso } from './datajud-api'
import { consultarPublicacoesPJe, type PJeConfig, getTribunaisComPJe } from './pje-api'
import { consultarQueridoDiario } from './diario-oficial-api'

/**
 * Configuration for all publication sources
 */
export interface MultiSourceConfig {
  sources: PublicationSourceConfig[]
  preferences?: {
    preferredSources?: PublicationSource[]
    maxConcurrentRequests?: number
    aggregateResults?: boolean
    deduplicateResults?: boolean
  }
}

/**
 * Default configuration from environment variables
 */
export function getDefaultConfig(): MultiSourceConfig {
  const sources: PublicationSourceConfig[] = [
    // DJEN - always enabled (no auth required)
    {
      source: 'djen',
      enabled: true,
      baseUrl: 'https://comunicaapi.pje.jus.br/api/v1/comunicacao',
      timeout: 60000,
      rateLimit: {
        requestsPerMinute: 40,
        delayBetweenRequests: 1500
      }
    },
    
    // DataJud - enabled if API key configured
    {
      source: 'datajud',
      enabled: !!import.meta.env.VITE_DATAJUD_API_KEY,
      apiKey: import.meta.env.VITE_DATAJUD_API_KEY,
      baseUrl: 'https://api-publica.datajud.cnj.jus.br',
      timeout: 30000
    },
    
    // PJe - requires tribunal-specific credentials (disabled by default)
    {
      source: 'pje_direct',
      enabled: false,
      timeout: 30000
    },
    
    // Diários Oficiais (via Querido Diário) - always enabled (open source)
    {
      source: 'diario_oficial',
      enabled: true,
      baseUrl: 'https://queridodiario.ok.org.br/api',
      timeout: 30000
    }
  ]
  
  return {
    sources,
    preferences: {
      aggregateResults: true,
      deduplicateResults: true,
      maxConcurrentRequests: 3
    }
  }
}

/**
 * Get source capabilities and status
 */
export function getSourceCapabilities(): SourceCapabilities[] {
  return [
    {
      source: 'djen',
      name: 'DJEN - Diário de Justiça Eletrônico Nacional',
      description: 'Official CNJ API for judicial publications from all Brazilian courts',
      official: true,
      requiresAuth: false,
      supportsRealtime: false,
      coverage: {
        tribunals: ['TST', 'TRT3', 'TJMG', 'TRF1', 'TJES', 'TJSP', 'STJ'],
        nationwide: true
      },
      features: {
        lawyerSearch: true,
        oabSearch: true,
        processSearch: true,
        partySearch: true,
        keywordSearch: false,
        historicalData: true,
        alerts: false
      },
      limits: {
        maxDateRange: 1,
        rateLimit: '40 requests/minute'
      },
      status: 'active'
    },
    {
      source: 'datajud',
      name: 'DataJud - CNJ Public API',
      description: 'Official CNJ database with process metadata and movements',
      official: true,
      requiresAuth: true,
      supportsRealtime: false,
      coverage: {
        nationwide: true
      },
      features: {
        lawyerSearch: false,
        oabSearch: false,
        processSearch: true,
        partySearch: false,
        keywordSearch: false,
        historicalData: true,
        alerts: false
      },
      limits: {
        rateLimit: 'Varies by API key tier'
      },
      status: 'active'
    },
    {
      source: 'pje_direct',
      name: 'PJe Direct - Electronic Judicial Process',
      description: 'Direct access to PJe systems in various courts (requires credentials)',
      official: true,
      requiresAuth: true,
      supportsRealtime: false,
      coverage: {
        tribunals: getTribunaisComPJe(),
        nationwide: false
      },
      features: {
        lawyerSearch: true,
        oabSearch: true,
        processSearch: true,
        partySearch: true,
        keywordSearch: false,
        historicalData: true,
        alerts: false
      },
      limits: {
        rateLimit: 'Varies by tribunal'
      },
      status: 'beta'
    },
    {
      source: 'diario_oficial',
      name: 'Diários Oficiais',
      description: 'Municipal official gazettes via Querido Diário (Open Knowledge Brasil)',
      official: true,
      requiresAuth: false,
      supportsRealtime: false,
      coverage: {
        states: ['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'PA'],
        nationwide: false
      },
      features: {
        lawyerSearch: false,
        oabSearch: false,
        processSearch: false,
        partySearch: false,
        keywordSearch: true,
        historicalData: true,
        alerts: false
      },
      limits: {
        maxDateRange: 365,
        maxResultsPerRequest: 100
      },
      status: 'active'
    },
    {
      source: 'jusbrasil',
      name: 'JusBrasil API',
      description: 'Third-party aggregator with comprehensive coverage (requires subscription)',
      official: false,
      requiresAuth: true,
      supportsRealtime: true,
      coverage: {
        nationwide: true
      },
      features: {
        lawyerSearch: true,
        oabSearch: true,
        processSearch: true,
        partySearch: true,
        keywordSearch: true,
        historicalData: true,
        alerts: true
      },
      limits: {
        rateLimit: 'Varies by subscription plan'
      },
      status: 'planned'
    },
    {
      source: 'escavador',
      name: 'Escavador API',
      description: 'Third-party aggregator covering 440+ court systems (requires subscription)',
      official: false,
      requiresAuth: true,
      supportsRealtime: true,
      coverage: {
        nationwide: true
      },
      features: {
        lawyerSearch: true,
        oabSearch: true,
        processSearch: true,
        partySearch: true,
        keywordSearch: true,
        historicalData: true,
        alerts: true
      },
      limits: {
        rateLimit: 'Varies by subscription plan'
      },
      status: 'planned'
    }
  ]
}

/**
 * Convert DJEN result to unified format
 */
function convertDJENToUnified(result: DJENFilteredResult): UnifiedPublication {
  return {
    id: `djen_${result.tribunal}_${result.data}_${result.numeroProcesso || Math.random()}`,
    source: 'djen',
    sourceUrl: 'https://comunica.pje.jus.br',
    title: `${result.tipo} - ${result.tribunal}`,
    content: result.teor,
    publicationType: result.tipo,
    processNumber: result.numeroProcesso,
    tribunal: result.tribunal,
    court: result.orgao,
    publicationDate: result.data,
    matchType: result.matchType === 'nome' ? 'lawyer_name' : 
               result.matchType === 'oab' ? 'oab_number' : 'lawyer_name',
    matchReason: `Match by ${result.matchType}`,
    rawData: result
  }
}

/**
 * Convert DataJud result to unified format
 */
function convertDatajudToUnified(result: DatajudProcesso): UnifiedPublication {
  const latestMovement = result.movimentos?.[0]
  
  return {
    id: `datajud_${result.numeroProcesso}`,
    source: 'datajud',
    sourceUrl: 'https://www.cnj.jus.br/sistemas/datajud',
    title: `Processo ${result.numeroProcesso}`,
    content: latestMovement?.nome || 'Sem movimentação recente',
    publicationType: result.classe?.nome || 'Não especificado',
    processNumber: result.numeroProcesso,
    tribunal: result.tribunal,
    court: result.orgaoJulgador?.nome,
    publicationDate: latestMovement?.dataHora || result.dataHoraUltimaAtualizacao || '',
    matchType: 'process_number',
    matchReason: 'Direct process query',
    rawData: result
  }
}

/**
 * Search publications across all enabled sources
 */
export async function searchPublications(
  params: PublicationSearchParams,
  config?: MultiSourceConfig
): Promise<PublicationSearchResult> {
  const cfg = config || getDefaultConfig()
  const enabledSources = cfg.sources.filter(s => s.enabled)
  
  // Filter by requested sources if specified
  const sourcesToQuery = params.sources 
    ? enabledSources.filter(s => params.sources!.includes(s.source))
    : enabledSources
  
  const allPublications: UnifiedPublication[] = []
  const sourceResults: PublicationSearchResult['sources'] = []
  
  // Query each source
  for (const sourceConfig of sourcesToQuery) {
    const startTime = Date.now()
    
    try {
      let publications: UnifiedPublication[] = []
      
      switch (sourceConfig.source) {
        case 'djen':
          if (params.lawyerName || params.oabNumber) {
            const djenConfig: DJENConfig = {
              tribunais: params.tribunals || ['TST', 'TRT3', 'TJMG', 'TRF1', 'TJES', 'TJSP', 'STJ'],
              searchTerms: {
                nomeAdvogado: params.lawyerName,
                numeroOAB: params.oabNumber
              },
              dataInicio: params.startDate,
              dataFim: params.endDate,
              timeout: sourceConfig.timeout
            }
            
            const result = await consultarDJEN(djenConfig)
            publications = result.resultados.map(convertDJENToUnified)
          }
          break
          
        case 'datajud':
          if (params.processNumber) {
            const tribunal = params.tribunals?.[0] || 'tjsp'
            const processo = await consultarProcessoDatajud({
              numeroProcesso: params.processNumber,
              tribunal
            })
            publications = [convertDatajudToUnified(processo)]
          }
          break
          
        case 'pje_direct':
          if (sourceConfig.enabled) {
            publications = await consultarPublicacoesPJe(params, sourceConfig as PJeConfig)
          }
          break
          
        case 'diario_oficial':
          if (params.keywords && params.keywords.length > 0) {
            publications = await consultarQueridoDiario(params)
          }
          break
          
        default:
          console.warn(`Source ${sourceConfig.source} not yet implemented`)
      }
      
      allPublications.push(...publications)
      
      sourceResults.push({
        source: sourceConfig.source,
        count: publications.length,
        status: 'success',
        duration: Date.now() - startTime
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      sourceResults.push({
        source: sourceConfig.source,
        count: 0,
        status: 'error',
        error: errorMessage,
        duration: Date.now() - startTime
      })
      
      console.error(`Error querying ${sourceConfig.source}:`, error)
    }
  }
  
  // Deduplicate if enabled
  let finalPublications = allPublications
  if (cfg.preferences?.deduplicateResults) {
    const seen = new Set<string>()
    finalPublications = allPublications.filter(pub => {
      const key = `${pub.processNumber || ''}_${pub.publicationDate}_${pub.tribunal || ''}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  // Sort by date (newest first)
  finalPublications.sort((a, b) => {
    return new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()
  })
  
  return {
    publications: finalPublications,
    totalFound: finalPublications.length,
    sources: sourceResults,
    searchParams: params,
    timestamp: new Date().toISOString()
  }
}

/**
 * Get enabled sources from configuration
 */
export function getEnabledSources(config?: MultiSourceConfig): PublicationSource[] {
  const cfg = config || getDefaultConfig()
  return cfg.sources.filter(s => s.enabled).map(s => s.source)
}

/**
 * Check if a source is configured and enabled
 */
export function isSourceEnabled(source: PublicationSource, config?: MultiSourceConfig): boolean {
  const cfg = config || getDefaultConfig()
  const sourceConfig = cfg.sources.find(s => s.source === source)
  return sourceConfig?.enabled || false
}
