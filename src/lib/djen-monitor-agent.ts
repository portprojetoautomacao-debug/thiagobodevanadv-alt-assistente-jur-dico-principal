import { consultarDJEN, type DJENConfig, type DJENFilteredResult } from '@/lib/djen-api'

export interface DJENMonitorConfig {
  tribunais: string[]
  advogados: Array<{
    nome?: string
    oab?: string
  }>
  intervaloHoras?: number
  maxRetries?: number
  retryDelayMs?: number
  notificarCallback?: (publicacoes: DJENFilteredResult[]) => void
  logCallback?: (message: string, level: 'info' | 'warn' | 'error') => void
}

export interface DJENMonitorTask {
  id: string
  status: 'idle' | 'running' | 'paused' | 'error'
  lastRun?: string
  nextRun?: string
  totalPublicacoesEncontradas: number
  ultimasPublicacoes: DJENFilteredResult[]
  erros: Array<{ timestamp: string; message: string }>
}

export class DJENMonitorAgent {
  private config: DJENMonitorConfig
  private task: DJENMonitorTask
  private intervalId?: number
  private isRunning: boolean = false

  constructor(config: DJENMonitorConfig) {
    this.config = {
      intervaloHoras: 1,
      maxRetries: 3,
      retryDelayMs: 5000,
      ...config
    }

    this.task = {
      id: `djen-monitor-${Date.now()}`,
      status: 'idle',
      totalPublicacoesEncontradas: 0,
      ultimasPublicacoes: [],
      erros: []
    }
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (this.config.logCallback) {
      this.config.logCallback(`[DJEN Monitor] ${message}`, level)
    } else {
      console[level](`[DJEN Monitor] ${message}`)
    }
  }

  private calcularProximaExecucao(): Date {
    const agora = new Date()
    const intervaloMs = (this.config.intervaloHoras || 1) * 60 * 60 * 1000
    return new Date(agora.getTime() + intervaloMs)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async consultarComRetry(configConsulta: DJENConfig, advogado: { nome?: string; oab?: string }): Promise<any> {
    const maxRetries = this.config.maxRetries || 3
    const retryDelay = this.config.retryDelayMs || 5000
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const resultado = await consultarDJEN(configConsulta)
        return resultado
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        
        if (attempt === maxRetries) {
          this.log(
            `Falha após ${maxRetries} tentativas para ${advogado.nome || advogado.oab}: ${errorMessage}`,
            'error'
          )
          throw error
        }
        
        this.log(
          `Tentativa ${attempt}/${maxRetries} falhou para ${advogado.nome || advogado.oab}. Tentando novamente em ${retryDelay}ms...`,
          'warn'
        )
        
        await this.sleep(retryDelay * attempt) // Exponential backoff
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private async executarConsulta(): Promise<void> {
    if (!this.isRunning) return

    this.task.status = 'running'
    this.log('Iniciando consulta ao DJEN...')

    const dataHoje = new Date().toISOString().split('T')[0]
    const todasPublicacoes: DJENFilteredResult[] = []

    for (const advogado of this.config.advogados) {
      try {
        const configConsulta: DJENConfig = {
          tribunais: this.config.tribunais,
          searchTerms: {
            nomeAdvogado: advogado.nome,
            numeroOAB: advogado.oab
          },
          dataInicio: dataHoje,
          dataFim: dataHoje,
          timeout: 60000,
          delayBetweenRequests: 1500
        }

        const resultado = await this.consultarComRetry(configConsulta, advogado)

        if (resultado.resultados.length > 0) {
          this.log(
            `Encontradas ${resultado.resultados.length} publicação(ões) para ${advogado.nome || advogado.oab}`,
            'info'
          )
          todasPublicacoes.push(...resultado.resultados)
        }

        if (resultado.erros.length > 0) {
          this.log(
            `Erros ao consultar tribunais: ${resultado.erros.map((e: any) => e.tribunal).join(', ')}`,
            'warn'
          )
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        this.log(`Erro ao consultar advogado ${advogado.nome || advogado.oab}: ${errorMessage}`, 'error')
        
        this.task.erros.push({
          timestamp: new Date().toISOString(),
          message: errorMessage
        })

        if (this.task.erros.length > 100) {
          this.task.erros = this.task.erros.slice(-50)
        }
      }
    }

    if (todasPublicacoes.length > 0) {
      this.task.totalPublicacoesEncontradas += todasPublicacoes.length
      this.task.ultimasPublicacoes = todasPublicacoes

      if (this.config.notificarCallback) {
        try {
          this.config.notificarCallback(todasPublicacoes)
        } catch (error) {
          this.log('Erro ao executar callback de notificação', 'error')
        }
      }

      this.log(`Total de ${todasPublicacoes.length} publicação(ões) relevante(s) encontrada(s)`, 'info')
    } else {
      this.log('Nenhuma publicação relevante encontrada nesta execução', 'info')
    }

    this.task.lastRun = new Date().toISOString()
    this.task.nextRun = this.calcularProximaExecucao().toISOString()
    this.task.status = 'idle'

    this.log(`Próxima execução agendada para ${new Date(this.task.nextRun).toLocaleString('pt-BR')}`)
  }

  public iniciar(): void {
    if (this.isRunning) {
      this.log('Monitor já está em execução', 'warn')
      return
    }

    this.isRunning = true
    this.task.status = 'running'
    this.log('Monitor DJEN iniciado')

    this.executarConsulta()

    const intervaloMs = (this.config.intervaloHoras || 1) * 60 * 60 * 1000
    this.intervalId = window.setInterval(() => {
      this.executarConsulta()
    }, intervaloMs)

    this.task.nextRun = this.calcularProximaExecucao().toISOString()
  }

  public pausar(): void {
    if (!this.isRunning) {
      this.log('Monitor já está pausado', 'warn')
      return
    }

    this.isRunning = false
    this.task.status = 'paused'
    
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    this.log('Monitor DJEN pausado')
  }

  public retomar(): void {
    if (this.isRunning) {
      this.log('Monitor já está em execução', 'warn')
      return
    }

    this.log('Retomando monitor DJEN...')
    this.iniciar()
  }

  public parar(): void {
    this.pausar()
    this.task.status = 'idle'
    this.task.nextRun = undefined
    this.log('Monitor DJEN parado')
  }

  public getStatus(): DJENMonitorTask {
    return { ...this.task }
  }

  public executarAgora(): void {
    if (this.task.status === 'running') {
      this.log('Já há uma consulta em execução', 'warn')
      return
    }

    this.log('Executando consulta manual...')
    this.executarConsulta()
  }

  public limparHistorico(): void {
    this.task.ultimasPublicacoes = []
    this.task.erros = []
    this.log('Histórico limpo')
  }

  public atualizarConfig(novaConfig: Partial<DJENMonitorConfig>): void {
    const estaRodando = this.isRunning

    if (estaRodando) {
      this.pausar()
    }

    this.config = {
      ...this.config,
      ...novaConfig
    }

    this.log('Configuração atualizada')

    if (estaRodando) {
      this.retomar()
    }
  }
}

export function criarMonitorDJEN(config: DJENMonitorConfig): DJENMonitorAgent {
  return new DJENMonitorAgent(config)
}
