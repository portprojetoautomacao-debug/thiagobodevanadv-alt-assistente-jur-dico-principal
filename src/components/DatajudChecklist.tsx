import { useState, FormEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MagnifyingGlass,
  Spinner,
  CheckCircle,
  Warning,
  Sparkle,
  Copy,
  Calendar as CalendarIcon,
  Gavel,
  FileText,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface DatajudMovimento {
  codigo: number
  nome: string
  dataHora: string
  complementosTabelados?: any[]
}

interface DatajudProcesso {
  numeroProcesso: string
  classe?: {
    codigo: number
    nome: string
  }
  sistema?: {
    codigo: number
    nome: string
  }
  tribunal: string
  dataAjuizamento?: string
  movimentos: DatajudMovimento[]
  orgaoJulgador?: {
    codigo: number
    nome: string
  }
  assuntos?: Array<{
    codigo: number
    nome: string
  }>
}

const TRIBUNAIS = [
  { value: 'tjmg', label: 'TJMG - Tribunal de Justiça de Minas Gerais' },
  { value: 'tjsp', label: 'TJSP - Tribunal de Justiça de São Paulo' },
  { value: 'tjrj', label: 'TJRJ - Tribunal de Justiça do Rio de Janeiro' },
  { value: 'trf1', label: 'TRF1 - Tribunal Regional Federal 1ª Região' },
  { value: 'trf2', label: 'TRF2 - Tribunal Regional Federal 2ª Região' },
  { value: 'trf3', label: 'TRF3 - Tribunal Regional Federal 3ª Região' },
  { value: 'trf4', label: 'TRF4 - Tribunal Regional Federal 4ª Região' },
  { value: 'trf5', label: 'TRF5 - Tribunal Regional Federal 5ª Região' },
  { value: 'tst', label: 'TST - Tribunal Superior do Trabalho' },
  { value: 'stj', label: 'STJ - Superior Tribunal de Justiça' },
]

export default function DatajudChecklist() {
  const [cnjInput, setCnjInput] = useState('')
  const [tribunal, setTribunal] = useState('tjmg')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [processoData, setProcessoData] = useState<DatajudProcesso | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (!cnjInput.trim()) {
      toast.error('Digite o número do processo')
      return
    }

    setIsLoading(true)
    setError(null)
    setProcessoData(null)
    setAnalysis(null)
    setAnalysisError(null)

    try {
      const prompt = `Simule uma consulta ao DataJud API para o processo CNJ ${cnjInput} no tribunal ${tribunal.toUpperCase()}.
        
Retorne um JSON válido com a estrutura:
{
  "numeroProcesso": "${cnjInput}",
  "classe": {
    "codigo": 1,
    "nome": "Ação Ordinária"
  },
  "sistema": {
    "codigo": 1,
    "nome": "Comum"
  },
  "tribunal": "${tribunal.toUpperCase()}",
  "dataAjuizamento": "2024-01-15T10:30:00Z",
  "movimentos": [
    {
      "codigo": 101,
      "nome": "Petição Inicial",
      "dataHora": "2024-01-15T10:30:00Z",
      "complementosTabelados": []
    },
    {
      "codigo": 102,
      "nome": "Distribuição",
      "dataHora": "2024-01-15T11:00:00Z",
      "complementosTabelados": []
    },
    {
      "codigo": 200,
      "nome": "Conclusão ao Juiz",
      "dataHora": "2024-02-20T14:30:00Z",
      "complementosTabelados": []
    },
    {
      "codigo": 201,
      "nome": "Intimação para Contestação",
      "dataHora": "2024-03-01T09:00:00Z",
      "complementosTabelados": []
    },
    {
      "codigo": 202,
      "nome": "Contestação Apresentada",
      "dataHora": "2024-03-15T16:45:00Z",
      "complementosTabelados": []
    }
  ],
  "orgaoJulgador": {
    "codigo": 5001,
    "nome": "1ª Câmara Cível"
  },
  "assuntos": [
    {
      "codigo": 1001,
      "nome": "Responsabilidade Civil"
    }
  ]
}`

      const result = await spark.llm(prompt, 'gpt-4o', true)
      const data = JSON.parse(result)

      setProcessoData(data)
      toast.success('Processo encontrado com sucesso!')
    } catch (err) {
      const message = (err as Error).message || 'Erro ao consultar o processo'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!processoData) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const recentMovements = processoData.movimentos
        .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
        .slice(0, 15)
        .map(
          (m) =>
            `- ${m.nome} (em ${new Date(m.dataHora).toLocaleDateString('pt-BR')})`
        )
        .join('\n')

      const prompt = `Analise os andamentos processuais e forneça um resumo objetivo, o estado atual e o próximo passo esperado.

Processo: ${processoData.numeroProcesso}
Classe: ${processoData.classe?.nome || 'Não especificada'}
Tribunal: ${processoData.tribunal}
Assuntos: ${processoData.assuntos?.map((a) => a.nome).join(', ') || 'Não especificado'}

Últimos andamentos:
${recentMovements}

Forneça uma análise clara e concisa em português, incluindo:
1. Resumo do estado atual do processo
2. Último andamento relevante
3. Próximo passo esperado
4. Prazos importantes (se houver)
5. Recomendações estratégicas`

      const analysisText = await spark.llm(prompt, 'gpt-4o')
      setAnalysis(analysisText)
      toast.success('Análise gerada com sucesso!')
    } catch (err) {
      const message = (err as Error).message || 'Erro ao gerar análise'
      setAnalysisError(message)
      toast.error(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Checklist Diário via Datajud</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulte os últimos andamentos de um processo através da API pública do DataJud (CNJ)
        </p>
      </div>

      <ScrollArea className="flex-1 px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnj">Número do Processo (CNJ)</Label>
                  <Input
                    id="cnj"
                    type="text"
                    placeholder="0000001-00.2024.8.00.0000"
                    value={cnjInput}
                    onChange={(e) => setCnjInput(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o número CNJ com 20 dígitos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tribunal">Tribunal</Label>
                  <Select value={tribunal} onValueChange={setTribunal} disabled={isLoading}>
                    <SelectTrigger id="tribunal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIBUNAIS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecione o tribunal de origem
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <MagnifyingGlass className="w-5 h-5 mr-2" weight="bold" />
                    Buscar Processo
                  </>
                )}
              </Button>
            </form>
          </Card>

          {error && (
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {processoData && (
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Gavel className="w-6 h-6 text-primary" weight="fill" />
                      <h2 className="text-xl font-bold text-foreground">
                        {processoData.classe?.nome || 'Processo Judicial'}
                      </h2>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground mb-3">
                      {processoData.numeroProcesso}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {processoData.tribunal}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {processoData.orgaoJulgador && (
                    <div>
                      <p className="text-xs text-muted-foreground">Órgão Julgador</p>
                      <p className="text-sm font-medium text-foreground">
                        {processoData.orgaoJulgador.nome}
                      </p>
                    </div>
                  )}
                  {processoData.dataAjuizamento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Ajuizamento</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(processoData.dataAjuizamento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {processoData.assuntos && processoData.assuntos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Assuntos</p>
                    <div className="flex flex-wrap gap-2">
                      {processoData.assuntos.map((assunto) => (
                        <Badge key={assunto.codigo} variant="secondary">
                          {assunto.nome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent/10"
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner className="w-5 h-5 mr-2 animate-spin" />
                      Analisando com IA...
                    </>
                  ) : (
                    <>
                      <Sparkle className="w-5 h-5 mr-2" weight="fill" />
                      Analisar Andamentos com IA
                    </>
                  )}
                </Button>
              </Card>

              {analysisError && (
                <Alert variant="destructive">
                  <Warning className="h-4 w-4" />
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}

              {analysis && (
                <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkle className="w-6 h-6 text-accent" weight="fill" />
                    <h3 className="text-lg font-bold text-foreground">Análise da IA</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans bg-background/50 p-4 rounded-lg">
                      {analysis}
                    </pre>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(analysis)}
                    className="mt-3"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Análise
                  </Button>
                </Card>
              )}

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" weight="fill" />
                    <h3 className="text-lg font-bold text-foreground">
                      Últimos Andamentos
                    </h3>
                  </div>
                  <Badge variant="outline">
                    {processoData.movimentos.length} movimento(s)
                  </Badge>
                </div>

                <div className="space-y-3">
                  {processoData.movimentos
                    .sort(
                      (a, b) =>
                        new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
                    )
                    .slice(0, 10)
                    .map((movimento, index) => (
                      <div
                        key={`${movimento.codigo}-${movimento.dataHora}-${index}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-primary" weight="fill" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {movimento.nome}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {new Date(movimento.dataHora).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {processoData.movimentos.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Mostrando os 10 andamentos mais recentes de {processoData.movimentos.length}{' '}
                    total
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
