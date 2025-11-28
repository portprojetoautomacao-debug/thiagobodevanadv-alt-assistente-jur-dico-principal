import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@/hooks/use-kv'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  FileText,
  GoogleLogo,
  Plus,
  ArrowsClockwise,
  Trash,
  PencilSimple,
  DownloadSimple,
  Clock,
  Warning,
  Robot,
  FilePdf,
  FileDoc,
  MagnifyingGlass,
  FolderOpen,
  Sparkle,
  CheckCircle,
  Eye,
  Copy,
  CaretDown,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { googleDocsService } from '@/lib/google-docs-service'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import {
  documentTemplates,
  replaceTemplateVariables,
  extractUnfilledVariables,
  type DocumentTemplate,
} from '@/lib/document-templates'
import type { Minuta, Process } from '@/types'
import { callGemini, isGeminiConfigured } from '@/lib/gemini-service'

// Verificar se as credenciais do Google estão configuradas
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || ''
const isGoogleConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY

// Prompt de sistema para a IA do editor
const AI_EDITOR_SYSTEM_PROMPT = `Você é um advogado brasileiro experiente especializado em redação jurídica.

Suas respostas devem:
- Usar linguagem jurídica formal e técnica
- Seguir as normas do Código de Processo Civil (CPC) e legislação correlata
- Citar artigos de lei e súmulas quando apropriado
- Ser claras, objetivas e bem estruturadas
- Utilizar HTML sem CSS para formatação:
  - Títulos em <h3>
  - Parágrafos em <p>
  - Listas em <ul>/<ol> com <li>
  - Destaques em <strong> e <u> quando necessário
- Não inclua <html>, <head> ou <body>, apenas o conteúdo da peça

Responda apenas com o conteúdo solicitado (trecho ou minuta), sem explicações fora do texto jurídico.`

