/**
 * Multi-Source Publication Aggregator
 * 
 * Unified interface for querying legal publications from multiple sources:
 * - Third-party aggregators (future: JusBrasil, 
 * This is the main en

  PublicationSource,
 * - Third-party aggregators (future: JusBrasil, Escavador APIs)
 * 
 * This is the main entry point for publication searches across all sources.
 */

export type {
  PublicationSource,
  UnifiedPublication,
  UnifiedPublication,
  PublicationSearchResult,
  PublicationSourceConfig,
  SourceCapabilities


import { consultarDJEN, type DJENConfig, type DJENFilteredResult } from './djen-api'
import { consultarProcessoDatajud, type DatajudProcesso } from './datajud-api'
import { consultarPublicacoesPJe, type PJeConfig, getTribunaisComPJe } from './pje-api'
import { consultarQueridoDiario } from './diario-oficial-api'

/**
 * Configuration for all publication sources
 */
export interface MultiSourceConfig {
  sources: PublicationSourceConfig[]

    preferredSources?: PublicationSource[]
    maxConcurrentRequests?: number
    aggregateResults?: boolean
    deduplicateResults?: boolean
  }
 

   
 * Default configuration from environment variables
 */
export function getDefaultConfig(): MultiSourceConfig {
    // DataJud - enabled if API key configured
    // DJEN - always enabled (no auth required)
     
      source: 'djen',
      timeout: 30000
      baseUrl: 'https://comunicaapi.pje.jus.br/api/v1/comunicacao',
    // PJe - requires
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
      
    
    // PJe - requires tribunal-specific credentials (disabled by default)
    {
 * Get source capabilities 
      enabled: false,
  return [
    },
    
    // Diários Oficiais (via Querido Diário) - always enabled (open source)
    {
      source: 'diario_oficial',
      enabled: true,
      baseUrl: 'https://queridodiario.ok.org.br/api',
      timeout: 30000
    }
   
  
        hi
    sources,
    preferences: {
      aggregateResults: true,
      },
      maxConcurrentRequests: 3
    {
  }
 

   
 * Get source capabilities and status
   
export function getSourceCapabilities(): SourceCapabilities[] {
        oa
    {
        keywordSearch
      name: 'DJEN - Diário de Justiça Eletrônico Nacional',
      description: 'Official CNJ API for judicial publications from all Brazilian courts',
      official: true,
      requiresAuth: false,
      supportsRealtime: false,
    {
        tribunals: ['TST', 'TRT3', 'TJMG', 'TRF1', 'TJES', 'TJSP', 'STJ'],
      description: 'Dire
      },
      features: {
        lawyerSearch: true,
        oabSearch: true,
        processSearch: true,
        partySearch: true,
        keywordSearch: false,
        partySearch: true,
        alerts: false
      },
      limits: {
        rateLimit: 'Vari
        rateLimit: '40 requests/minute'
    },
      status: 'active'
      
    {
      requiresAuth: fals
      name: 'DataJud - CNJ Public API',
      description: 'Official CNJ database with process metadata and movements',
      official: true,
      requiresAuth: true,
      supportsRealtime: false,
      coverage: {
        nationwide: true
        
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
      
    {
      source: 'pje_direct',
      name: 'PJe Direct - Electronic Judicial Process',
      description: 'Direct access to PJe systems in various courts (requires credentials)',
      official: true,
      requiresAuth: true,
      supportsRealtime: false,
    {
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
  ]
    },
/**
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

        partySearch: false,
        keywordSearch: true,
        historicalData: true,
  
      },
      limits: {
        maxDateRange: 365,
        maxResultsPerRequest: 100
      },
      status: 'active'
    },
    m
      source: 'jusbrasil',
  }
      description: 'Third-party aggregator with comprehensive coverage (requires subscription)',
      official: false,
      requiresAuth: true,
      supportsRealtime: true,
      coverage: {
): Promise<PublicationSe
      },
  
        lawyerSearch: true,
    ? enabledSources.fil
        processSearch: true,
        partySearch: true,
        keywordSearch: true,
        historicalData: true,
        alerts: true
    
      limits: {
        rateLimit: 'Varies by subscription plan'
      },
          if (params.la
    },
     
      source: 'escavador',
      name: 'Escavador API',
      description: 'Third-party aggregator covering 440+ court systems (requires subscription)',
              timeout:
      requiresAuth: true,
            const result = aw
      coverage: {
        nationwide: true
      },
      features: {
        lawyerSearch: true,
        oabSearch: true,
        processSearch: true,
        partySearch: true,
        keywordSearch: true,
          
        alerts: true
        
      limits: {
        rateLimit: 'Varies by subscription plan'
      },
      status: 'planned'
    }
   
}

/**
 * Convert DJEN result to unified format
 */
        count: publications.length,
  return {
    id: `djen_${result.tribunal}_${result.data}_${result.numeroProcesso || Math.random()}`,
    source: 'djen',















































































































































































