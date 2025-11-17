import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTri
import { Upload, FilePdf, CheckCircle, XCircl
import type { Cliente, PDFUploadHistory } from '@/typ
import { ptBR } from 'date-fns/locale'
interface ExtractedData {
  cpfCnpj?: string
  telefone?: string
  cidade?: string
  cep?: string
  numeroProcesso?: string
  observacoes?: string

interface ExtractedData {
  nome?: string
  cpfCnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  tipo?: 'fisica' | 'juridica'
  numeroProcesso?: string
  dataDocumento?: string
  observacoes?: string
}

export default function PDFUploader() {
        const text = new TextDecoder('utf-8').decode(uint8Array)
        const cleanedText = text
          .replace(/\s+/g, ' ')
        
      }
    })

    const prompt = spark.llmPrompt`Você é um assistente jurídico especializado em ext

${text}
Extraia APENAS as informações do cliente
Retorne um JSON
  "nome": "Nome completo do cliente",
  "email": "Email se encontrado",
  "endereco": 
  "esta
  "tipo": "fisica ou juridica",
  "dataDocumento": "Data do documento no formato YYYY-MM
}
Regras 
- CPF/CNPJ: remova pontos, 
- CEP: remova traços
- No campo "observacoes", inclua 
Retor
   

    } catch (error) {
      throw new Error('Falha ao proce
  }
  const handleExtract = async () =>
      toast.error('Selecione um arquivo PDF')
    }
        const text = new TextDecoder('utf-8').decode(uint8Array)
      fi
        const cleanedText = text
          .replace(/[^\x20-\x7E\n\r\u00C0-\u00FF]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        
        resolve(cleanedText)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const extractDataWithAI = async (text: string): Promise<ExtractedData> => {
    const prompt = spark.llmPrompt`Você é um assistente jurídico especializado em extrair dados de documentos legais.

Analise o texto abaixo extraído de uma procuração ou contrato e extraia as seguintes informações do CLIENTE (não do advogado):

${text}

Extraia APENAS as informações do cliente/contratante (a pessoa que está contratando os serviços jurídicos ou outorgando a procuração).

Retorne um JSON com a seguinte estrutura:
{
  "nome": "Nome completo do cliente",
  "cpfCnpj": "CPF ou CNPJ (apenas números)",
  "email": "Email se encontrado",
  "telefone": "Telefone com DDD (apenas números)",
  "endereco": "Endereço completo",
  "cidade": "Cidade",
  "estado": "Sigla do estado (ex: SP, RJ)",
  "cep": "CEP (apenas números)",
  "tipo": "fisica ou juridica",
  "numeroProcesso": "Número do processo CNJ se mencionado",
  "dataDocumento": "Data do documento no formato YYYY-MM-DD",
  "observacoes": "Qualquer informação relevante adicional sobre o cliente"
}

Regras importantes:
- Se não encontrar um campo, use null
- CPF/CNPJ: remova pontos, traços e barras
- Telefone: remova parênteses, espaços e traços
- CEP: remova traços
- Para "tipo": se encontrar CNPJ ou razão social, use "juridica", caso contrário "fisica"
- No campo "observacoes", inclua informações como: estado civil, profissão, nacionalidade, etc.

