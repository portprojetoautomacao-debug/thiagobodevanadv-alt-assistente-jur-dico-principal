import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkle, FileText, Download, Brain } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Expediente } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ExpedientePanel() {
  const [expedientes, setExpedientes] = useKV<Expediente[]>('expedientes', [])
  const [selectedExp, setSelectedExp] = useState<Expediente | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [showJustinEDialog, setShowJustinEDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  const handleAnalyze = async (exp: Expediente) => {
    setAnalyzing(true)
    setSelectedExp(exp)

    setTimeout(() => {
      const analyzed: Expediente = {
        ...exp,
        analyzed: true,
        summary: 'Intimação para apresentação de alegações finais no prazo de 15 dias. Processo em fase de instrução.',
        suggestedAction: 'Elaborar alegações finais destacando os pontos favoráveis da instrução probatória',
        pendingDocs: ['Alegações Finais', 'Memorial descritivo'],
        draftPetition: 'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO...\n\n[Modelo de petição gerado por IA]'
      }

      setExpedientes((current) =>
        (current || []).map(e => e.id === exp.id ? analyzed : e)
      )
      setSelectedExp(analyzed)
      setAnalyzing(false)
      toast.success('Análise concluída com sucesso')
    }, 2000)
  }

  const handleActivateJustinE = () => {
    setShowJustinEDialog(true)
  }

  const handleSelectTask = (task: string) => {
    setSelectedTask(task)
    setAnalyzing(true)
    
    setTimeout(() => {
      if (selectedExp) {
        const analyzed: Expediente = {
          ...selectedExp,
          analyzed: true,
          summary: `Mrs. Justin-e analisou a intimação e identificou: ${task}. Prazo de 15 dias corridos iniciando em D+1 da intimação.`,
          suggestedAction: `Executar tarefa: ${task}. Workflow de controladoria criado automaticamente.`,
          pendingDocs: ['Documento Principal', 'Comprovantes'],
          draftPetition: 'EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO...\n\n[Minuta gerada por Mrs. Justin-e]'
        }

        setExpedientes((current) =>
          (current || []).map(e => e.id === selectedExp.id ? analyzed : e)
        )
        setSelectedExp(analyzed)
      }
      
      setAnalyzing(false)
      setShowJustinEDialog(false)
      toast.success('Mrs. Justin-e concluiu a análise e criou o workflow!')
    }, 2500)
  }

  const suggestedTasks = [
    'Apresentar alegações finais',
    'Juntar documentos complementares',
    'Manifestar sobre documentos juntados',
    'Especificar provas',
    'Cumprir diligência determinada',
    'Apresentar rol de testemunhas'
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Painel de Expedientes</h1>
        <p className="text-muted-foreground mt-1">
          Caixa de entrada inteligente com análise de IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expedientes Recentes</CardTitle>
              <CardDescription>Intimações aguardando análise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(expedientes || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum expediente cadastrado. Use "Análise em Lote" para adicionar.
                </p>
              ) : (
                (expedientes || []).map((exp) => (
                  <div
                    key={exp.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedExp?.id === exp.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                    onClick={() => setSelectedExp(exp)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{exp.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(exp.receivedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {exp.analyzed ? (
                        <Badge variant="default">Analisado</Badge>
                      ) : (
                        <Badge variant="outline">Pendente</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedExp ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{selectedExp.type}</CardTitle>
                      <CardDescription className="mt-1">
                        Recebido em {new Date(selectedExp.receivedAt).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    {!selectedExp.analyzed && (
                      <div className="flex gap-2">
                        <Button onClick={() => handleActivateJustinE()} disabled={analyzing} variant="default">
                          <Brain className="w-4 h-4 mr-2" weight="fill" />
                          {analyzing ? 'Analisando...' : 'Ativar Justin-e'}
                        </Button>
                        <Button onClick={() => handleAnalyze(selectedExp)} disabled={analyzing} variant="outline">
                          <Sparkle className="w-4 h-4 mr-2" weight="fill" />
                          Análise Padrão
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Conteúdo Original</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap document-content">{selectedExp.content}</p>
                    </div>
                  </div>

                  {selectedExp.analyzed && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Sparkle className="w-4 h-4 text-accent" weight="fill" />
                          Resumo Inteligente
                        </h3>
                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                          <p className="text-sm">{selectedExp.summary}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold mb-2">Ação Sugerida</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">{selectedExp.suggestedAction}</p>
                        </div>
                      </div>

                      {selectedExp.pendingDocs && selectedExp.pendingDocs.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold mb-2">Documentos Pendentes</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedExp.pendingDocs.map((doc, idx) => (
                              <Badge key={idx} variant="outline">
                                <FileText className="w-3 h-3 mr-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedExp.draftPetition && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              <Sparkle className="w-4 h-4 text-accent" weight="fill" />
                              Minuta de Petição Gerada
                            </h3>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Exportar
                            </Button>
                          </div>
                          <Textarea
                            value={selectedExp.draftPetition}
                            className="min-h-[200px] document-content"
                            readOnly
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Tray className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Selecione um expediente</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Escolha um expediente da lista para visualizar e analisar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showJustinEDialog} onOpenChange={setShowJustinEDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Brain className="w-7 h-7 text-primary" weight="fill" />
              Mrs. Justin-e - Análise de Intimação
            </DialogTitle>
            <DialogDescription>
              Resumo: {selectedExp?.summary || 'Intimação recebida aguardando análise detalhada'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
              <p className="text-sm font-medium text-foreground mb-2">
                📊 Análise Rápida (95% de precisão em menos de 1 minuto)
              </p>
              <p className="text-xs text-muted-foreground">
                Identifiquei que esta intimação requer ação. Selecione a tarefa mais pertinente ao caso:
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Tarefas Sugeridas:
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {suggestedTasks.map((task, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectTask(task)}
                    disabled={analyzing}
                    className="p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{task}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Após selecionar, Mrs. Justin-e irá:
                <br />• Calcular prazos automaticamente (D-1, D-2 ou D-n)
                <br />• Criar workflow de controladoria
                <br />• Preparar atendimento
                <br />• Gerar minuta de petição
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Tray(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM48,48H208V152H176a16,16,0,0,0-16,16v40H96V168a16,16,0,0,0-16-16H48Zm0,160V168H80v40Zm160,0H176V168h32Z" />
    </svg>
  )
}
