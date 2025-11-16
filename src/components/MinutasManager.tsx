import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  GoogleLogo, 
  Plus, 
  ArrowsClockwise,
  Trash,
  Eye,
  PencilSimple,
  DownloadSimple,
  Clock
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { googleDocsService } from '@/lib/google-docs-service'
import type { Minuta, Process } from '@/types'

export default function MinutasManager() {
  const [minutas, setMinutas] = useKV<Minuta[]>('minutas', [])
  const [processes] = useKV<Process[]>('processes', [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMinuta, setEditingMinuta] = useState<Minuta | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    processId: '_none',
    tipo: 'peticao' as Minuta['tipo'],
    conteudo: '',
  })

  useEffect(() => {
    setIsAuthenticated(googleDocsService.isAuthenticated())
  }, [])

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
      status: 'rascunho',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      autor: 'current-user',
    }

    setMinutas((current = []) => [...current, novaMinuta])
    
    setFormData({
      titulo: '',
      processId: '_none',
      tipo: 'peticao',
      conteudo: '',
    })
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
              atualizadoEm: new Date().toISOString(),
            }
          : m
      )
    )

    if (editingMinuta.googleDocsId) {
      const success = await googleDocsService.updateDocumentContent(
        editingMinuta.googleDocsId,
        formData.conteudo
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
    setFormData({
      titulo: '',
      processId: '_none',
      tipo: 'peticao',
      conteudo: '',
    })
    setIsDialogOpen(false)
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
              : m
          )
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
              : m
          )
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
    })
    setIsDialogOpen(true)
  }

  const handleExportText = (minuta: Minuta) => {
    const blob = new Blob([minuta.conteudo], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${minuta.titulo}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Minuta exportada!')
  }

  const getStatusColor = (status: Minuta['status']) => {
    const colors = {
      rascunho: 'bg-yellow-500/10 text-yellow-500',
      'em-revisao': 'bg-blue-500/10 text-blue-500',
      finalizada: 'bg-green-500/10 text-green-500',
      arquivada: 'bg-gray-500/10 text-gray-500',
    }
    return colors[status]
  }

  const getTipoLabel = (tipo: Minuta['tipo']) => {
    const labels = {
      peticao: 'Petição',
      contrato: 'Contrato',
      parecer: 'Parecer',
      recurso: 'Recurso',
      outro: 'Outro',
    }
    return labels[tipo]
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minutas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas minutas com sincronização automática no Google Docs
          </p>
        </div>
        
        <div className="flex gap-3">
          {!isAuthenticated ? (
            <Button onClick={handleAuthGoogle} variant="outline">
              <GoogleLogo className="mr-2" weight="bold" />
              Conectar Google Docs
            </Button>
          ) : (
            <Badge className="bg-green-500/10 text-green-500 px-4 py-2">
              <GoogleLogo className="mr-2" weight="bold" />
              Google Conectado
            </Badge>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingMinuta(null)
                setFormData({ titulo: '', processId: '_none', tipo: 'peticao', conteudo: '' })
              }}>
                <Plus className="mr-2" weight="bold" />
                Nova Minuta
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMinuta ? 'Editar Minuta' : 'Nova Minuta'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da minuta. Você pode abrir no Google Docs depois.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Petição Inicial - Ação de Cobrança"
                  />
                </div>
                
                <div>
                  <Label htmlFor="processo">Processo (opcional)</Label>
                  <Select
                    value={formData.processId}
                    onValueChange={(value) => setFormData({ ...formData, processId: value === '_none' ? '' : value })}
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
                
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value as Minuta['tipo'] })}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peticao">Petição</SelectItem>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="parecer">Parecer</SelectItem>
                      <SelectItem value="recurso">Recurso</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="conteudo">Conteúdo</Label>
                  <Textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    placeholder="Digite o conteúdo da minuta..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setEditingMinuta(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={editingMinuta ? handleUpdateMinuta : handleCreateMinuta}>
                    {editingMinuta ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(minutas || []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText size={64} className="text-muted-foreground mb-4" weight="thin" />
            <p className="text-muted-foreground text-center">
              Nenhuma minuta criada ainda.
              <br />
              Clique em "Nova Minuta" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(minutas || []).map((minuta) => {
            const processo = (processes || []).find((p) => p.id === minuta.processId)
            
            return (
              <Card key={minuta.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText weight="fill" />
                        {minuta.titulo}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(minuta.status)}>
                          {minuta.status}
                        </Badge>
                        <Badge variant="outline">{getTipoLabel(minuta.tipo)}</Badge>
                        {processo && (
                          <Badge variant="secondary">
                            {processo.numeroCNJ}
                          </Badge>
                        )}
                        {minuta.googleDocsId && (
                          <Badge className="bg-blue-500/10 text-blue-500">
                            <GoogleLogo className="mr-1" weight="bold" />
                            Google Docs
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-h-32 overflow-y-auto">
                      {minuta.conteudo.substring(0, 300)}
                      {minuta.conteudo.length > 300 && '...'}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock weight="bold" />
                      <span>
                        Atualizado em {new Date(minuta.atualizadoEm).toLocaleString('pt-BR')}
                      </span>
                      {minuta.ultimaSincronizacao && (
                        <>
                          <span>•</span>
                          <span>
                            Sincronizado em{' '}
                            {new Date(minuta.ultimaSincronizacao).toLocaleString('pt-BR')}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditMinuta(minuta)}
                      >
                        <PencilSimple className="mr-2" weight="bold" />
                        Editar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenInGoogleDocs(minuta)}
                        disabled={!isAuthenticated}
                      >
                        <GoogleLogo className="mr-2" weight="bold" />
                        {minuta.googleDocsUrl ? 'Abrir no' : 'Criar no'} Google Docs
                      </Button>
                      
                      {minuta.googleDocsId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSyncFromGoogleDocs(minuta)}
                          disabled={isSyncing === minuta.id}
                        >
                          <ArrowsClockwise
                            className="mr-2"
                            weight="bold"
                            {...(isSyncing === minuta.id && { className: 'mr-2 animate-spin' })}
                          />
                          Sincronizar
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportText(minuta)}
                      >
                        <DownloadSimple className="mr-2" weight="bold" />
                        Exportar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMinuta(minuta.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="mr-2" weight="bold" />
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
