import { googleDocsService } from "@/lib/google-docs-service";
import type { Minuta } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Hook para integração completa com Google Docs API
 * Wrapper do googleDocsService para uso em componentes React
 */
export function useGoogleDocs() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar status de autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await googleDocsService.initialize();
        const authenticated = googleDocsService.isAuthenticated();
        setIsConnected(authenticated);
      } catch (err) {
        console.error("[useGoogleDocs] Failed to check auth status", err);
        setIsConnected(false);
      }
    };
    checkAuth();
  }, []);

  /**
   * Autenticar com Google Docs
   */
  const authenticate = useCallback(async () => {
    setError(null);
    try {
      await googleDocsService.initialize();
      const success = await googleDocsService.authenticate();
      setIsConnected(success);

      if (success) {
        toast.success("Conectado ao Google Docs com sucesso!");
      } else {
        const lastError = googleDocsService.getLastError();
        toast.error(lastError || "Falha ao autenticar com Google Docs");
        setError(lastError);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao autenticar";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Criar documento do Google Docs a partir de uma minuta
   */
  const createDocument = useCallback(
    async (title: string, content: string) => {
      setError(null);
      try {
        if (!isConnected) {
          const authenticated = await authenticate();
          if (!authenticated) {
            throw new Error("Autenticação necessária");
          }
        }

        // Criar minuta temporária para o serviço
        const tempMinuta: Minuta = {
          id: crypto.randomUUID(),
          titulo: title,
          conteudo: content,
          tipo: "outro",
          status: "rascunho",
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
          autor: "Sistema",
        };

        const result = await googleDocsService.createDocument(tempMinuta);

        if (!result) {
          throw new Error("Falha ao criar documento");
        }

        toast.success("Documento criado no Google Docs!");
        return {
          id: result.docId,
          url: result.url,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao criar documento";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    [isConnected, authenticate]
  );

  /**
   * Atualizar conteúdo de um documento existente
   */
  const updateDocument = useCallback(
    async (docId: string, content: string) => {
      setError(null);
      try {
        if (!isConnected) {
          const authenticated = await authenticate();
          if (!authenticated) {
            throw new Error("Autenticação necessária");
          }
        }

        const success = await googleDocsService.updateDocumentContent(docId, content);

        if (!success) {
          throw new Error("Falha ao atualizar documento");
        }

        toast.success("Documento atualizado!");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar documento";
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    },
    [isConnected, authenticate]
  );

  /**
   * Obter documento do Google Docs
   */
  const getDocument = useCallback(
    async (docId: string) => {
      setError(null);
      try {
        if (!isConnected) {
          const authenticated = await authenticate();
          if (!authenticated) {
            throw new Error("Autenticação necessária");
          }
        }

        const content = await googleDocsService.getDocumentContent(docId);

        if (!content) {
          throw new Error("Documento não encontrado ou vazio");
        }

        return {
          id: docId,
          title: "Documento Google Docs",
          content: content,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao obter documento";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    [isConnected, authenticate]
  );

  /**
   * Exportar minuta para Google Docs (criar ou atualizar)
   */
  const exportToGoogleDocs = useCallback(
    async (minuta: Minuta) => {
      setIsExporting(true);
      setError(null);

      try {
        if (!isConnected) {
          const authenticated = await authenticate();
          if (!authenticated) {
            throw new Error("Autenticação necessária");
          }
        }

        // Se já tem Google Docs ID, atualizar; senão criar novo
        if (minuta.googleDocsId) {
          const success = await googleDocsService.updateDocumentContent(
            minuta.googleDocsId,
            minuta.conteudo
          );

          if (!success) {
            throw new Error("Falha ao atualizar documento existente");
          }

          toast.success("Documento atualizado no Google Docs!");
          return {
            docId: minuta.googleDocsId,
            url:
              minuta.googleDocsUrl ||
              `https://docs.google.com/document/d/${minuta.googleDocsId}/edit`,
          };
        }

        // Criar novo documento
        const result = await googleDocsService.createDocument(minuta);

        if (!result) {
          throw new Error("Falha ao criar documento no Google Docs");
        }

        toast.success("Documento exportado para Google Docs com sucesso!");
        return {
          docId: result.docId,
          url: result.url,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao exportar para Google Docs";
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [isConnected, authenticate]
  );

  /**
   * Sincronizar todas as minutas com Google Docs
   */
  const syncWithGoogleDocs = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      if (!isConnected) {
        const authenticated = await authenticate();
        if (!authenticated) {
          throw new Error("Autenticação necessária");
        }
      }

      // TODO: Implementar lógica de sincronização bidirecional
      toast.info("Sincronização com Google Docs em desenvolvimento");

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao sincronizar";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, authenticate]);

  /**
   * Abrir documento no Google Docs (nova aba)
   */
  const openDocument = useCallback((docId: string) => {
    const url = `https://docs.google.com/document/d/${docId}/edit`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const isAuthenticated = isConnected;

  return {
    // Estado
    isConnected,
    isSyncing,
    isExporting,
    isAuthenticated,
    error,

    // Métodos
    authenticate,
    createDocument,
    updateDocument,
    getDocument,
    syncWithGoogleDocs,
    exportToGoogleDocs,
    openDocument,
  };
}
