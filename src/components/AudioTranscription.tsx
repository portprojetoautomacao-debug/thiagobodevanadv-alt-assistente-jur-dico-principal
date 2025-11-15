import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MicrophoneStage, Stop, Upload, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function AudioTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [summary, setSummary] = useState('')
  const [actionItems, setActionItems] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  const handleStartRecording = () => {
    setIsRecording(true)
    toast.success('Gravação iniciada')
    
    setTimeout(() => {
      setIsRecording(false)
      handleProcessAudio()
    }, 3000)
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    handleProcessAudio()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      toast.success(`Arquivo ${file.name} selecionado`)
      handleProcessAudio()
    }
  }

  const handleProcessAudio = () => {
    setProcessing(true)

    setTimeout(() => {
      const mockTranscription = `Audiência de conciliação realizada em ${new Date().toLocaleDateString('pt-BR')}. Presentes: Autor, Réu e seus respectivos advogados.

Primeira proposta: Réu oferece pagamento de R$ 10.000,00 em parcela única.
Autor recusa a proposta inicial.

Segunda proposta: Réu aumenta para R$ 15.000,00, sendo R$ 5.000,00 à vista e R$ 10.000,00 em 10 parcelas.
Autor solicita prazo para análise.

Juiz suspende audiência e concede prazo de 5 dias para manifestação das partes sobre a proposta.`

      const mockSummary = 'Audiência de conciliação com duas propostas apresentadas pelo réu. Primeira: R$ 10.000 em parcela única (recusada). Segunda: R$ 15.000 parcelados (análise pendente). Prazo: 5 dias para manifestação.'

      const mockActions = [
        'Analisar proposta de R$ 15.000,00 com o cliente',
        'Preparar manifestação no prazo de 5 dias',
        'Calcular benefícios da proposta vs. sentença estimada',
        'Agendar reunião com cliente para decisão'
      ]

      setTranscription(mockTranscription)
      setSummary(mockSummary)
      setActionItems(mockActions)
      setProcessing(false)
      toast.success('Transcrição e análise concluídas')
    }, 2500)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transcrição de Áudio</h1>
        <p className="text-muted-foreground mt-1">
          Transcreva audiências e reuniões com análise inteligente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Captura de Áudio</CardTitle>
            <CardDescription>Grave em tempo real ou envie arquivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-8">
              {isRecording ? (
                <div className="relative">
                  <div className="w-24 h-24 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                    <MicrophoneStage className="w-12 h-12 text-destructive-foreground" weight="fill" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                  <MicrophoneStage className="w-12 h-12 text-primary-foreground" weight="fill" />
                </div>
              )}

              <Button
                size="lg"
                variant={isRecording ? 'destructive' : 'default'}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={processing}
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <Stop className="w-5 h-5 mr-2" weight="fill" />
                    Parar Gravação
                  </>
                ) : (
                  <>
                    <MicrophoneStage className="w-5 h-5 mr-2" weight="fill" />
                    Iniciar Gravação
                  </>
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild disabled={processing}>
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Upload className="w-5 h-5 mr-2" />
                  Enviar Arquivo
                  <input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Transcrição
                {transcription && (
                  <Badge variant="default">Gemini AI</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Texto convertido do áudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processing ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Sparkle className="w-16 h-16 text-accent animate-pulse mb-4" weight="fill" />
                  <p className="text-lg font-medium text-foreground">Processando áudio...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aguarde enquanto transcrevemos e analisamos
                  </p>
                </div>
              ) : transcription ? (
                <Textarea
                  value={transcription}
                  className="min-h-[300px] document-content"
                  readOnly
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MicrophoneStage className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">Aguardando áudio</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Grave ou envie um arquivo para transcrever
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {summary && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle className="w-5 h-5 text-accent" weight="fill" />
                    Sumário Executivo
                  </CardTitle>
                  <CardDescription>
                    Resumo dos pontos principais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                    <p className="text-sm">{summary}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle className="w-5 h-5 text-accent" weight="fill" />
                    Itens de Ação
                  </CardTitle>
                  <CardDescription>
                    Próximos passos identificados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-sm flex-1">{item}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
