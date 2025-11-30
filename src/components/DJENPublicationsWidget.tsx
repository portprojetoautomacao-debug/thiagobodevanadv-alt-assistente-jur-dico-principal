/**
 * DJEN Publications Widget - Refatorado
 *
 * Versão otimizada com complexidade cognitiva reduzida (S3776)
 * Separação de responsabilidades em hooks customizados
 */

import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Clock,
  CheckCircle,
  Warning,
  ArrowRight,
  Robot,
  Funnel,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useDJENPublications } from '@/hooks/use-djen-publications'
import { useDJENSync } from '@/hooks/use-djen-sync'
import { useDJENProcessRegistration } from '@/hooks/use-djen-process-registration'
import { PublicationItem } from '@/components/PublicationItem'
import type { Process, Expediente } from '@/types'

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
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  // Hooks customizados para reduzir complexidade
  const {
    publications,
    loading,
    error,
    lastCheck,
    lawyersCount,
    fetchPublications,
  } = useDJENPublications(maxItems, filter)

  const { syncing, handleSync } = useDJENSync()

  // KV storage para processos e expedientes
  const [processes, setProcesses] = useKV<Process[]>('processes', [])
  const [, setExpedientes] = useKV<Expediente[]>('expedientes', [])

  const {
    autoRegistering,
    isAlreadyRegistered,
    handleRegisterProcess,
    handleAutoRegisterAll,
  } = useDJENProcessRegistration(processes, setProcesses, setExpedientes)

  // Carrega publicações ao montar
  useEffect(() => {
    fetchPublications()
  }, [fetchPublications])

  // Helper para data relativa
  const getRelativeDateDescription = (dateStr: string): string => {
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

  // Early return: Loading state
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

  // Early return: Error state
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

  // Main render
  return (
    <Card className={cn('card-glow-hover glassmorphic', compact && 'h-fit')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm gradient-text">
            <Newspaper size={20} weight="duotone" className="text-primary" />
            Publicações DJEN
            {publications.length > 0 && (
              <Button variant="secondary" className="ml-1 h-5 px-2 text-xs">
                {publications.length}
              </Button>
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
                    onClick={() => handleSync(fetchPublications)}
                    disabled={syncing}
                    className="h-8 w-8 p-0"
                    aria-label="Sincronizar publicações agora"
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
              Última verificação: {getRelativeDateDescription(lastCheck)}
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
              onClick={() => handleSync(fetchPublications)}
              className="mt-4"
              disabled={syncing}
            >
              <ArrowsClockwise size={14} className={syncing ? 'animate-spin' : ''} />
              Verificar agora
            </Button>
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[250px]' : 'h-[350px]'}>
            <div className="space-y-2 pr-2">
              {publications.map((pub) => (
                <PublicationItem
                  key={pub.id}
                  pub={pub}
                  expanded={expanded}
                  onToggleExpand={setExpanded}
                  onRegister={handleRegisterProcess}
                  isAlreadyRegistered={isAlreadyRegistered(pub)}
                  formatRelativeDate={getRelativeDateDescription}
                />
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
                          onClick={() => handleAutoRegisterAll(publications)}
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