export default function MinutasManager() {
  const [minutas, setMinutas] = useKV<Minuta[]>('minutas', [])
  const [processes] = useKV<Process[]>('processes', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMinuta, setEditingMinuta] = useState<Minuta | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('editor')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titulo: '',
    processId: '_none',
    tipo: 'peticao' as Minuta['tipo'],
    conteudo: '',
    status: 'rascunho' as Minuta['status'],
  })

  useEffect(() => {
    setIsAuthenticated(googleDocsService.isAuthenticated())
  }, [])

  // Carregar variáveis do processo selecionado
  useEffect(() => {
    if (formData.processId && formData.processId !== '_none') {
      const processo = (processes || []).find((p) => p.id === formData.processId)
      if (processo) {
        setVariableValues((prev) => ({
          ...prev,
          'processo.numero': processo.numeroCNJ || '',
          'processo.titulo': processo.titulo || '',
          'autor.nome': processo.autor || '',
          'reu.nome': processo.reu || '',
          comarca: processo.comarca || '',
          vara: processo.vara || '',
        }))
      }
    }
  }, [formData.processId, processes])

  const handleAuthGoogle = async () => {
    try {
      const success = await googleDocsService.authenticate()
      if (success) {
        setIsAuthenticated(true)
        toast.success('Autenticado com Google Docs!')
      } else {
        toast.error('Falha na autenticação')
      }
    } catch (error) {
      toast.error('Erro ao autenticar com Google')
      console.error(error)
    }
  }

  const handleCreateMinuta = async () => {
    if (!formData.titulo || !formData.conteudo) {
      toast.error('Preencha título e conteúdo')
      return
    }

    const novaMinuta: Minuta = {
      id: `minuta-${Date.now()}`,
      titulo: formData.titulo,
      processId: formData.processId !== '_none' ? formData.processId : undefined,
      tipo: formData.tipo,
      conteudo: formData.conteudo,
      status: formData.status,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      autor: 'current-user',
      criadoPorAgente: false,
    }

    setMinutas((current = []) => [...current, novaMinuta])

    resetForm()
    setIsDialogOpen(false)
    toast.success('Minuta criada com sucesso!')
  }

  const handleUpdateMinuta = async () => {
    if (!editingMinuta || !formData.titulo || !formData.conteudo) {
      toast.error('Preencha título e conteúdo')
      return
    }

    setMinutas((current = []) =>
      current.map((m) =>
        m.id === editingMinuta.id
          ? {
              ...m,
              titulo: formData.titulo,
              processId: formData.processId !== '_none' ? formData.processId : undefined,
              tipo: formData.tipo,
              conteudo: formData.conteudo,
              status: formData.status,
              atualizadoEm: new Date().toISOString(),
            }
          : m,
      ),
    )

    if (editingMinuta.googleDocsId) {
      const success = await googleDocsService.updateDocumentContent(
        editingMinuta.googleDocsId,
        formData.conteudo,
      )
      if (success) {
        toast.success('Minuta atualizada localmente e no Google Docs!')
      } else {
        toast.warning('Minuta atualizada localmente, mas erro ao sincronizar com Google Docs')
      }
    } else {
      toast.success('Minuta atualizada!')
    }

    setEditingMinuta(null)
    resetForm()
    setIsDialogOpen(false)
  }

  const resetForm = () => {
    setFormData({
      titulo: '',
      processId: '_none',
      tipo: 'peticao',
      conteudo: '',
      status: 'rascunho',
    })
    setSelectedTemplate(null)
    setVariableValues({})
    setError(null)
  }

  const handleOpenInGoogleDocs = async (minuta: Minuta) => {
    if (!isAuthenticated) {
      toast.error('Autentique-se com Google primeiro')
      return
    }

    if (minuta.googleDocsUrl) {
      googleDocsService.openDocument(minuta.googleDocsUrl)
      return
    }

    try {
      const result = await googleDocsService.createDocument(minuta)

      if (result) {
        setMinutas((current = []) =>
          current.map((m) =>
            m.id === minuta.id
              ? {
                  ...m,
                  googleDocsId: result.docId,
                  googleDocsUrl: result.url,
                  ultimaSincronizacao: new Date().toISOString(),
                }
              : m,
          ),
        )

        googleDocsService.openDocument(result.url)
        toast.success('Documento criado no Google Docs!')
      } else {
        toast.error('Erro ao criar documento no Google Docs')
      }
    } catch (error) {
      toast.error('Erro ao abrir no Google Docs')
      console.error(error)
    }
  }

  const handleSyncFromGoogleDocs = async (minuta: Minuta) => {
    if (!minuta.googleDocsId) {
      toast.error('Esta minuta não está vinculada ao Google Docs')
      return
    }

    setIsSyncing(minuta.id)

    try {
      const content = await googleDocsService.syncDocument(minuta.googleDocsId)

      if (content !== null) {
        setMinutas((current = []) =>
          current.map((m) =>
            m.id === minuta.id
              ? {
                  ...m,
                  conteudo: content,
                  atualizadoEm: new Date().toISOString(),
                  ultimaSincronizacao: new Date().toISOString(),
                }
              : m,
          ),
        )
        toast.success('Minuta sincronizada do Google Docs!')
      } else {
        toast.error('Erro ao sincronizar do Google Docs')
      }
    } catch (error) {
      toast.error('Erro ao sincronizar')
      console.error(error)
    } finally {
      setIsSyncing(null)
    }
  }

  const handleDeleteMinuta = (id: string) => {
    setMinutas((current = []) => current.filter((m) => m.id !== id))
    toast.success('Minuta excluída')
  }

  const handleEditMinuta = (minuta: Minuta) => {
    setEditingMinuta(minuta)
    setFormData({
      titulo: minuta.titulo,
      processId: minuta.processId || '_none',
      tipo: minuta.tipo,
      conteudo: minuta.conteudo,
      status: minuta.status,
    })
    setActiveTab('editor')
    setIsDialogOpen(true)
    setError(null)
  }

  const handleDuplicateMinuta = (minuta: Minuta) => {
    const novaMinuta: Minuta = {
      ...minuta,
      id: `minuta-${Date.now()}`,
      titulo: `${minuta.titulo} (cópia)`,
      status: 'rascunho',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      googleDocsId: undefined,
      googleDocsUrl: undefined,
      ultimaSincronizacao: undefined,
    }
    setMinutas((current = []) => [...current, novaMinuta])
    toast.success('Minuta duplicada!')
  }

  const handleApproveMinuta = (id: string) => {
    setMinutas((current = []) =>
      current.map((m) =>
        m.id === id
          ? { ...m, status: 'finalizada' as const, atualizadoEm: new Date().toISOString() }
          : m,
      ),
    )
    toast.success('Minuta aprovada!')
  }

  const handleExportPDF = async (minuta: Minuta) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Habilite pop-ups para exportar PDF')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${minuta.titulo}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              margin: 2cm;
              color: #000;
            }
            h1 { font-size: 14pt; text-align: center; margin-bottom: 2em; }
            h2 { font-size: 13pt; margin-top: 1.5em; }
            h3 { font-size: 12pt; margin-top: 1em; }
            p { text-align: justify; margin-bottom: 1em; }
            table { width: 100%; border-collapse: collapse; margin: 1em 0; }
            td, th { border: 1px solid #000; padding: 8px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${minuta.conteudo}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
    toast.success('Janela de impressão aberta - salve como PDF')
  }

  const handleExportDOCX = (minuta: Minuta) => {
    const blob = new Blob(
      [
        `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>${minuta.titulo}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; }
          </style>
        </head>
        <body>
          ${minuta.conteudo}
        </body>
      </html>
    `,
      ],
      { type: 'application/msword' },
    )

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${minuta.titulo}.doc`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Documento exportado!')
  }

  // Aplicar template
  const handleApplyTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template)
    setFormData((prev) => ({
      ...prev,
      titulo: prev.titulo || template.nome,
      tipo: template.tipo as Minuta['tipo'],
      conteudo: template.conteudo,
    }))
    toast.success(`Template "${template.nome}" aplicado!`)
  }

  // Preencher variáveis do template
  const handleFillVariables = () => {
    if (!selectedTemplate) return

    const filledContent = replaceTemplateVariables(formData.conteudo, variableValues)
    setFormData((prev) => ({ ...prev, conteudo: filledContent }))
    toast.success('Variáveis preenchidas!')
  }

  // IA integrada ao Tiptap (usando Gemini 2.5 Pro)
  const handleAIGenerate = useCallback(
    async (userPrompt: string): Promise<string> => {
      if (!userPrompt.trim()) {
        throw new Error('Prompt vazio')
      }

      if (!isGeminiConfigured()) {
        const msg = 'Gemini não está configurado. Verifique VITE_GEMINI_API_KEY no .env.'
        toast.error(msg)
        throw new Error(msg)
      }

      try {
        const fullPrompt = `${AI_EDITOR_SYSTEM_PROMPT}

Instrução específica do usuário:
${userPrompt}`

        const response = await callGemini(fullPrompt, {
          temperature: 0.6,
          maxOutputTokens: 4096,
        })

        if (response.error) {
          console.error('[MinutasManager] Erro Gemini:', response.error)
          toast.error('Erro ao gerar texto com Gemini.')
          throw new Error(response.error)
        }

        const text = response.text?.trim()
        if (!text) {
          const msg = 'Gemini retornou resposta vazia.'
          toast.error(msg)
          throw new Error(msg)
        }

        return text
      } catch (err) {
        console.error('[MinutasManager] Erro inesperado na IA:', err)
        throw err
      }
    },
    [],
  )

  const getStatusColor = (status: Minuta['status']) => {
    const colors = {
      rascunho: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'em-revisao': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'pendente-revisao': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      finalizada: 'bg-green-500/10 text-green-500 border-green-500/20',
      arquivada: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    }
    return colors[status] || colors.rascunho
  }

  const getStatusLabel = (status: Minuta['status']) => {
    const labels = {
      rascunho: 'Rascunho',
      'em-revisao': 'Em Revisão',
      'pendente-revisao': 'Pendente Revisão',
      finalizada: 'Finalizada',
      arquivada: 'Arquivada',
    }
    return labels[status] || status
  }

  const getTipoLabel = (tipo: Minuta['tipo']) => {
    const labels = {
      peticao: 'Petição',
      contrato: 'Contrato',
      parecer: 'Parecer',
      recurso: 'Recurso',
      procuracao: 'Procuração',
      outro: 'Outro',
    }
    return labels[tipo] || tipo
  }

  // Filtrar minutas
  const filteredMinutas = (minutas || []).filter((m) => {
    const matchesSearch =
      searchQuery === '' || m.titulo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus
    const matchesTipo = filterTipo === 'all' || m.tipo === filterTipo
    return matchesSearch && matchesStatus && matchesTipo
  })

  // Minutas pendentes de revisão (criadas por agentes)
  const minutasPendentes = (minutas || []).filter(
    (m) => m.status === 'pendente-revisao' || m.criadoPorAgente,
  )

  // Variáveis não preenchidas no conteúdo atual
  const unfilledVariables = extractUnfilledVariables(formData.conteudo)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText weight="fill" className="text-primary" />
            Editor de Minutas
          </h1>
          <p className="text-muted-foreground mt-1">
            Editor rico com IA (Gemini 2.5 Pro) e sincronização com Google Docs
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {!isGoogleConfigured ? (
            <Badge
              variant="outline"
              className="px-4 py-2 border-amber-500/50 text-amber-600"
            >
              <Warning className="mr-2 h-4 w-4" />
              Google não configurado
            </Badge>
          ) : !isAuthenticated ? (
            <Button onClick={handleAuthGoogle} variant="outline">
              <GoogleLogo className="mr-2" weight="bold" />
              Conectar Google Docs
            </Button>
          ) : (
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
              <GoogleLogo className="mr-2" weight="bold" />
              Google Conectado
            </Badge>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMinuta(null)
                  resetForm()
                }}
              >
                <Plus className="mr-2" weight="bold" />
                Nova Minuta
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingMinuta ? (
                    <>
                      <PencilSimple weight="fill" />
                      Editar Minuta
                    </>
                  ) : (
                    <>
                      <Plus weight="fill" />
                      Nova Minuta
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Use o editor rico para criar sua minuta. Use o botão de IA para gerar
                  conteúdo automaticamente com Gemini 2.5 Pro.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="variaveis">Variáveis</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="editor"
                  className="flex-1 flex flex-col overflow-hidden mt-4 space-y-4"
                >
                  {/* Metadados */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) =>
                          setFormData({ ...formData, titulo: e.target.value })
                        }
                        placeholder="Ex: Petição Inicial - Ação de Cobrança"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            tipo: value as Minuta['tipo'],
                          })
                        }
                      >
                        <SelectTrigger id="tipo">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="peticao">Petição</SelectItem>
                          <SelectItem value="contrato">Contrato</SelectItem>
                          <SelectItem value="parecer">Parecer</SelectItem>
                          <SelectItem value="recurso">Recurso</SelectItem>
                          <SelectItem value="procuracao">Procuração</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as Minuta['status'],
                          })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="em-revisao">Em Revisão</SelectItem>
                          <SelectItem value="finalizada">Finalizada</SelectItem>
                          <SelectItem value="arquivada">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="processo">Vincular a Processo (opcional)</Label>
                    <Select
                      value={formData.processId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, processId: value })
                      }
                    >
                      <SelectTrigger id="processo">
                        <SelectValue placeholder="Selecione um processo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Nenhum</SelectItem>
                        {(processes || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.numeroCNJ} - {p.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 overflow-hidden">
                    <TiptapEditor
                      content={formData.conteudo}
                      onChange={(content) =>
                        setFormData({ ...formData, conteudo: content })
                      }
                      onAIGenerate={handleAIGenerate}
                      variables={variableValues}
                      placeholder="Digite o conteúdo da minuta ou use o botão de IA para gerar com Gemini..."
                      className="h-full max-h-[400px] overflow-auto"
                    />
                  </div>

                  {/* Variáveis não preenchidas */}
                  {unfilledVariables.length > 0 && (
                    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                      <Warning className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>{unfilledVariables.length} variáveis não preenchidas:</strong>{' '}
                        {unfilledVariables.slice(0, 5).join(', ')}
                        {unfilledVariables.length > 5 &&
                          ` e mais ${unfilledVariables.length - 5}`}
                        <Button
                          variant="link"
                          size="sm"
                          className="ml-2 text-amber-600"
                          onClick={() => setActiveTab('variaveis')}
                        >
                          Preencher variáveis →
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="templates" className="flex-1 overflow-hidden mt-4">
                  <div className="space-y-4 h-full flex flex-col">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar templates..."
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <ScrollArea className="flex-1">
                      <div className="grid grid-cols-2 gap-3">
                        {documentTemplates
                          .filter(
                            (t) =>
                              searchQuery === '' ||
                              t.nome
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()) ||
                              t.categoria
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()),
                          )
                          .map((template) => (
                            <Card
                              key={template.id}
                              className={`cursor-pointer transition-all hover:border-primary/50 ${
                                selectedTemplate?.id === template.id
                                  ? 'border-primary bg-primary/5'
                                  : ''
                              }`}
                              onClick={() => handleApplyTemplate(template)}
                            >
                              <CardHeader className="p-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <FolderOpen className="h-4 w-4" />
                                  {template.nome}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {template.descricao}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {template.categoria}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {template.variaveis.length} variáveis
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="variaveis" className="flex-1 overflow-hidden mt-4">
                  <div className="space-y-4 h-full flex flex-col">
                    <p className="text-sm text-muted-foreground">
                      Preencha as variáveis para substituir automaticamente no documento. Use
                      o formato{' '}
                      <code className="bg-muted px-1 rounded">{'{{variavel}}'}</code>.
                    </p>

                    <ScrollArea className="flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        {(selectedTemplate?.variaveis || unfilledVariables).map(
                          (variable) => (
                            <div key={variable}>
                              <Label className="text-xs">{variable}</Label>
                              <Input
                                value={variableValues[variable] || ''}
                                onChange={(e) =>
                                  setVariableValues((prev) => ({
                                    ...prev,
                                    [variable]: e.target.value,
                                  }))
                                }
                                placeholder={`Valor para ${variable}`}
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </ScrollArea>

                    <Button onClick={handleFillVariables} className="w-full">
                      <Sparkle className="mr-2" weight="fill" />
                      Aplicar Variáveis no Documento
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingMinuta(null)
                    setError(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={editingMinuta ? handleUpdateMinuta : handleCreateMinuta}>
                  {editingMinuta ? 'Atualizar' : 'Criar'} Minuta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas de minutas pendentes */}
      {minutasPendentes.length > 0 && (
        <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <Robot className="h-4 w-4 text-orange-600" weight="fill" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{minutasPendentes.length} minuta(s) pendente(s) de revisão</strong>{' '}
            criada(s) pelos agentes IA.
            <div className="flex gap-2 mt-2">
              {minutasPendentes.slice(0, 3).map((m) => (
                <Button
                  key={m.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditMinuta(m)}
                  className="text-orange-600 border-orange-500/50"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {m.titulo.substring(0, 20)}...
                </Button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar minutas..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="em-revisao">Em Revisão</SelectItem>
            <SelectItem value="pendente-revisao">Pendente Revisão</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
            <SelectItem value="arquivada">Arquivada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="peticao">Petição</SelectItem>
            <SelectItem value="contrato">Contrato</SelectItem>
            <SelectItem value="parecer">Parecer</SelectItem>
            <SelectItem value="recurso">Recurso</SelectItem>
            <SelectItem value="procuracao">Procuração</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary">{filteredMinutas.length} minuta(s)</Badge>
      </div>

      {/* Lista de Minutas */}
      {filteredMinutas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText size={64} className="text-muted-foreground mb-4" weight="thin" />
            <p className="text-muted-foreground text-center">
              {searchQuery || filterStatus !== 'all' || filterTipo !== 'all'
                ? 'Nenhuma minuta encontrada com os filtros aplicados.'
                : 'Nenhuma minuta criada ainda.'}
              <br />
              Clique em &quot;Nova Minuta&quot; para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMinutas.map((minuta) => {
            const processo = (processes || []).find((p) => p.id === minuta.processId)

            return (
              <Card
                key={minuta.id}
                className={minuta.criadoPorAgente ? 'border-orange-500/30' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText weight="fill" className="text-primary" />
                        {minuta.titulo}
                        {minuta.criadoPorAgente && (
                          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                            <Robot className="mr-1 h-3 w-3" weight="fill" />
                            IA
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(minuta.status)}>
                          {getStatusLabel(minuta.status)}
                        </Badge>
                        <Badge variant="outline">{getTipoLabel(minuta.tipo)}</Badge>
                        {processo && (
                          <Badge variant="secondary">{processo.numeroCNJ}</Badge>
                        )}
                        {minuta.googleDocsId && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <GoogleLogo className="mr-1 h-3 w-3" weight="bold" />
                            Google Docs
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Preview do conteúdo */}
                    <div
                      className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-h-24 overflow-hidden prose prose-sm dark:prose-invert"
                      dangerouslySetInnerHTML={{
                        __html:
                          minuta.conteudo.substring(0, 500) +
                          (minuta.conteudo.length > 500 ? '...' : ''),
                      }}
                    />

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock weight="bold" className="h-3 w-3" />
                        Atualizado em{' '}
                        {new Date(minuta.atualizadoEm).toLocaleString('pt-BR')}
                      </span>
                      {minuta.ultimaSincronizacao && (
                        <span className="flex items-center gap-1">
                          <ArrowsClockwise className="h-3 w-3" />
                          Sincronizado em{' '}
                          {new Date(minuta.ultimaSincronizacao).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMinuta(minuta)}
                      >
                        <PencilSimple className="mr-2 h-4 w-4" weight="bold" />
                        Editar
                      </Button>

                      {minuta.status !== 'finalizada' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveMinuta(minuta.id)}
                          className="text-green-600 border-green-500/50 hover:bg-green-500/10"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" weight="bold" />
                          Aprovar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateMinuta(minuta)}
                      >
                        <Copy className="mr-2 h-4 w-4" weight="bold" />
                        Duplicar
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
                            Exportar
                            <CaretDown className="ml-1 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportPDF(minuta)}
                              className="justify-start"
                            >
                              <FilePdf className="mr-2 h-4 w-4" /> Exportar PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportDOCX(minuta)}
                              className="justify-start"
                            >
                              <FileDoc className="mr-2 h-4 w-4" /> Exportar DOC
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenInGoogleDocs(minuta)}
                              disabled={!isAuthenticated}
                              className="justify-start"
                            >
                              <GoogleLogo className="mr-2 h-4 w-4" weight="bold" />
                              {minuta.googleDocsUrl ? 'Abrir no' : 'Criar no'} Google Docs
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>

                      {minuta.googleDocsId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncFromGoogleDocs(minuta)}
                          disabled={isSyncing === minuta.id}
                        >
                          <ArrowsClockwise
                            className={`mr-2 h-4 w-4 ${
                              isSyncing === minuta.id ? 'animate-spin' : ''
                            }`}
                            weight="bold"
                          />
                          Sincronizar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMinuta(minuta.id)}
                        className="text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash className="mr-2 h-4 w-4" weight="bold" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
