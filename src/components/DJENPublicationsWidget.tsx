/**
 * DJEN Publications Widget
 *
 * Exibe publicações DJEN capturadas pelo monitoramento automático no dashboard.
 * Mostra últimas publicações, status de sincronização e permite ações rápidas.
 */

import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@/hooks/use-kv'
import { extractPartiesWithFallback } from '@/lib/extract-parties-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Newspaper,
  ArrowsClockwise,
  CheckCircle,
  Clock,
  BellRinging,
  ArrowRight,
  Warning,
  Copy,
  CaretDown,
  CaretUp,
  Funnel,
  Plus,
  Robot,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useClientesManager } from '@/hooks/use-clientes-manager'
import type { Process, Expediente } from '@/types'

// Tipos
interface DJENPublication {
  id: string
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  lawyerName: string
  matchType: 'nome' | 'oab' | 'ambos'
  source: string
  createdAt: string
  notified?: boolean
}

interface ExpedientesResponse {
  success: boolean
  expedientes: DJENPublication[]
  count: number
  lastCheck: string | null
  lawyersConfigured: number
  message?: string
}

interface PartiesResult {
  autor: string
  reu: string
  advogadoAutor?: string
  advogadoReu?: string
}

/**
 * Cria um novo processo a partir de uma publicação DJEN
 */
