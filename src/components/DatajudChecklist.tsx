import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/inpu
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/co
import { Label } from '@/components/ui/label'
  Spinner,
  Copy,
  Gavel,
  SelectV

  Spinner,
  dataHora: st
}
  Gavel,
  class

  sistem
    nome: s
}
  movimentos: DatajudMovimento
  class
  }
  sistem
    nome: s
  tribunal: string
  movimentos: DatajudMovimento
 
  }
  { value: 'trf4', label: '
  }>e: 'tst', label:

  { value: 'tjmg', label: 'TJMG
  const [tribuna
  c
  const [anal
  const [analysisE
  const handleSe
   
      return
  c
  const [anal
  const [analysisE

      const prom
      return
so": 
    "codigo": 1,
  },
    
 

  "numeroProcesso": 
    "codigo": 1,
  },
    
 

    {
      "nome": "Petição Inicial",
      "complementosTabelados": []
    {
      "nome": "Distribuição", Contestação",
      "complementosTabelados": []
    {
      "nome": "Conclusão ao Juiz",tada",
      "complementosTabelados": []
    {
    "codigo": 5001,
 
    {
      "nome": "Responsabilidade Civil"
  ]

    "codigo": 5001,
  },
    {
      "nome": "Responsabilidade Civil"
  ]


      setProcessoData(data)
    setIsAnalyzing(tru

    } finally {
        .slice(0, 15)
    (m) =>



Classe: ${processoData.classe?.nome || 'Não especificada'}
Assuntos
Últimos andamentos:

1. Resumo do estado atual do processo
3. Próximo passo espe
Classe: ${processoData.classe?.nome || 'Não especificada'}
Assuntos
Últimos andamentos:
ssage = 
1. Resumo do estado atual do processo
3. Próximo passo espe
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
          Consulte os últimos andamentos
                    placeholder="0000001-00.2024.
                    onChange={(e) => setC
          <Car
             
                  <Label htm
                    id="cnj"
                    placeholder="0000001-00.2024.
                    onChange={(e) => setC
              
                        </Se
                    </SelectContent>
                  <p className="text-xs text-mute
                  </p>
              
              
                  <>
                        </Se
                    </SelectContent>
                    <MagnifyingGlass clas
             
              
             
                  <>
                    Consultando...
                ) : (
                    <MagnifyingGlass clas
             
            
          </Card>Name="flex items
             
              <Warning className="h-4
            
       

                <div classNam
                    <div className="flex items
             
                      <p cl
         cessoData.orgaoJulgador.nom
       
.dataAjuizamento && (
                  </Badge>
        {n

                      <p cl
                        {processoData.orgaoJulgador.nom
                   
                  {processoData.dataAjuizamento && (
                          {assunto.no
                      ))}
               

        onClick=
   
        
                          {assunto.no
                      ))}


                  onClick=

         
                <Al

              )}
              {analysis && (
                
                    <h3 className="text-lg font-
        <div className="prose prose-sm max-w-none">
                <Al
               </div>
              )}
                    onClick
                  >
        
                </Card>

                <div className="flex 
        
                    onClick
                  >
       

                <div className="space-y-3">
                    .sort(
                        new Date(b.dataHora).getTi
                      Últimos Andamentos
                      <div
                        classNa
                        <d
               
                    .sort(d
                        new Date(b.dataHora).getTi
   

                              {new Date(movim
                          </div>
                      </div>
   
     
          
                  </p>
                              {new Date(movim
                          </div>
                      </div>
   



              </Card>


  )





















</SelectTrigger>


<SelectItem key={t.value} value={t.value}>
  {t.label}


                    </SelectTrigger>
                    <SelectContent>
                      {TRIBUNAIS.map((t) => (
                    Selecione o tribunal de origem
                  </p>
                </div>
                      ))}
                    </SelectContent>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                  </p>spin" />
                </div>
                  </>

                  <>
                {isLoading ? (
                  <>
                  </>
                )}
                  </>
                ) : (
          </Card>
                    <MagnifyingGlass className="w-5 h-5 mr-2" weight="bold" />
          {error && (
                  </>
              <Warning className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </Card>

          {processoData && (
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
mary" weight="fill" />
          {processoData && (
            <div className="space-y-4">l'}
                      </h2>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                      {processoData.numeroProcesso}
                      <Gavel className="w-6 h-6 text-primary" weight="fill" />
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {processoData.tribunal}
                  </Badge>
                </div>

                    </p>-1 md:grid-cols-2 gap-4 mb-4">
                  </div>ssoData.orgaoJulgador && (
                  <Badge variant="outline" className="text-sm">
                      <p className="text-xs text-muted-foreground">Órgão Julgador</p>
                  </Badge>
                </div>r.nome}
</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  )}
                  {processoData.dataAjuizamento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Ajuizamento</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(processoData.dataAjuizamento).toLocaleDateString('pt-BR')}
                    </div>
                    </div>
                  {processoData.dataAjuizamento && (
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Ajuizamento</p>
                      <p className="text-sm font-medium text-foreground">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Assuntos</p>
                    <div className="flex flex-wrap gap-2">
                  )}
                </div>ondary">

                {processoData.assuntos && processoData.assuntos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Assuntos</p>
                  </div>
                )}
                        <Badge key={assunto.codigo} variant="secondary">
                          {assunto.nome}
                        </Badge>
                      ))}isAnalyzing}
                    </div>
                  className="w-full border-accent text-accent hover:bg-accent/10"
                )}

                    <>
                  onClick={handleAnalyze} />
                      Analisando com IA...
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

                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans bg-background/50 p-4 rounded-lg">
                <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5">
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
