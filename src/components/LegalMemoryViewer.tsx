import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, FileText, Gavel, Lightbulb, Clock } from '@phosphor-icons/react'

interface MemoryItem {
  id: string
  content: string
  type: string
  metadata: Record<string, any>
  createdAt: string
}

interface LegalMemoryViewerProps {
  memory?: MemoryItem[]
  isLoading?: boolean
  onRefresh?: () => void
}

const typeIcons: Record<string, any> = {
  'peca_processual': FileText,
  'precedente': Gavel,
  'estrategia': Lightbulb,
  'default': Brain
}

export function LegalMemoryViewer({ memory, isLoading, onRefresh }: LegalMemoryViewerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando memória jurídica...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Memória Jurídica Compartilhada</CardTitle>
          <CardDescription>
            Conhecimento acumulado pelos agentes (RAG - Retrieval Augmented Generation)
          </CardDescription>
        </div>
        {onRefresh && (
          <Badge variant="outline" className="cursor-pointer" onClick={onRefresh}>
            Atualizar
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {!memory || memory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item na memória ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {memory.map((item) => {
                const IconComponent = typeIcons[item.type] || typeIcons['default']
                
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="mt-0.5 p-1 rounded-full bg-primary/10 text-primary">
                      <IconComponent className="w-4 h-4" weight="fill" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {item.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-foreground mt-2 line-clamp-3">
                        {item.content}
                      </p>
                      
                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {item.metadata.agentId && (
                            <Badge variant="outline" className="text-[10px]">
                              Agente: {item.metadata.agentId}
                            </Badge>
                          )}
                          {item.metadata.taskId && (
                            <Badge variant="outline" className="text-[10px]">
                              Task: {item.metadata.taskId.substring(0, 8)}...
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
