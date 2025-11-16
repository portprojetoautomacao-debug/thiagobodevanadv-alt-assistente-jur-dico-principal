import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Database, Sparkle, FileText, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateRealisticProcesses, initializeWithSampleData } from '@/lib/data-initializer'
import type { Process } from '@/types'

interface DataInitializerProps {
  onDataGenerated: (processes: Process[]) => void
}

export default function DataInitializer({ onDataGenerated }: DataInitializerProps) {
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(10)

  const handleLoadSampleData = async () => {
    setLoading(true)
    try {
      const processes = await initializeWithSampleData()
      onDataGenerated(processes)
      toast.success(`${processes.length} processos de exemplo carregados com sucesso!`)
    } catch (error) {
      toast.error('Erro ao carregar dados de exemplo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateData = async () => {
    if (count < 1 || count > 50) {
      toast.error('Por favor, escolha entre 1 e 50 processos')
      return
    }

    setLoading(true)
    try {
      toast.info(`Gerando ${count} processos com IA... Isso pode levar de 10 a 30 segundos.`)
      const processes = await generateRealisticProcesses(count)
      
      if (processes.length === 0) {
        toast.error('Nenhum processo foi gerado. Tente novamente.')
        return
      }

      onDataGenerated(processes)
      toast.success(`${processes.length} processos jurídicos realistas gerados com sucesso! ✨`)
    } catch (error) {
      toast.error('Erro ao gerar dados. Verifique sua conexão e tente novamente.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Database size={64} className="text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Sistema Sem Dados</CardTitle>
          <CardDescription className="text-base">
            Para começar a usar o Assistente Jurídico, você precisa carregar alguns processos.
            Escolha uma das opções abaixo:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={24} className="text-primary" />
                  <CardTitle className="text-lg">Dados de Exemplo</CardTitle>
                </div>
                <CardDescription>
                  Carregue 10 processos pré-configurados e diversos para testar o sistema rapidamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLoadSampleData} 
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <CircleNotch className="animate-spin" size={20} />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <FileText size={20} />
                      Carregar Exemplos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkle size={24} className="text-primary" weight="fill" />
                  <CardTitle className="text-lg">Gerar com IA</CardTitle>
                </div>
                <CardDescription>
                  Use IA para criar processos jurídicos brasileiros altamente realistas, com dados variados, prazos específicos e informações contextualizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="count">Quantidade de processos (1-50)</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                    disabled={loading}
                    placeholder="Ex: 10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cada processo será único com nomes, comarcas, varas e prazos diferentes
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateData} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <CircleNotch className="animate-spin" size={20} />
                      Gerando processos realistas...
                    </>
                  ) : (
                    <>
                      <Sparkle size={20} weight="fill" />
                      Gerar Processos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Você também pode adicionar processos manualmente depois usando o botão "Novo Processo"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
