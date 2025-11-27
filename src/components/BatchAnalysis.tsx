import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sparkle, Download, WarningCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Expediente } from '@/types'

/**
 * BatchAnalysis - Análise em lote de documentos jurídicos
 * 
 * Este componente usa IA REAL (Gemini) para extrair informações estruturadas
 * de múltiplos expedientes. NÃO há dados simulados.
 */

interface ExtractedData {
  cnj: string
  parties: string
  deadline: string
  type: string
}

export default function BatchAnalysis() {
  const [, setExpedientes] = useKV<Expediente[]>('expedientes', [])
  const [inputText, setInputText] = useState('')
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error('Cole os expedientes para análise')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      // Chama a API real do Gemini via proxy
      const response = await fetch('/_spark/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Você é um assistente jurídico especializado em extração de dados de expedientes.
Analise o texto e extraia informações estruturadas de cada processo/expediente mencionado.

Retorne um JSON com array "expedientes" contendo objetos com:
- cnj: número do processo no formato CNJ (0000000-00.0000.0.00.0000)
- parties: partes do processo (autor vs réu)
- deadline: prazo identificado (ex: "15 dias")
- type: tipo do documento (intimação, citação, despacho, etc)

Se não encontrar expedientes claros, retorne { "expedientes": [], "error": "mensagem" }.
Responda APENAS com JSON válido.`
            },
            {
              role: 'user',
              content: `Extraia os expedientes do seguinte texto:\n\n${inputText}`
            }
          ],
          temperature: 0.2
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      const content = data.response || data.choices?.[0]?.message?.content || ''

      // Parse do JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        if (parsed.error && (!parsed.expedientes || parsed.expedientes.length === 0)) {
          setError(parsed.error || 'Nenhum expediente encontrado no texto')
          toast.warning('Nenhum expediente identificado')
          setExtractedData([])
          return
        }

        const expedientes: ExtractedData[] = parsed.expedientes || []

        if (expedientes.length === 0) {
          setError('Nenhum expediente com dados estruturados foi encontrado')
          toast.warning('Nenhum expediente identificado')
          return
        }

        // Salva os expedientes extraídos
        const newExpedientes: Expediente[] = expedientes.map((data) => ({
          id: crypto.randomUUID(),
          processId: data.cnj || 'CNJ não identificado',
          tipo: data.type?.toLowerCase().includes('intimação') ? 'intimacao'
            : data.type?.toLowerCase().includes('citação') ? 'citacao'
              : 'outro',
          titulo: data.type || 'Documento',
          type: data.type || 'Documento',
          conteudo: inputText,
          content: inputText,
          dataRecebimento: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          prazoFatal: data.deadline || 'Não identificado',
          deadline: data.deadline || 'Não identificado',
          lido: false,
          arquivado: false,
          analyzed: true
        }))

        setExpedientes((current) => [...(current || []), ...newExpedientes])
        setExtractedData(expedientes)
        toast.success(`${expedientes.length} expediente(s) extraído(s) com IA Gemini`)
      } else {
        throw new Error('Resposta da IA não contém JSON válido')
      }
    } catch (err) {
      console.error('Erro na análise em lote:', err)
      setError('Erro ao analisar com IA. Verifique a conexão.')
      toast.error('Erro na análise com IA')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['CNJ', 'Partes', 'Prazo', 'Tipo'].join(','),
      ...extractedData.map(d => [d.cnj, d.parties, d.deadline, d.type].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expedientes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Dados exportados com sucesso')
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Análise de Documentos em Lote</h1>
        <p className="text-muted-foreground mt-1">
          Extraia informações estruturadas de múltiplos expedientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cole os Expedientes</CardTitle>
            <CardDescription>
              Cole o texto de um ou mais expedientes do PJe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui o conteúdo dos expedientes...&#10;&#10;Exemplo:&#10;INTIMAÇÃO - Processo nº 0001234-56.2023.5.02.0001&#10;Partes: João Silva vs Empresa XYZ Ltda&#10;Prazo: 15 dias para apresentação de alegações finais..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[400px] document-content"
            />
            <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
              <Sparkle className="w-4 h-4 mr-2" weight="fill" />
              {analyzing ? 'Analisando com IA...' : 'Analisar com Gemini AI'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados Extraídos</CardTitle>
                <CardDescription>
                  Informações estruturadas dos expedientes
                </CardDescription>
              </div>
              {extractedData.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {extractedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkle className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Aguardando análise</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cole os expedientes e clique em analisar
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CNJ</TableHead>
                      <TableHead>Partes</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.map((data, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{data.cnj}</TableCell>
                        <TableCell className="text-sm">{data.parties}</TableCell>
                        <TableCell className="text-sm">{data.deadline}</TableCell>
                        <TableCell className="text-sm">{data.type}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
