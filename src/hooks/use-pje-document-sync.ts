/**
 * Hook para sincronizar documentos da extensão Chrome PJe
 * Monitora documentos extraídos da extensão e auto-salva como minutas
 */

import { useEffect, useRef, useState } from "react";
import { useKV } from "./use-kv";
import { DocumentoPJe } from "@/types";
import { toast } from "sonner";

export interface PJeDocumentSync {
  documentosPendentes: DocumentoPJe[];
  documentosProcessados: DocumentoPJe[];
  carregando: boolean;
  proximaSincronizacao: number;
  extensaoAtivaNoTab: boolean;
  forcarSincronizacao: () => Promise<void>;
  salvarDocumento: (documento: DocumentoPJe) => Promise<string>;
  descartarDocumento: (id: string) => void;
}

/**
 * Hook para gerenciar sincronização de documentos PJe
 */
export function usePJeDocumentSync(): PJeDocumentSync {
  const { data: documentosSalvos, setData: setDocumentosSalvos } = useKV<DocumentoPJe[]>(
    "pje_documentos",
    []
  );

  const [documentosPendentes, setDocumentosPendentes] = useState<DocumentoPJe[]>([]);
  const [documentosProcessados, setDocumentosProcessados] = useState<DocumentoPJe[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [proximaSincronizacao, setProximaSincronizacao] = useState(0);
  const [extensaoAtivaNoTab, setExtensaoAtivaNoTab] = useState(false);
  const tabIdRef = useRef<number | null>(null);

  // Detectar aba ativa
  useEffect(() => {
    const detectarAbaAtiva = async () => {
      // @ts-ignore - chrome API types might be missing in web context
      if (typeof chrome !== "undefined" && chrome.tabs) {
        // @ts-ignore
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          tabIdRef.current = tabs[0].id || null;
          verificarExtensaoAtiva();
        }
      }
    };

    detectarAbaAtiva();
  }, []);

  // Verificar se extensão está ativa nesta aba
  const verificarExtensaoAtiva = async () => {
    if (!tabIdRef.current) return;

    try {
      // @ts-ignore
      const response = await chrome.tabs.sendMessage(tabIdRef.current, {
        type: "PING",
        timestamp: Date.now(),
      });

      setExtensaoAtivaNoTab(response?.success && response?.active);
    } catch {
      setExtensaoAtivaNoTab(false);
    }
  };

  // Listener para mensagens da extensão
  useEffect(() => {
    const handleMessage = (request: any) => {
      if (request.type === "SYNC_DOCUMENTO") {
        const documento = request.data as DocumentoPJe;

        console.log(
          "[PJeDocumentSync] Novo documento recebido:",
          documento.tipo,
          "-",
          documento.metadados?.numeroProcesso
        );

        // Adiciona à lista de pendentes (deduplicado por ID)
        setDocumentosPendentes((prev) => {
          const jaExiste = prev.some((d) => d.id === documento.id);
          if (jaExiste) return prev;
          return [documento, ...prev];
        });

        // Toast de notificação
        toast.success(
          `📄 ${documento.tipo.toUpperCase()} capturado: ${documento.metadados?.numeroProcesso || "N/A"}`
        );
      }
    };

    // @ts-ignore
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      // @ts-ignore
      chrome.runtime.onMessage.addListener(handleMessage);
      // @ts-ignore
      return () => chrome.runtime.removeEventListener("message", handleMessage);
    }
  }, []);

  // Forçar sincronização
  const forcarSincronizacao = async () => {
    if (!tabIdRef.current || carregando) return;

    setCarregando(true);
    setProximaSincronizacao(Date.now() + 2000);

    try {
      // @ts-ignore
      await chrome.tabs.sendMessage(tabIdRef.current, {
        type: "FORCE_SYNC",
        timestamp: Date.now(),
      });

      toast.success("🔄 Sincronização forçada com PJe");
    } catch (error) {
      console.error("[PJeDocumentSync] Erro ao forçar sincronização:", error);
      toast.error("Erro ao sincronizar com PJe");
    } finally {
      setCarregando(false);
    }
  };

  // Salvar documento
  const salvarDocumento = async (documento: DocumentoPJe): Promise<string> => {
    try {
      const id = documento.id;

      // Atualizar lista de salvos
      const novosDocumentos = documentosSalvos ? [...documentosSalvos, documento] : [documento];
      await setDocumentosSalvos(novosDocumentos);

      // Mover de pendentes para processados
      setDocumentosPendentes((prev) => prev.filter((d) => d.id !== id));
      setDocumentosProcessados((prev) => {
        const jaExiste = prev.some((d) => d.id === id);
        return jaExiste ? prev : [documento, ...prev];
      });

      // Limpar processados depois de 5 minutos
      setTimeout(
        () => {
          setDocumentosProcessados((prev) => prev.filter((d) => d.id !== id));
        },
        5 * 60 * 1000
      );

      toast.success("✅ Documento salvo com sucesso");
      return id;
    } catch (error) {
      console.error("[PJeDocumentSync] Erro ao salvar documento:", error);
      toast.error("Erro ao salvar documento");
      throw error;
    }
  };

  // Descartar documento
  const descartarDocumento = (id: string) => {
    setDocumentosPendentes((prev) => prev.filter((d) => d.id !== id));
    toast.info("📄 Documento descartado");
  };

  return {
    documentosPendentes,
    documentosProcessados,
    carregando,
    proximaSincronizacao,
    extensaoAtivaNoTab,
    forcarSincronizacao,
    salvarDocumento,
    descartarDocumento,
  };
}

