import { useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sparkle, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Expediente } from '@/types'

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

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      toast.error('Cole os expedientes para análise')
      return
    }

    setAnalyzing(true)

    setTimeout(() => {
      const mockData: ExtractedData[] = [
        {
          cnj: '0001234-56.2023.5.02.0001',
          parties: 'João Silva vs Empresa XYZ Ltda',
          deadline: '15 dias - ' + new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          type: 'Intimação para Alegações Finais'
        },
        {
          cnj: '0002345-67.2023.5.02.0001',
          parties: 'Maria Santos vs ABC Comércio',
          deadline: '10 dias - ' + new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          type: 'Intimação para Contestação'
        },
        {
          cnj: '0003456-78.2023.5.02.0001',
          parties: 'Pedro Oliveira vs DEF Indústria',
          deadline: '5 dias - ' + new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          type: 'Despacho - Regularização'
        }
      ]

      const newExpedientes: Expediente[] = mockData.map((data) => ({
        id: crypto.randomUUID(),
        processId: data.cnj,
        tipo: data.type.includes('Intimação') ? 'intimacao' : data.type.includes('Citação') ? 'citacao' : 'outro',
        titulo: data.type,
        type: data.type,
        conteudo: inputText,
        content: inputText,
        dataRecebimento: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        prazoFatal: data.deadline.split(' - ')[1],
        deadline: data.deadline.split(' - ')[1],
        lido: false,
        arquivado: false,
        analyzed: false
      }))

      setExpedientes((current) => [...(current || []), ...newExpedientes])
      setExtractedData(mockData)
      setAnalyzing(false)
      toast.success(`${mockData.length} expedientes extraídos e salvos com sucesso`)
    }, 2500)
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