function createProcessFromPublication(
  pub: DJENPublication,
  parties: PartiesResult,
  now: string
): Process {
  return {
    id: crypto.randomUUID(),
    numeroCNJ: pub.numeroProcesso!,
    titulo: `${pub.tipo || 'Intimação'} - ${pub.tribunal}`,
    autor: parties.autor || 'Não identificado',
    reu: parties.reu || 'Não identificado',
    comarca: pub.orgao || '',
    vara: pub.tribunal || '',
    status: 'ativo',
    fase: 'Inicial',
    dataDistribuicao: pub.data || now.split('T')[0],
    dataUltimaMovimentacao: now,
    notas: buildProcessNotes(pub, parties),
    prazos: [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Monta as notas do processo
 */
function buildProcessNotes(pub: DJENPublication, parties: PartiesResult): string {
  const advAutor = parties.advogadoAutor ? `\nAdvogado Autor: ${parties.advogadoAutor}` : ''
  const advReu = parties.advogadoReu ? `\nAdvogado Réu: ${parties.advogadoReu}` : ''
  const teorTruncado = pub.teor.length > 500 ? pub.teor.substring(0, 500) + '...' : pub.teor

  return `Origem: DJEN\nAdvogado: ${pub.lawyerName}\nTipo de match: ${pub.matchType}${advAutor}${advReu}\n\nTeor da intimação:\n${teorTruncado}`
}

/**
 * Cria um expediente a partir de uma publicação DJEN
 */
function createExpedienteFromPublication(
  pub: DJENPublication,
  processId: string,
  now: string
): Expediente {
  return {
    id: crypto.randomUUID(),
    processId,
    tipo: pub.tipo || 'intimacao',
    titulo: `${pub.tipo || 'Intimação'} - ${pub.numeroProcesso}`,
    conteudo: pub.teor,
    content: pub.teor,
    teor: pub.teor,
    dataRecebimento: now,
    receivedAt: now,
    lido: false,
    arquivado: false,
    analyzed: false,
    tribunal: pub.tribunal,
    numeroProcesso: pub.numeroProcesso,
    orgao: pub.orgao,
    lawyerName: pub.lawyerName,
    matchType: pub.matchType,
    source: pub.source,
    createdAt: pub.createdAt,
    data: pub.data,
    priority: 'high', // Intimações são sempre prioridade alta
  }
}

// ===== Registration Helpers (reduces S3776 Cognitive Complexity) =====

interface RegistrationContext {
  createOrUpdateFromDjenIntimacao: (data: {
    nomeCliente: string
    cidade: string
    estado: string
    processo: string
  }) => void
}

/**
 * Extrai cidade e estado do campo orgão
 */
function parseOrgaoLocation(orgao?: string): { cidade: string; estado: string } {
  const parts = orgao?.split('/') || []
  return {
    cidade: parts[0] || '',
    estado: parts[1] || '',
  }
}

/**
 * Registra cliente a partir das partes extraídas
 */
function registerClientFromParties(
  parties: PartiesResult,
  pub: DJENPublication,
  ctx: RegistrationContext
): void {
  if (!parties.autor || parties.autor === 'Não identificado') return
  
  const location = parseOrgaoLocation(pub.orgao)
  ctx.createOrUpdateFromDjenIntimacao({
    nomeCliente: parties.autor,
    cidade: location.cidade,
    estado: location.estado,
    processo: pub.numeroProcesso || '',
  })
}

/**
 * Processa uma única publicação para registro
 */
async function processPublicationForRegistration(
  pub: DJENPublication,
  now: string,
  ctx: RegistrationContext
): Promise<{ process: Process; expediente: Expediente } | null> {
  if (!pub.numeroProcesso) return null

  const parties = await extractPartiesWithFallback(pub.teor)
  registerClientFromParties(parties, pub, ctx)

  const newProcess = createProcessFromPublication(pub, parties, now)
  const newExpediente = createExpedienteFromPublication(pub, newProcess.id, now)

  return { process: newProcess, expediente: newExpediente }
}

/**
 * Formata descrição das partes para toast
 */
function formatPartiesDescription(parties: PartiesResult): string {
  if (parties.autor === 'Não identificado') return ''
  return ` - ${parties.autor} x ${parties.reu}`
}

interface DJENPublicationsWidgetProps {
  readonly onViewAll?: () => void
  readonly compact?: boolean
  readonly maxItems?: number
}

export default function DJENPublicationsWidget({
  onViewAll,
  compact = false,
  maxItems = 5,
}: DJENPublicationsWidgetProps) {
  const [publications, setPublications] = useState<DJENPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<string | null>(null)
  const [lawyersCount, setLawyersCount] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [autoRegistering, setAutoRegistering] = useState(false)

  // KV storage para processos e expedientes
  const [processes, setProcesses] = useKV<Process[]>('processes', [])
  const [, setExpedientes] = useKV<Expediente[]>('expedientes', [])

  // Hook centralizado para cadastro de clientes
  const { createOrUpdateFromDjenIntimacao } = useClientesManager()

  // Busca publicações da API
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const statusParam = filter === 'unread' ? '&status=unread' : ''
      const response = await fetch(
        `${baseUrl}/api/expedientes?limit=${maxItems * 2}${statusParam}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ExpedientesResponse = await response.json()

      if (data.success) {
        setPublications(data.expedientes.slice(0, maxItems))
        setLastCheck(data.lastCheck)
        setLawyersCount(data.lawyersConfigured)
      } else {
        setError(data.message || 'Erro ao carregar publicações')
      }
    } catch (err) {
      console.error('[DJENWidget] Fetch error:', err)
      setError('Não foi possível conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }, [maxItems, filter])

  // Força sincronização manual
  const handleSync = async () => {
    try {
      setSyncing(true)
      setError(null)

      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const response = await fetch(`${baseUrl}/api/djen-sync`, {
        method: 'POST',
      })

      // Tratar rate limit
      if (response.status === 429) {
        const data = await response.json()
        toast.warning('Aguarde antes de sincronizar', {
          description: data.message || 'Tente novamente em alguns segundos',
        })
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.ok) {
        toast.success('Sincronização concluída', {
          description:
            result.result?.newPublications > 0
              ? `${result.result.newPublications} novas publicações encontradas`
              : 'Nenhuma nova publicação',
        })
        // Recarrega publicações após sync
        await fetchPublications()
      } else {
        throw new Error(result.error || result.message || 'Erro na sincronização')
      }
    } catch (err) {
      console.error('[DJENWidget] Sync error:', err)
      toast.error('Falha na sincronização', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    } finally {
      setSyncing(false)
    }
  }

  // Copia teor para clipboard
  const handleCopy = (teor: string) => {
    navigator.clipboard.writeText(teor)
    toast.success('Copiado!', {
      description: 'Teor copiado para a área de transferência',
    })
  }

  // Verifica se publicação já está cadastrada no Acervo
  const isAlreadyRegistered = useCallback(
    (pub: DJENPublication) => {
      if (!pub.numeroProcesso) return false
      const currentProcesses = processes || []
      return currentProcesses.some(
        (p) =>
          p.numeroCNJ === pub.numeroProcesso ||
          p.numeroCNJ.replaceAll(/\D/g, '') === pub.numeroProcesso?.replaceAll(/\D/g, ''),
      )
    },
    [processes],
  )

  // Cadastra uma publicação individual no Acervo
  const handleRegisterProcess = async (pub: DJENPublication) => {
    if (!pub.numeroProcesso) {
      toast.error('Processo sem número CNJ', {
        description: 'Não é possível cadastrar sem número do processo',
      })
      return
    }

    if (isAlreadyRegistered(pub)) {
      toast.info('Processo já cadastrado', {
        description: `O processo ${pub.numeroProcesso} já está no Acervo`,
      })
      return
    }

    toast.info('Extraindo partes do processo...', {
      description: 'Analisando teor da publicação com IA',
    })

    const now = new Date().toISOString()
    const ctx: RegistrationContext = { createOrUpdateFromDjenIntimacao }
    const result = await processPublicationForRegistration(pub, now, ctx)

    if (!result) return

    setProcesses((current) => [...(current || []), result.process])
    setExpedientes((current) => [...(current || []), result.expediente])

    const parties = await extractPartiesWithFallback(pub.teor)
    toast.success('Processo cadastrado!', {
      description: `${pub.numeroProcesso} adicionado ao Acervo${formatPartiesDescription(parties)}`,
    })
  }

  // Cadastra TODAS as publicações não registradas automaticamente
  const handleAutoRegisterAll = async () => {
    if (autoRegistering) return
    setAutoRegistering(true)

    try {
      const unregisteredPubs = publications.filter(
        (pub) => pub.numeroProcesso && !isAlreadyRegistered(pub),
      )

      if (unregisteredPubs.length === 0) {
        toast.info('Nenhuma publicação nova', {
          description: 'Todas as publicações já estão no Acervo',
        })
        return
      }

      const now = new Date().toISOString()
      const ctx: RegistrationContext = { createOrUpdateFromDjenIntimacao }
      const newProcesses: Process[] = []
      const newExpedientes: Expediente[] = []

      toast.info(`Processando ${unregisteredPubs.length} publicações...`, {
        description: 'Extraindo partes dos processos com IA',
      })

      for (const pub of unregisteredPubs) {
        const result = await processPublicationForRegistration(pub, now, ctx)
        if (result) {
          newProcesses.push(result.process)
          newExpedientes.push(result.expediente)
        }
      }

      setProcesses((current) => [...(current || []), ...newProcesses])
      setExpedientes((current) => [...(current || []), ...newExpedientes])

      toast.success(`${newProcesses.length} processo(s) cadastrado(s)!`, {
        description: 'As intimações foram adicionadas ao Acervo e Expedientes',
      })
    } finally {
      setAutoRegistering(false)
    }
  }

  // Carrega publicações ao montar
  useEffect(() => {
    fetchPublications()
  }, [fetchPublications])

  // Formata data relativa
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Agora mesmo'
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    return date.toLocaleDateString('pt-BR')
  }

  // Badge de tipo de match
  const MatchBadge = ({ type }: { type: 'nome' | 'oab' | 'ambos' }) => {
    const variants = {
      nome: {
        label: 'Nome',
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      },
      oab: {
        label: 'OAB',
        className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      },
      ambos: {
        label: 'Nome + OAB',
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
      },
    }
    const variant = variants[type]
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  // Skeleton loader
  if (loading) {
    return (
      <Card className={cn('card-glow-hover glassmorphic', compact && 'h-fit')}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Estado de erro
  if (error && publications.length === 0) {
    return (
      <Card className={cn('card-glow-hover glassmorphic', compact && 'h-fit')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Newspaper size={20} weight="duotone" className="text-primary" />
            Publicações DJEN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Warning size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPublications}
            className="mt-3 w-full"
          >
            <ArrowsClockwise size={16} />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('card-glow-hover glassmorphic', compact && 'h-fit')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm gradient-text">
            <Newspaper size={20} weight="duotone" className="text-primary" />
            Publicações DJEN
            {publications.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {publications.length}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter((f) => (f === 'all' ? 'unread' : 'all'))}
                    className="h-8 w-8 p-0"
                    aria-label={
                      filter === 'all'
                        ? 'Filtrar: mostrar apenas não lidas'
                        : 'Filtrar: mostrar todas'
                    }
                    title={
                      filter === 'all'
                        ? 'Filtrar: mostrar não lidas'
                        : 'Filtrar: mostrar todas'
                    }
                  >
                    <Funnel
                      size={16}
                      weight={filter === 'unread' ? 'fill' : 'regular'}
                      className={filter === 'unread' ? 'text-primary' : ''}
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {filter === 'all' ? 'Mostrar não lidas' : 'Mostrar todas'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className="h-8 w-8 p-0"
                    aria-label="Sincronizar publicações agora"
                    title="Sincronizar publicações"
                  >
                    <ArrowsClockwise
                      size={16}
                      className={syncing ? 'animate-spin' : ''}
                      aria-hidden="true"
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sincronizar agora</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {lastCheck && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Última verificação: {formatRelativeDate(lastCheck)}
            </span>
          )}
          {lawyersCount > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle size={12} className="text-green-500" />
              {lawyersCount} advogado(s) monitorado(s)
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {publications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Newspaper
              size={40}
              className="text-muted-foreground mb-2"
              weight="duotone"
            />
            <p className="text-sm text-muted-foreground mb-1">
              Nenhuma publicação encontrada
            </p>
            <p className="text-xs text-muted-foreground">
              {lawyersCount === 0
                ? 'Configure advogados para monitorar'
                : 'O monitoramento está ativo'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              className="mt-4"
              disabled={syncing}
            >
              <ArrowsClockwise
                size={14}
                className={syncing ? 'animate-spin' : ''}
              />
              Verificar agora
            </Button>
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[250px]' : 'h-[350px]'}>
            <div className="space-y-2 pr-2">
              {publications.map((pub) => (
                <div
                  key={pub.id}
                  className={cn(
                    'p-3 rounded-lg border transition-all cursor-pointer',
                    'hover:bg-accent/50 hover:border-primary/30',
                    expanded === pub.id && 'bg-accent/30 border-primary/50',
                  )}
                  onClick={() =>
                    setExpanded((e) => (e === pub.id ? null : pub.id))
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs px-1.5">
                          {pub.tribunal}
                        </Badge>
                        <MatchBadge type={pub.matchType} />
                        {!pub.notified && (
                          <Badge className="bg-primary/20 text-primary text-xs px-1.5">
                            <BellRinging size={10} className="mr-1" />
                            Novo
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-medium truncate">
                        {pub.tipo || 'Intimação'}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        {pub.numeroProcesso &&
                          `Processo: ${pub.numeroProcesso}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeDate(pub.createdAt)}
                      </span>
                      {expanded === pub.id ? (
                        <CaretUp
                          size={14}
                          className="text-muted-foreground"
                        />
                      ) : (
                        <CaretDown
                          size={14}
                          className="text-muted-foreground"
                        />
                      )}
                    </div>
                  </div>

                  {/* Conteúdo expandido */}
                  {expanded === pub.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <p className="font-medium mb-1 text-muted-foreground">
                          Teor:
                        </p>
                        <p className="whitespace-pre-wrap text-xs max-h-32 overflow-y-auto">
                          {pub.teor.substring(0, 500)}
                          {pub.teor.length > 500 && '...'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Advogado: {pub.lawyerName}</span>
                        <span>
                          Data:{' '}
                          {pub.data &&
                            !isNaN(new Date(pub.data).getTime())
                            ? new Date(pub.data).toLocaleDateString('pt-BR')
                            : 'Data não disponível'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopy(pub.teor)
                          }}
                        >
                          <Copy size={12} />
                          Copiar
                        </Button>
                        <Button
                          variant={isAlreadyRegistered(pub) ? 'ghost' : 'default'}
                          size="sm"
                          className={cn(
                            'h-7 text-xs flex-1',
                            !isAlreadyRegistered(pub) && 'button-gradient',
                          )}
                          disabled={isAlreadyRegistered(pub)}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRegisterProcess(pub)
                          }}
                        >
                          {isAlreadyRegistered(pub) ? (
                            <>
                              <CheckCircle size={12} />
                              No Acervo
                            </>
                          ) : (
                            <>
                              <Plus size={12} />
                              Cadastrar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer com ações */}
        {publications.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="flex gap-2">
              {/* Botão para cadastrar todas automaticamente */}
              {publications.some(
                (pub) => pub.numeroProcesso && !isAlreadyRegistered(pub),
              ) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleAutoRegisterAll}
                          disabled={autoRegistering}
                          className="flex-1 button-gradient"
                        >
                          <Robot
                            size={14}
                            className={autoRegistering ? 'animate-pulse' : ''}
                          />
                          {autoRegistering
                            ? 'Cadastrando...'
                            : 'Cadastrar Todas'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Cadastra automaticamente todas as intimações no Acervo
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

              {onViewAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewAll}
                  className={cn(
                    'hover:button-gradient hover:text-primary-foreground',
                    publications.some(
                      (pub) =>
                        pub.numeroProcesso && !isAlreadyRegistered(pub),
                    )
                      ? 'flex-1'
                      : 'w-full',
                  )}
                >
                  Ver todas
                  <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
