import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface SafraData {
  ano: number
  fechamentos: number
  emProducao: number
  transitoJulgado: number
  emExecucao: number
  concluidos: number
  ganho: number
  perdido: number
}

const safrasData: SafraData[] = [
  { ano: 2015, fechamentos: 2, emProducao: 2, transitoJulgado: 0, emExecucao: 0, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2017, fechamentos: 2, emProducao: 1, transitoJulgado: 1, emExecucao: 1, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2018, fechamentos: 5, emProducao: 5, transitoJulgado: 0, emExecucao: 0, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2019, fechamentos: 3, emProducao: 3, transitoJulgado: 0, emExecucao: 0, concluidos: 0, ganho: 0, perdido: 0 },
  { ano: 2020, fechamentos: 305, emProducao: 239, transitoJulgado: 66, emExecucao: 64, concluidos: 2, ganho: 1, perdido: 1 },
  { ano: 2021, fechamentos: 330, emProducao: 281, transitoJulgado: 58, emExecucao: 58, concluidos: 0, ganho: 0, perdido: 0 },
]

export default function OfficeManagement() {
  const [activeTab, setActiveTab] = useState('safra')

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão do escritório</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise de produtividade e qualidade dos processos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
          <TabsTrigger value="estoque">Estoque e Prospecção</TabsTrigger>
          <TabsTrigger value="tempo">Tempo e Honorários</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
          <TabsTrigger value="safra">Safra e Qualidade</TabsTrigger>
        </TabsList>

        <TabsContent value="produtividade" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Produtividade da Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Métricas de produtividade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Estoque e Prospecção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Análise de estoque em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tempo" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Tempo e Honorários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Gestão de tempo em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Custos Operacionais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Análise de custos em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safra" className="mt-6">
          <div className="space-y-6">
            {/* Safras de Processos Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Safras de processos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold">ANO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">FECHAMENTOS</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">EM PRODUÇÃO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">TRÂNSITO JULGADO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">EM EXECUÇÃO</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">CONCLUÍDOS</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">GANHO (%)</TableHead>
                        <TableHead className="bg-[#2a5a6f] text-white font-semibold text-center">PERDIDO (%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safrasData.map((safra, index) => (
                        <TableRow 
                          key={safra.ano}
                          className={`border-border ${index % 2 === 0 ? 'bg-[#1a3d4d]' : 'bg-[#1e4555]'} hover:bg-[#234a5c]`}
                        >
                          <TableCell className="font-medium text-white">{safra.ano}</TableCell>
                          <TableCell className="text-center text-white">{safra.fechamentos}</TableCell>
                          <TableCell className="text-center text-white">{safra.emProducao}</TableCell>
                          <TableCell className="text-center text-white">{safra.transitoJulgado}</TableCell>
                          <TableCell className="text-center text-white">{safra.emExecucao}</TableCell>
                          <TableCell className="text-center text-white">{safra.concluidos}</TableCell>
                          <TableCell className="text-center text-white">
                            {safra.ganho > 0 ? `${safra.ganho} (${Math.round((safra.ganho / safra.fechamentos) * 100)}%)` : '0 (0%)'}
                          </TableCell>
                          <TableCell className="text-center text-white">
                            {safra.perdido > 0 ? `${safra.perdido} (${Math.round((safra.perdido / safra.fechamentos) * 100)}%)` : '0 (0%)'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Relatórios Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">RELATÓRIOS</CardTitle>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1 bg-background border border-border rounded text-sm">
                      <option>Safra</option>
                    </select>
                    <select className="px-3 py-1 bg-background border border-border rounded text-sm">
                      <option>2021</option>
                      <option>2020</option>
                      <option>2019</option>
                    </select>
                    <Button variant="outline" size="sm">
                      + MAIS FILTROS
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead>PARTES</TableHead>
                        <TableHead>TIPO DE AÇÃO</TableHead>
                        <TableHead>ORIGEM DE AÇÃO</TableHead>
                        <TableHead>FASE</TableHead>
                        <TableHead>SITUAÇÃO</TableHead>
                        <TableHead>CARACTERÍSTICA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-border">
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum processo encontrado com os filtros selecionados
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