/**
 * Hook alternativo para auto-salvar documentos PJe
 * Salva automaticamente documentos que atendem critérios específicos
 */
export function useAutoSavePJeDocuments() {
  const { documentosPendentes, salvarDocumento } = usePJeDocumentSync();
  const [autoSaveAtivo, setAutoSaveAtivo] = useState(false);
  const [crituriosAutoSave] = useState({
    // Salvar automaticamente certidões
    salvarCertidoes: true,
    // Salvar automaticamente decisões
    salvarDecisoes: true,
    // Salvar automaticamente despachos
    salvarDespachos: false,
    // Salvar automaticamente apenas se processo está registrado no sistema
    validarProcessoLocal: true,
  });

  // Auto-save de documentos que atendem critérios
  useEffect(() => {
    if (!autoSaveAtivo || documentosPendentes.length === 0) return;

    const processarDocumento = async (documento: DocumentoPJe) => {
      const tipoPermitido =
        (crituriosAutoSave.salvarCertidoes && documento.tipo === "certidao") ||
        (crituriosAutoSave.salvarDecisoes && documento.tipo === "sentenca") ||
        (crituriosAutoSave.salvarDespachos && documento.tipo === "despacho");

      if (!tipoPermitido) return;

      try {
        await salvarDocumento(documento);
      } catch (error) {
        console.error("[AutoSavePJeDocuments] Erro ao auto-salvar:", error);
      }
    };

    // Processar primeiro documento pendente
    if (documentosPendentes.length > 0) {
      processarDocumento(documentosPendentes[0]);
    }
  }, [documentosPendentes, autoSaveAtivo, crituriosAutoSave, salvarDocumento]);

  return {
    autoSaveAtivo,
    setAutoSaveAtivo,
    crituriosAutoSave,
  };
}

/**
 * Hook para widget de documentos pendentes
 * Usado no Dashboard para mostrar documentos capturados aguardando ação
 */
export interface PJeDocumentWidgetState {
  visivel: boolean;
  documentosNovos: number;
  documentosProcessados: number;
  extensaoAtivaNoTab: boolean;
  forcarSincronizacao: () => Promise<void>;
  abrirPainel: () => void;
  fecharPainel: () => void;
}

export function usePJeDocumentWidget(): PJeDocumentWidgetState {
  const { documentosPendentes, documentosProcessados, extensaoAtivaNoTab, forcarSincronizacao } =
    usePJeDocumentSync();
  const [visivel, setVisivel] = useState(false);

  return {
    visivel,
    documentosNovos: documentosPendentes.length,
    documentosProcessados: documentosProcessados.length,
    extensaoAtivaNoTab,
    forcarSincronizacao,
    abrirPainel: () => setVisivel(true),
    fecharPainel: () => setVisivel(false),
  };
}