Retorne APENAS o JSON válido, sem explicações.`

    try {
      const result = await spark.llm(prompt, 'gpt-4o', true)
      const parsed = JSON.parse(result)
      return parsed
    } catch (error) {
      console.error('Error parsing AI response:', error)
      throw new Error('Falha ao processar dados do documento')
    }
  }

  const handleExtract = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo PDF')
      return
    }

      case 'error':
    }

    new Date(b.uploadedAt).getTime() 

    <div className="container mx-auto p-6 ma
        <h1 classNam
          Faça upload de uma procu
      </div>
      <Tabs defaultValue="upload" className
          <TabsTrigger valu
     

            Histórico ({sortedHistory.length})

        <
            <Card className="glassmorphic bor
                <CardTitle className="flex items-center gap-2">

                <CardDescription>
                </CardDescription>
       

                    id="pdf-file"
                    accept="application/pdf"

                  />

      
                    <div className=
                      <p className="t
                      </p>
               


                  onClick={handleExtract}
                  className="w-full 
               
                  
         
       
      
                    </>
                </But
                {extractionStatus === 'processi
                    <SpinnerGap cl
      
                  </Alert>

                  <Alert classN
               
                    </Al
                )}
                {extractionStatus === 'error' && (
                    <XCircle className="text-destructive" size={16} weight="fill" />
               
                  
         

      
                  <CheckCircle className="text-pr
               
                  Revise e e
     
   

                      Nenhum dado 
                    <p classNa

                ) : (
                    <div className="space-y-2">
                      <Input
                        value={extractedDat
                        placeholder="No
                    </div>
                    <div className="grid grid
                        <Label htmlFor="t
                          id="tipo"
                          onChange=
                        >
                      
                      </div>
                      <div className="spac
                          {extractedData.t
     

                          placeholder={extractedData.tipo ===
    

                      <div classNam
                        <Input
                          type="email"
                          onChange={(e) => handleE
                  

       
     
    
                        />
    
                    <div 
                      <Inp
                        value={
                        place
   

                        <Label htmlFor="cidade">Cidade</Label>
                          id="cidade"
   


                        <Label
                          id="es
                          onChange={(e) => ha
     
   

                      <Label htmlFor="cep">CEP<
                        id="cep"
                        onChange={(e) => handle
   

                      <div className="space-y-2">
                     
                        
                          placeholder="0000000-00.0000.0.00.0000"
                     
                    )}
      case 'error':
        return <Badge variant="destructive"><XCircle size={12} weight="fill" /> Erro</Badge>
    }
  }

  const sortedHistory = [...(uploadHistory || [])].sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-2">Upload de Procuração/Contrato</h1>
        <p className="text-muted-foreground">
          Faça upload de uma procuração ou contrato em PDF para extrair automaticamente os dados do cliente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="text-primary" size={24} weight="duotone" />
              Upload de Documento
            </CardTitle>
            <CardDescription>
              Selecione um arquivo PDF (máximo 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Arquivo PDF</Label>
              <Input
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="cursor-pointer"
                disabled={isProcessing}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <FilePdf className="text-destructive" size={24} weight="duotone" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <Button
              onClick={handleExtract}
              disabled={!selectedFile || isProcessing}
              className="w-full button-gradient"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <SpinnerGap className="animate-spin" size={20} />
                  Processando...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Extrair Dados
                </>
              )}
            </Button>

            {extractionStatus === 'processing' && (
              <Alert className="border-primary/50 bg-primary/5">
                <SpinnerGap className="animate-spin text-primary" size={16} />
                <AlertDescription>
                  Processando documento... Isso pode levar alguns segundos.
                </AlertDescription>
              </Alert>
            )}

            {extractionStatus === 'success' && (
              <Alert className="border-primary/50 bg-primary/5">
                <CheckCircle className="text-primary" size={16} weight="fill" />
                <AlertDescription>
                  Dados extraídos com sucesso! Revise os campos ao lado e salve o cliente.
                </AlertDescription>
              </Alert>
            )}

            {extractionStatus === 'error' && (
              <Alert className="border-destructive/50 bg-destructive/5">
                <XCircle className="text-destructive" size={16} weight="fill" />
                <AlertDescription>
                  Erro ao processar o documento. Tente novamente ou cadastre manualmente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="glassmorphic border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-primary" size={24} weight="duotone" />
              Dados Extraídos
            </CardTitle>
            <CardDescription>
              Revise e edite os dados antes de salvar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!extractedData ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FilePdf className="text-muted-foreground/30 mb-4" size={64} weight="duotone" />
                <p className="text-muted-foreground">
                  Nenhum dado extraído ainda
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Faça upload de um PDF para começar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={extractedData.nome || ''}
                    onChange={(e) => handleEditField('nome', e.target.value)}
                    placeholder="Nome do cliente"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <select
                      id="tipo"
                      value={extractedData.tipo || 'fisica'}
                      onChange={(e) => handleEditField('tipo', e.target.value as 'fisica' | 'juridica')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="fisica">Pessoa Física</option>
                      <option value="juridica">Pessoa Jurídica</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">
                      {extractedData.tipo === 'juridica' ? 'CNPJ' : 'CPF'} *
                    </Label>
                    <Input
                      id="cpfCnpj"
                      value={extractedData.cpfCnpj || ''}
                      onChange={(e) => handleEditField('cpfCnpj', e.target.value)}
                      placeholder={extractedData.tipo === 'juridica' ? 'CNPJ' : 'CPF'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={extractedData.email || ''}
                      onChange={(e) => handleEditField('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={extractedData.telefone || ''}
                      onChange={(e) => handleEditField('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={extractedData.endereco || ''}
                    onChange={(e) => handleEditField('endereco', e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={extractedData.cidade || ''}
                      onChange={(e) => handleEditField('cidade', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">UF</Label>
                    <Input
                      id="estado"
                      value={extractedData.estado || ''}
                      onChange={(e) => handleEditField('estado', e.target.value.toUpperCase())}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={extractedData.cep || ''}
                    onChange={(e) => handleEditField('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>

                {extractedData.numeroProcesso && (
                  <div className="space-y-2">
                    <Label htmlFor="numeroProcesso">Número do Processo</Label>
                    <Input
                      id="numeroProcesso"
                      value={extractedData.numeroProcesso || ''}
                      onChange={(e) => handleEditField('numeroProcesso', e.target.value)}
                      placeholder="0000000-00.0000.0.00.0000"
                      disabled
                    />
                  </div>
                )}

                {extractedData.observacoes && (
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <textarea
                      id="observacoes"
                      value={extractedData.observacoes || ''}
                      onChange={(e) => handleEditField('observacoes', e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Informações adicionais"
                    />
                  </div>
                )}

                <Separator />


                  onClick={handleSaveClient}
                  className="w-full button-gradient"
                  size="lg"
                  disabled={!extractedData.nome || !extractedData.cpfCnpj}
                >
                  <CheckCircle size={20} weight="fill" />
                  Salvar Cliente


                <p className="text-xs text-muted-foreground text-center">
                  * Campos obrigatórios
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

  )

