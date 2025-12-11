import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAIStreaming } from "@/hooks/use-ai-streaming";
import { useGoogleDocs } from "@/hooks/use-google-docs";
import { useKV } from "@/hooks/use-kv";
import {
  documentTemplates,
  extractUnfilledVariables,
  replaceTemplateVariables,
  type DocumentTemplate,
} from "@/lib/document-templates";
import { callGemini, isGeminiConfigured } from "@/lib/gemini-service";
import { googleDocsService } from "@/lib/google-docs-service";
import { themeConfig } from "@/lib/themes";
import {
  createMinuta,
  updateMinuta,
  validateMinutaForFinalization,
  type MinutaInput,
} from "@/services/minuta-service";
import type { Minuta, Process } from "@/types";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Grid3x3,
  List,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash,
} from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ✅ LAZY LOADING: TiptapEditorV2 é carregado apenas quando necessário
const TiptapEditorV2 = lazy(() =>
  import("@/components/editor/TiptapEditorV2").then((m) => ({
    default: m.TiptapEditorV2,
  }))
);

// Verificar se as credenciais do Google estão configuradas
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GOOGLE_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "";
const isGoogleConfigured = !!GOOGLE_CLIENT_ID && !!GOOGLE_API_KEY;

type ViewMode = "grid" | "list";

