import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Database, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import DJENConsulta from '@/components/DJENConsulta'

export default function DatabaseQueries() {
  const [cnjQuery, setCnjQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [datajudResult, setDatajudResult] = useState<any>(null)

  const handleDatajudQuery = () => {
    if (!cnjQuery) {
      toast.error('Digite um número CNJ válido')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setDatajudResult({
        cnj: cnjQuery,
        tribunal: 'TRT 2ª Região - São Paulo',
        classe: 'Reclamação Trabalhista',
        assunto: 'Horas Extras / Adicional Noturno',
        valor: 'R$ 50.000,00',
        distribuicao: '15/03/2023',
        movimentos: [
          { data: '15/03/2023', descricao: 'Distribuição' },
          { data: '10/04/2023', descricao: 'Contestação apresentada' },
          { data: '20/05/2023', descricao: 'Audiência de instrução realizada' },
          { data: '10/06/2023', descricao: 'Alegações finais - Autor' },
          { data: '15/06/2023', descricao: 'Alegações finais - Réu' },
        ]
      })
      setLoading(false)
      toast.success('Consulta realizada no Datajud')
    }, 1500)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Consultas a Bases de Dados</h1>
        <p className="text-muted-foreground mt-1">
          Datajud e DJEN - Informações oficiais do judiciário
        </p>
      </div>

      <Tabs defaultValue="datajud" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="datajud">Datajud</TabsTrigger>
          <TabsTrigger value="djen">DJEN</TabsTrigger>
        </TabsList>

        <TabsContent value="datajud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Base Nacional de Dados do Poder Judiciário
              </CardTitle>
              <CardDescription>
                Consulte andamentos processuais oficiais pelo número CNJ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="cnj-query">Número CNJ</Label>
                  <Input
                    id="cnj-query"
                    placeholder="0000000-00.0000.0.00.0000"
                    value={cnjQuery}
                    onChange={(e) => setCnjQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleDatajudQuery} disabled={loading}>
                    <MagnifyingGlass className="w-4 h-4 mr-2" />
                    Consultar
                  </Button>
                </div>
              </div>

              {datajudResult && (
                <div className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CNJ</p>
                      <p className="text-sm font-mono">{datajudResult.cnj}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tribunal</p>
                      <p className="text-sm">{datajudResult.tribunal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Classe</p>
                      <p className="text-sm">{datajudResult.classe}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Distribuição</p>
                      <p className="text-sm">{datajudResult.distribuicao}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Assunto</p>
                      <p className="text-sm">{datajudResult.assunto}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Valor da Causa</p>
                      <p className="text-sm font-semibold">{datajudResult.valor}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Movimentações</h3>
                    <div className="space-y-2">
                      {datajudResult.movimentos.map((mov: any, idx: number) => (
                        <div key={idx} className="flex gap-3 p-3 bg-muted rounded-lg">
                          <div className="flex-shrink-0 w-24">
                            <Badge variant="outline">{mov.data}</Badge>
                          </div>
                          <p className="text-sm flex-1">{mov.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="djen" className="space-y-4">
          <DJENConsulta />
        </TabsContent>
      </Tabs>
    </div>
  )
}
