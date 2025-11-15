import { useState, FormEvent } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
  Select
  SelectV
import {
  Spinner,
  Warning,
  Copy,
  Gavel,
} from '

  codigo: 
  dataHora: st
}
interface 
  class
    nome: string
  sistem
    nome: s
  tribunal: string
  movimentos: DatajudMovimento

  }
    codigo: numb
  }>

  { value: 'tjmg', label: 'TJMG
 

  { value: 'trf4', label: '
  { value: 'tst', label:
]
export default fun
  const [tribuna
  c
  const [anal
  const [analysisE
  const handleSe
   
      return

    setError(null)
    setAnalysis(nul

      const prom
Ret
  "numeroProcesso": 
    "codigo": 1,
  },
    
 

    {
      "nome": "Petição Inicial",
      "complementosTabelados": []
    {
      "nome": "Distribuição",
      "complementosTabelados": []
    {
      "nome": "Conclusão ao Juiz",
      "complementosTabelados": []
    {
      "nome": "Intimação para Contestação",
 

      "nome": "Contestação Apresentada",
      "complementosTabelados": []
  ],
    "codigo": 5001,
  },
    {
      "nome": "Responsabilidade Civil"
  ]


      setProcessoData(data)
    } catch (err) {
      setError(message)
    } finally {
    }


    setIsAnalyzing(tru

      const recentMovemen
        .slice(0, 15)
          (m) =>



Classe: ${processoData.classe?.nome || 'Não especificada'}
Assuntos
Últimos andamentos:

1. Resumo do estado atual do processo
3. Próximo passo espe
5. Recomendações estraté
      const analysisText = await spa
      toast.
      const message = 
      toast.error(messag
      setIsAnalyzing(false)
  }
  const copyToClipboard = (text: string) => {
    toast.success('Copiado para a área de transferên

    <div clas
        <h1 className="text-
          Consulte os últimos andamentos
      </div>
      <ScrollArea className="flex-1 px-6 
          <Car
             
                  <Label htm
                    id="cnj"
                    placeholder="0000001-00.2024.
                    onChange={(e) => setC
              
             
                </div>
                <div className="space-y-2"
                  <Select value={tribunal} onValu
                      <SelectValue />
              
             
                        </Se
                    </SelectContent>
                  <p className="text-xs text-mute
                  </p>
              
             
                  <>
                    Consultando...
                ) : (
                    <MagnifyingGlass clas
             
            
          </Card>
          {error && (
              <Warning className="h-4
            

            <
                <div classNam
                    <div className="flex items
             
           
         
       

                  </Badge>


                      <p cl
                        {processoData.orgaoJulgador.nom
                   
                  {processoData.dataAjuizamento && (
                      <
                        {n
               
                </div>
     
   

                          {assunto.no
                      ))}


                  onClick=

         
                    <>
                      Analisando com IA...
                  ) :
             
                
                </Button>

                <Al

              )}
              {analysis && (
        
                    <h3 className="text-lg font-
                  <div className="prose prose-sm max-w-none">
                      {analysis}
                  </div>
        
                    onClick
                  >
        
                </Card>

                <div className="flex 
                    <FileText cla
                      Últimos Andamentos
                  </div>
       

                <div className="space-y-3">
                    .sort(
                        new Date(b.dataHora).getTi
                   
                      <div
                        classNa
                        <d
               
                        </d
     
   

                              {new Date(movim
                          </div>
                      </div>
   

          
                  </p>
              </Card>
          )}
      </ScrollArea>
  )




























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