export default function MinutasManager() {
  const [minutas, setMinutas] = useKV<Minuta[]>("minutas", []);
  const [processes] = useKV<Process[]>("processes", []);
  const { exportToGoogleDocs, importFromGoogleDocs, openDocument } = useGoogleDocs();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMinuta, setEditingMinuta] = useState<Minuta | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Hook de streaming para IA
  const streamCallbacksRef = useRef<{
    onChunk?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
  }>({});

  const {
    streamChat,
    isStreaming: _isAIStreaming,
    streamingContent: _streamingContent,
  } = useAIStreaming({
    onChunk: (chunk) => {
      streamCallbacksRef.current.onChunk?.(chunk);
    },
    onComplete: () => {
      streamCallbacksRef.current.onComplete?.();
    },
    onError: (err) => {
      console.error("[MinutasManager] Erro no streaming:", err);
      toast.error("Erro no streaming de IA");
      streamCallbacksRef.current.onError?.(err);
    },
  });

  const [formData, setFormData] = useState({
    titulo: "",
    processId: "_none",
    tipo: "peticao" as Minuta["tipo"],
    conteudo: "",
    status: "rascunho" as Minuta["status"],
  });

  useEffect(() => {
    const initGoogleDocs = async () => {
      if (!isGoogleConfigured) {
        setIsAuthenticated(false);
        return;
      }
      try {
        await googleDocsService.initialize();
        const authenticated = googleDocsService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (err) {
        console.error("[MinutasManager] ❌ Google Docs init falhou:", err);
        setIsAuthenticated(false);
      }
    };
    initGoogleDocs();
  }, []);

  useEffect(() => {
    if (formData.processId && formData.processId !== "_none") {
      const processo = (processes || []).find((p) => p.id === formData.processId);
      if (processo) {
        setVariableValues((prev) => ({
          ...prev,
          "processo.numero": processo.numeroCNJ || "",
          "processo.titulo": processo.titulo || "",
          "autor.nome": processo.autor || "",
          "reu.nome": processo.reu || "",
          comarca: processo.comarca || "",
          vara: processo.vara || "",
        }));
      }
    }
  }, [formData.processId, processes]);

  const resetForm = () => {
    setFormData({
      titulo: "",
      processId: "_none",
      tipo: "peticao",
      conteudo: "",
      status: "rascunho",
    });
    setSelectedTemplate(null);
    setVariableValues({});
    setActiveTab("editor");
    setError(null);
  };

  const handleAuthGoogle = async () => {
    try {
      if (!isGoogleConfigured) {
        toast.error("Google não está configurado no ambiente (.env)");
        return;
      }

      // Mostrar loading toast
      const toastId = toast.loading("Inicializando Google Docs...");

      try {
        await googleDocsService.initialize();
        toast.success("Google Docs inicializado!", { id: toastId });
      } catch (initError) {
        const errorMsg =
          initError instanceof Error ? initError.message : "Erro ao inicializar Google Docs";

        // Mensagens mais específicas baseadas no erro
        let userMessage = errorMsg;
        if (errorMsg.includes("Timeout")) {
          userMessage = "Timeout ao carregar Google Docs. Verifique sua conexão e tente novamente.";
        } else if (errorMsg.includes("Failed to load")) {
          userMessage =
            "Não foi possível carregar scripts do Google. Verifique se você está conectado à internet.";
        } else if (errorMsg.includes("API key")) {
          userMessage = "Credenciais do Google inválidas. Contate o suporte.";
        }

        toast.error(`Falha na inicialização: ${userMessage}`, { id: toastId });
        console.error("[MinutasManager] Google Docs init error:", initError);
        return;
      }

      const success = await googleDocsService.authenticate();

      if (success) {
        setIsAuthenticated(true);
        toast.success("Autenticado com Google Docs!");
      } else {
        const lastError = googleDocsService.getLastError();
        toast.error(lastError || "Falha na autenticação - verifique se popups estão permitidos");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao autenticar: ${errorMsg}`);
      console.error("[MinutasManager] Auth error:", error);
    }
  };

  const handleCreateMinuta = async () => {
    if (!formData.titulo || !formData.conteudo) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    try {
      const minutaInput: MinutaInput = {
        titulo: formData.titulo,
        processId: formData.processId === "_none" ? undefined : formData.processId,
        tipo: formData.tipo,
        conteudo: formData.conteudo,
        status: formData.status,
        autor: "current-user",
        criadoPorAgente: false,
      };

      const novaMinuta = createMinuta(minutaInput);

      setMinutas((current = []) => [...current, novaMinuta]);

      resetForm();
      setIsDialogOpen(false);
      toast.success("Minuta criada com sucesso!");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao criar minuta";
      toast.error(errorMsg);
    }
  };

  const handleUpdateMinuta = async () => {
    if (!editingMinuta || !formData.titulo || !formData.conteudo) {
      toast.error("Preencha título e conteúdo");
      return;
    }

    try {
      if (formData.status === "finalizada") {
        const validation = validateMinutaForFinalization({
          ...editingMinuta,
          titulo: formData.titulo,
          conteudo: formData.conteudo,
        });

        if (!validation.valid) {
          toast.error("Minuta não pode ser finalizada", {
            description: validation.errors.join(", "),
          });
          return;
        }
      }

      const minutaAtualizada = updateMinuta(editingMinuta, {
        titulo: formData.titulo,
        processId: formData.processId === "_none" ? undefined : formData.processId,
        tipo: formData.tipo,
        conteudo: formData.conteudo,
        status: formData.status,
      });

      setMinutas((current = []) =>
        current.map((m) => (m.id === editingMinuta.id ? minutaAtualizada : m))
      );

      if (minutaAtualizada.googleDocsId) {
        const syncSuccess = await googleDocsService.updateDocumentContent(
          minutaAtualizada.googleDocsId,
          minutaAtualizada.conteudo
        );
        if (syncSuccess) {
          toast.success("Minuta atualizada e sincronizada com Google Docs");
        } else {
          toast.warning("Minuta atualizada, mas falha ao sincronizar com Google Docs");
        }
      } else {
        toast.success("Minuta atualizada com sucesso!");
      }

      resetForm();
      setIsDialogOpen(false);
      setEditingMinuta(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao atualizar minuta";
      toast.error(errorMsg);
    }
  };

  const handleEditMinuta = (minuta: Minuta) => {
    setEditingMinuta(minuta);
    setFormData({
      titulo: minuta.titulo,
      processId: minuta.processId || "_none",
      tipo: minuta.tipo,
      conteudo: minuta.conteudo,
      status: minuta.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteMinuta = (id: string) => {
    setMinutas((current = []) => current.filter((m) => m.id !== id));
    toast.success("Minuta excluída com sucesso!");
  };

  const handleApproveMinuta = (id: string) => {
    setMinutas((current = []) =>
      current.map((m) =>
        m.id === id
          ? {
              ...m,
              status: "finalizada" as Minuta["status"],
              atualizadoEm: new Date().toISOString(),
            }
          : m
      )
    );
    toast.success("Minuta aprovada e finalizada!");
  };

  const handleDuplicateMinuta = (minuta: Minuta) => {
    const duplicada = createMinuta({
      titulo: `${minuta.titulo} (Cópia)`,
      processId: minuta.processId,
      tipo: minuta.tipo,
      conteudo: minuta.conteudo,
      status: "rascunho",
      autor: "current-user",
      criadoPorAgente: false,
    });

    setMinutas((current = []) => [...current, duplicada]);
    toast.success("Minuta duplicada com sucesso!");
  };

  const handleExportPDF = (minuta: Minuta) => {
    toast.info("Exportação para PDF em desenvolvimento");
  };

  const handleExportDOCX = (minuta: Minuta) => {
    toast.info("Exportação para DOCX em desenvolvimento");
  };

  const handleOpenInGoogleDocs = async (minuta: Minuta) => {
    if (!isAuthenticated) {
      toast.error("Autentique com Google Docs primeiro");
      return;
    }

    try {
      if (minuta.googleDocsUrl) {
        openDocument(minuta.googleDocsUrl);
        toast.success("Abrindo documento no Google Docs...");
      } else {
        const result = await exportToGoogleDocs(minuta);
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
          );
          openDocument(result.url);
          toast.success("Documento criado e aberto no Google Docs!");
        }
      }
    } catch (error) {
      toast.error("Erro ao abrir no Google Docs");
    }
  };

  const handleSyncFromGoogleDocs = async (minuta: Minuta) => {
    if (!minuta.googleDocsId) return;

    setIsSyncing(minuta.id);
    try {
      const success = await importFromGoogleDocs(minuta.id, minutas || [], setMinutas);
      if (success) {
        toast.success("Alterações importadas do Google Docs!");
      }
    } catch (error) {
      toast.error("Erro ao importar do Google Docs");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleApplyTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      titulo: template.nome,
      tipo: template.categoria as Minuta["tipo"],
      conteudo: template.conteudo,
    });

    const initialValues: Record<string, string> = {};
    template.variaveis.forEach((v) => {
      initialValues[v] = variableValues[v] || "";
    });
    setVariableValues(initialValues);

    setActiveTab("editor");
    toast.success(`Template "${template.nome}" aplicado!`);
  };

  const handleFillVariables = () => {
    const filled = replaceTemplateVariables(formData.conteudo, variableValues);
    setFormData({ ...formData, conteudo: filled });
    toast.success("Variáveis preenchidas no documento!");
  };

  const handleAIGenerate = async (prompt: string): Promise<string> => {
    if (!isGeminiConfigured()) {
      throw new Error("Gemini não está configurado");
    }

    const fullPrompt = `Você é um assistente jurídico especializado em redação de documentos legais brasileiros.
Sua função é ajudar na criação, edição e melhoria de petições, contratos, pareceres e outros documentos jurídicos.
Sempre use linguagem formal e técnica apropriada. Cite legislação e jurisprudência quando relevante.
Mantenha formatação HTML adequada para o editor (use <p>, <strong>, <em>, <ul>, <li>, <blockquote>).

${prompt}`;

    const response = await callGemini(fullPrompt);

    return response.text;
  };

  const handleAIStream = useCallback(
    async (
      prompt: string,
      callbacks: {
        onChunk: (chunk: string) => void;
        onComplete: () => void;
        onError: (error: Error) => void;
      }
    ) => {
      streamCallbacksRef.current = {
        onChunk: callbacks.onChunk,
        onComplete: callbacks.onComplete,
        onError: (err) => callbacks.onError(new Error(err)),
      };

      try {
        await streamChat([
          {
            role: "system",
            content: `Você é um assistente jurídico especializado em redação de documentos legais brasileiros.
Sua função é ajudar na criação, edição e melhoria de petições, contratos, pareceres e outros documentos jurídicos.
Sempre use linguagem formal e técnica apropriada. Cite legislação e jurisprudência quando relevante.
Mantenha formatação HTML adequada para o editor (use <p>, <strong>, <em>, <ul>, <li>, <blockquote>).`,
          },
          { role: "user", content: prompt },
        ]);
      } catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error("Erro no streaming"));
      }
    },
    [streamChat]
  );

  // Alinhado ao design system semântico em src/lib/themes.ts
  const getStatusStyle = (status: Minuta["status"]): React.CSSProperties => {
    const map: Record<Minuta["status"], string> = {
      rascunho: themeConfig.colors.alerta, // amarelo
      "em-revisao": themeConfig.colors.info, // azul
      "pendente-revisao": themeConfig.colors.alerta, // laranja
      finalizada: themeConfig.colors.sucesso, // verde
      arquivada: "hsl(0, 0%, 45%)", // cinza neutro
    } as const;

    const base = map[status] || themeConfig.colors.info;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getStatusLabel = (status: Minuta["status"]) => {
    const labels = {
      rascunho: "Rascunho",
      "em-revisao": "Em Revisão",
      "pendente-revisao": "Pendente Revisão",
      finalizada: "Finalizada",
      arquivada: "Arquivada",
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: Minuta["tipo"]) => {
    const labels = {
      peticao: "Petição",
      contrato: "Contrato",
      parecer: "Parecer",
      recurso: "Recurso",
      procuracao: "Procuração",
      outro: "Outro",
    };
    return labels[tipo] || tipo;
  };

  const getAlertStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.alerta;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getSuccessStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.sucesso;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  const getInfoStyle = (): React.CSSProperties => {
    const base = themeConfig.colors.info;
    return {
      color: base,
      backgroundColor: `${base.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
      borderColor: `${base.replace("hsl", "hsla").replace(")", ", 0.20)")}`,
    };
  };

  // Filtrar minutas
  const filteredMinutas = (minutas || []).filter((m) => {
    const matchesSearch =
      searchQuery === "" || m.titulo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    const matchesTipo = filterTipo === "all" || m.tipo === filterTipo;
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Minutas pendentes de revisão
  const minutasPendentes = (minutas || []).filter(
    (m) => m.status === "pendente-revisao" || m.criadoPorAgente
  );

  // Variáveis não preenchidas
  const unfilledVariables = extractUnfilledVariables(formData.conteudo);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="text-primary" />
            Editor de Minutas
          </h1>
          <p className="text-muted-foreground mt-1">
            Editor rico com IA (Gemini 2.5 Pro) e sincronização com Google Docs
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {(() => {
            if (!isGoogleConfigured) {
              return (
                <Badge variant="outline" style={getAlertStyle()} className="px-4 py-2">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Google não configurado
                </Badge>
              );
            }
            if (!isAuthenticated) {
              return (
                <Button onClick={handleAuthGoogle} variant="outline">
                  <FileText className="mr-2" />
                  Conectar Google Docs
                </Button>
              );
            }
            return (
              <Badge style={getSuccessStyle()} className="px-4 py-2">
                <FileText className="mr-2" />
                Google Conectado
              </Badge>
            );
          })()}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingMinuta(null);
                  resetForm();
                }}
              >
                <Plus className="mr-2" />
                Nova Minuta
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col bg-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingMinuta ? (
                    <>
                      <Pencil />
                      Editar Minuta
                    </>
                  ) : (
                    <>
                      <Plus />
                      Nova Minuta
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Use o editor rico para criar sua minuta. Use o botão de IA para gerar conteúdo
                  automaticamente com Gemini 2.5 Pro.
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
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
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
                            tipo: value as Minuta["tipo"],
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
                            status: value as Minuta["status"],
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
                      onValueChange={(value) => setFormData({ ...formData, processId: value })}
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
                  <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
                    <Suspense
                      fallback={
                        <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg border">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">
                              Carregando editor...
                            </span>
                          </div>
                        </div>
                      }
                    >
                      <TiptapEditorV2
                        key={editingMinuta?.id || "new-minuta"}
                        content={formData.conteudo}
                        onChange={(content) => setFormData({ ...formData, conteudo: content })}
                        onAIGenerate={handleAIGenerate}
                        onAIStream={handleAIStream}
                        variables={variableValues}
                        placeholder="Digite o conteúdo da minuta ou use o botão de IA para gerar com Gemini..."
                        className="h-full min-h-[400px]"
                      />
                    </Suspense>
                  </div>

                  {/* Variáveis não preenchidas */}
                  {unfilledVariables.length > 0 && (
                    <Alert
                      style={{
                        borderColor: `${themeConfig.colors.alerta.replace("hsl", "hsla").replace(")", ", 0.50)")}`,
                        backgroundColor: `${themeConfig.colors.alerta.replace("hsl", "hsla").replace(")", ", 0.10)")}`,
                      }}
                    >
                      <AlertTriangle
                        className="h-4 w-4"
                        style={{ color: themeConfig.colors.alerta }}
                      />
                      <AlertDescription style={{ color: themeConfig.colors.alerta }}>
                        <strong>{unfilledVariables.length} variáveis não preenchidas:</strong>{" "}
                        {unfilledVariables.slice(0, 5).join(", ")}
                        {unfilledVariables.length > 5 && ` e mais ${unfilledVariables.length - 5}`}
                        <Button
                          variant="link"
                          size="sm"
                          className="ml-2"
                          style={{ color: themeConfig.colors.alerta }}
                          onClick={() => setActiveTab("variaveis")}
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                              searchQuery === "" ||
                              t.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((template) => (
                            <Card
                              key={template.id}
                              className={`cursor-pointer transition-all hover:border-primary/50 ${
                                selectedTemplate?.id === template.id
                                  ? "border-primary bg-primary/5"
                                  : ""
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
                      Preencha as variáveis para substituir automaticamente no documento. Use o
                      formato <code className="bg-muted px-1 rounded">{"{{variavel}}"}</code>.
                    </p>

                    <ScrollArea className="flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        {(selectedTemplate?.variaveis || unfilledVariables).map((variable) => (
                          <div key={variable}>
                            <Label className="text-xs">{variable}</Label>
                            <Input
                              value={variableValues[variable] || ""}
                              onChange={(e) =>
                                setVariableValues((prev) => ({
                                  ...prev,
                                  [variable]: e.target.value,
                                }))
                              }
                              placeholder={`Valor para ${variable}`}
                            />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Button onClick={handleFillVariables} className="w-full">
                      <Sparkles className="mr-2" />
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
                    setIsDialogOpen(false);
                    setEditingMinuta(null);
                    setError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={editingMinuta ? handleUpdateMinuta : handleCreateMinuta}>
                  {editingMinuta ? "Atualizar" : "Criar"} Minuta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas de minutas pendentes */}
      {minutasPendentes.length > 0 && (
        <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <Bot className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>{minutasPendentes.length} minuta(s) pendente(s) de revisão</strong> criada(s)
            pelos agentes IA.
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

      {/* Filtros e View Toggle */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            onClick={() => setViewMode("grid")}
            className="px-3"
            aria-label="Visualização em grade"
            title="Visualização em grade"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "secondary" : "ghost"}
            onClick={() => setViewMode("list")}
            className="px-3"
            aria-label="Visualização em lista"
            title="Visualização em lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de Minutas */}
      {filteredMinutas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText size={64} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery || filterStatus !== "all" || filterTipo !== "all"
                ? "Nenhuma minuta encontrada com os filtros aplicados."
                : "Nenhuma minuta criada ainda."}
              <br />
              Clique em &quot;Nova Minuta&quot; para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "grid gap-4"
          }
          data-testid="minutas-container"
        >
          {filteredMinutas.map((minuta) => {
            const processo = (processes || []).find((p) => p.id === minuta.processId);

            return (
              <Card
                key={minuta.id}
                className={`transition-all hover:shadow-md ${minuta.criadoPorAgente ? "border-orange-500/30" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="text-primary h-4 w-4" />
                        {minuta.titulo}
                        {minuta.criadoPorAgente && (
                          <Badge style={getInfoStyle()}>
                            <Bot className="mr-1 h-3 w-3" />
                            IA
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge style={getStatusStyle(minuta.status)}>
                          {getStatusLabel(minuta.status)}
                        </Badge>
                        <Badge variant="outline">{getTipoLabel(minuta.tipo)}</Badge>
                        {processo && (
                          <Badge variant="secondary" className="text-xs">
                            {processo.numeroCNJ}
                          </Badge>
                        )}
                        {minuta.googleDocsId && (
                          <Badge style={getInfoStyle()}>
                            <FileText className="mr-1 h-3 w-3" />
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
                    {viewMode === "grid" && (
                      <div
                        className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-h-24 overflow-hidden prose prose-sm dark:prose-invert line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html:
                            minuta.conteudo.substring(0, 200) +
                            (minuta.conteudo.length > 200 ? "..." : ""),
                        }}
                      />
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(minuta.atualizadoEm).toLocaleDateString("pt-BR")}
                      </span>
                      {minuta.ultimaSincronizacao && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Sync
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => handleEditMinuta(minuta)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>

                      {minuta.status !== "finalizada" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveMinuta(minuta.id)}
                          style={{
                            color: themeConfig.colors.sucesso,
                            borderColor: `${themeConfig.colors.sucesso.replace("hsl", "hsla").replace(")", ", 0.50)")}`,
                          }}
                          className="hover:opacity-80"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateMinuta(minuta)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                            <ChevronDown className="ml-1 h-3 w-3" />
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
                              <FileText className="mr-2 h-4 w-4" /> Exportar PDF
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportDOCX(minuta)}
                              className="justify-start"
                            >
                              <FileText className="mr-2 h-4 w-4" /> Exportar DOC
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenInGoogleDocs(minuta)}
                              disabled={!isAuthenticated}
                              className="justify-start"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              {minuta.googleDocsUrl ? "Abrir no" : "Criar no"} Google Docs
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
                          title="Importar alterações do Google Docs"
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${
                              isSyncing === minuta.id ? "animate-spin" : ""
                            }`}
                          />
                          {isSyncing === minuta.id ? "Importando..." : "Importar"}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMinuta(minuta.id)}
                        className="text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
