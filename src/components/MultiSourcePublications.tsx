/**
 * Multi-Source Publications Component
 * 
 * Unified interface for searching legal publications across multiple sources:
 * - DJEN, DataJud, PJe, Official Gazettes, and more
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Database, 
  MagnifyingGlass, 
  Spinner, 
  CheckCircle, 
  Warning,
  Copy,
  Download,
  Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  searchPublications,
  getSourceCapabilities,
  getEnabledSources,
  type PublicationSearchParams,
  type UnifiedPublication,
  type PublicationSource
} from '@/lib/multi-source-publications'

export default function MultiSourcePublications() {
  const [searchParams, setSearchParams] = useState<PublicationSearchParams>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  const [selectedSources, setSelectedSources] = useState<PublicationSource[]>([])
  const [loading, setLoading] = useState(false)
  const [publications, setPublications] = useState<UnifiedPublication[]>([])
  const [searchStats, setSearchStats] = useState<any>(null)
  
  const capabilities = getSourceCapabilities()
  const enabledSources = getEnabledSources()
  
  const handleSearch = async () => {
    // Validation
    if (!searchParams.lawyerName && 
        !searchParams.oabNumber && 
        !searchParams.processNumber && 
        !searchParams.partyName &&
        (!searchParams.keywords || searchParams.keywords.length === 0)) {
      toast.error('Forneça pelo menos um critério de busca')
      return
    }
    
    setLoading(true)
    
    try {
      const params: PublicationSearchParams = {
        ...searchParams,
        sources: selectedSources.length > 0 ? selectedSources : undefined
      }
      
      const result = await searchPublications(params)
      
      setPublications(result.publications)
      setSearchStats(result)
      
      toast.success(`${result.totalFound} publicações encontradas em ${result.sources.length} fontes`)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar publicações'
      toast.error(message)
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSourceToggle = (source: PublicationSource) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }
  
  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Conteúdo copiado!')
  }
  
  const handleExportResults = () => {
    const dataStr = JSON.stringify(publications, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `publicacoes_${new Date().toISOString()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Resultados exportados!')
  }
  
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Publicações Multi-Fonte</h1>
        <p className="text-muted-foreground mt-1">
          Busca unificada em DJEN, DataJud, PJe, Diários Oficiais e mais
        </p>
      </div>
      
      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Fontes de Dados Disponíveis
          </CardTitle>
          <CardDescription>
            Selecione as fontes que deseja consultar (deixe em branco para buscar em todas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {capabilities
              .filter(cap => enabledSources.includes(cap.source))
              .map(capability => (
                <div key={capability.source} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={capability.source}
                    checked={selectedSources.includes(capability.source)}
                    onCheckedChange={() => handleSourceToggle(capability.source)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={capability.source}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {capability.name}
                      {capability.official && (
                        <Badge variant="secondary" className="text-xs">Oficial</Badge>
                      )}
                      {capability.status === 'beta' && (
                        <Badge variant="outline" className="text-xs">Beta</Badge>
                      )}
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {capability.description}
                    </p>
                    {capability.requiresAuth && !capability.official && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ Requer assinatura paga
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Critérios de Busca</CardTitle>
          <CardDescription>
            Forneça pelo menos um critério para realizar a busca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lawyer Info */}
            <div className="space-y-2">
              <Label htmlFor="lawyer-name">Nome do Advogado</Label>
              <Input
                id="lawyer-name"
                placeholder="Ex: João Silva"
                value={searchParams.lawyerName || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, lawyerName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="oab-number">Número OAB</Label>
              <Input
                id="oab-number"
                placeholder="Ex: OAB/SP 123456"
                value={searchParams.oabNumber || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, oabNumber: e.target.value }))}
              />
            </div>
            
            {/* Party Info */}
            <div className="space-y-2">
              <Label htmlFor="party-name">Nome da Parte</Label>
              <Input
                id="party-name"
                placeholder="Ex: Maria Santos"
                value={searchParams.partyName || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, partyName: e.target.value }))}
              />
            </div>
            
            {/* Process Number */}
            <div className="space-y-2">
              <Label htmlFor="process-number">Número do Processo</Label>
              <Input
                id="process-number"
                placeholder="Ex: 0000000-00.0000.0.00.0000"
                value={searchParams.processNumber || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, processNumber: e.target.value }))}
              />
            </div>
            
            {/* Keywords */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
              <Input
                id="keywords"
                placeholder="Ex: intimação, sentença, recurso"
                value={searchParams.keywords?.join(', ') || ''}
                onChange={(e) => setSearchParams(prev => ({ 
                  ...prev, 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                }))}
              />
            </div>
            
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={searchParams.startDate || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={searchParams.endDate || ''}
                onChange={(e) => setSearchParams(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner className="w-4 h-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <MagnifyingGlass className="w-4 h-4 mr-2" />
                Buscar Publicações
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Search Statistics */}
      {searchStats && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas da Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">{searchStats.totalFound}</div>
                <div className="text-sm text-muted-foreground">Publicações Encontradas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{searchStats.sources.length}</div>
                <div className="text-sm text-muted-foreground">Fontes Consultadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {searchStats.sources.filter((s: any) => s.status === 'success').length}
                </div>
                <div className="text-sm text-muted-foreground">Fontes com Sucesso</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {searchStats.sources.filter((s: any) => s.status === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">Fontes com Erro</div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h4 className="font-semibold">Detalhes por Fonte:</h4>
              {searchStats.sources.map((source: any) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {source.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Warning className="w-4 h-4 text-red-500" />
                    )}
                    <span className="capitalize">{source.source.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{source.count} resultados</span>
                    <span className="text-muted-foreground">{source.duration}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Results */}
      {publications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados ({publications.length})</CardTitle>
                <CardDescription>
                  Publicações encontradas ordenadas por data
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {publications.map((pub, idx) => (
              <Card key={pub.id || idx} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{pub.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {pub.source.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary">
                          {pub.publicationType}
                        </Badge>
                        {pub.matchType && (
                          <Badge>
                            {pub.matchType.replace('_', ' ')}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyContent(pub.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data:</span>
                      <div className="font-medium">
                        {new Date(pub.publicationDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {pub.processNumber && (
                      <div>
                        <span className="text-muted-foreground">Processo:</span>
                        <div className="font-medium font-mono text-xs">{pub.processNumber}</div>
                      </div>
                    )}
                    {pub.tribunal && (
                      <div>
                        <span className="text-muted-foreground">Tribunal:</span>
                        <div className="font-medium">{pub.tribunal}</div>
                      </div>
                    )}
                    {pub.court && (
                      <div>
                        <span className="text-muted-foreground">Órgão:</span>
                        <div className="font-medium">{pub.court}</div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Conteúdo:</div>
                    <div className="text-sm bg-muted p-3 rounded max-h-40 overflow-y-auto">
                      {pub.content}
                    </div>
                  </div>
                  
                  {pub.sourceUrl && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Fonte: <a href={pub.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          {pub.sourceUrl}
                        </a>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* No Results */}
      {!loading && searchStats && publications.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhuma publicação encontrada com os critérios fornecidos. 
            Tente ajustar os filtros ou o período de busca.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
