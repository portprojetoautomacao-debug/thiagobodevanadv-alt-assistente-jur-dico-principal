/**
 * DJEN Publications Widget
 * 
 * Exibe publicações DJEN capturadas pelo monitoramento automático no dashboard.
 * Mostra últimas publicações, status de sincronização e permite ações rápidas.
 */

import { useState, useEffect, useCallback } from 'react'
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
  Bell,
  BellRinging,
  Eye,
  ArrowRight,
  Warning,
  Info,
  Copy,
  CaretDown,
  CaretUp,
  Funnel
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

interface DJENPublicationsWidgetProps {
  onViewAll?: () => void
  compact?: boolean
  maxItems?: number
}

export default function DJENPublicationsWidget({ 
  onViewAll, 
  compact = false,
  maxItems = 5 
}: DJENPublicationsWidgetProps) {
  const [publications, setPublications] = useState<DJENPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<string | null>(null)
  const [lawyersCount, setLawyersCount] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Busca publicações da API
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const statusParam = filter === 'unread' ? '&status=unread' : ''
      const response = await fetch(`${baseUrl}/api/expedientes?limit=${maxItems * 2}${statusParam}`)
      
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
      const response = await fetch(`${baseUrl}/api/cron?action=djen-monitor`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.ok) {
        toast.success('Sincronização concluída', {
          description: `${result.result?.publicationsFound || 0} novas publicações encontradas`
        })
        // Recarrega publicações após sync
        await fetchPublications()
      } else {
        throw new Error(result.message || 'Erro na sincronização')
      }
    } catch (err) {
      console.error('[DJENWidget] Sync error:', err)
      toast.error('Falha na sincronização', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      })
    } finally {
      setSyncing(false)
    }
  }

  // Copia teor para clipboard
  const handleCopy = (teor: string) => {
    navigator.clipboard.writeText(teor)
    toast.success('Copiado!', { description: 'Teor copiado para a área de transferência' })
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
      nome: { label: 'Nome', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      oab: { label: 'OAB', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      ambos: { label: 'Nome + OAB', className: 'bg-green-500/20 text-green-400 border-green-500/30' }
    }
    const variant = variants[type]
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>
  }

  // Skeleton loader
  if (loading) {
    return (
      <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
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
      <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
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
    <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
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
                    onClick={() => setFilter(f => f === 'all' ? 'unread' : 'all')}
                    className="h-8 w-8 p-0"
                  >
                    <Funnel 
                      size={16} 
                      weight={filter === 'unread' ? 'fill' : 'regular'}
                      className={filter === 'unread' ? 'text-primary' : ''}
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
                  >
                    <ArrowsClockwise 
                      size={16} 
                      className={syncing ? 'animate-spin' : ''}
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
            <Newspaper size={40} className="text-muted-foreground mb-2" weight="duotone" />
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
              <ArrowsClockwise size={14} className={syncing ? 'animate-spin' : ''} />
              Verificar agora
            </Button>
          </div>
        ) : (
          <ScrollArea className={compact ? "h-[250px]" : "h-[350px]"}>
            <div className="space-y-2 pr-2">
              {publications.map((pub) => (
                <div
                  key={pub.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer",
                    "hover:bg-accent/50 hover:border-primary/30",
                    expanded === pub.id && "bg-accent/30 border-primary/50"
                  )}
                  onClick={() => setExpanded(e => e === pub.id ? null : pub.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {pub.tribunal}
                        </Badge>
                        <MatchBadge type={pub.matchType} />
                        {!pub.notified && (
                          <Badge className="bg-primary/20 text-primary text-[10px] px-1.5">
                            <BellRinging size={10} className="mr-1" />
                            Novo
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs font-medium truncate">
                        {pub.tipo || 'Intimação'}
                      </p>
                      
                      <p className="text-[11px] text-muted-foreground truncate">
                        {pub.numeroProcesso && `Processo: ${pub.numeroProcesso}`}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeDate(pub.createdAt)}
                      </span>
                      {expanded === pub.id ? (
                        <CaretUp size={14} className="text-muted-foreground" />
                      ) : (
                        <CaretDown size={14} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {/* Conteúdo expandido */}
                  {expanded === pub.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <p className="font-medium mb-1 text-muted-foreground">Teor:</p>
                        <p className="whitespace-pre-wrap text-[11px] max-h-32 overflow-y-auto">
                          {pub.teor.substring(0, 500)}
                          {pub.teor.length > 500 && '...'}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Advogado: {pub.lawyerName}</span>
                        <span>Data: {new Date(pub.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation()
                            handleCopy(pub.teor)
                          }}
                        >
                          <Copy size={12} />
                          Copiar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation()
                            toast.info('Em desenvolvimento', { 
                              description: 'Visualização detalhada em breve' 
                            })
                          }}
                        >
                          <Eye size={12} />
                          Detalhes
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
        {publications.length > 0 && onViewAll && (
          <>
            <Separator className="my-3" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="w-full hover:button-gradient hover:text-primary-foreground"
            >
              Ver todas as publicações
              <ArrowRight size={14} />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
