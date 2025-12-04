/**
 * Hook personalizado para gerenciar publicações DJEN
 * Reduz complexidade cognitiva do componente principal
 */

import { useState, useCallback } from "react";
import type { DJENPublication } from "@/types/djen-publication";

interface ExpedientesResponse {
  success: boolean;
  expedientes: DJENPublication[];
  count: number;
  lastCheck: string | null;
  lawyersConfigured: number;
  message?: string;
}

export function useDJENPublications(maxItems: number, filter: "all" | "unread") {
  const [publications, setPublications] = useState<DJENPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [lawyersCount, setLawyersCount] = useState(0);

  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const statusParam = filter === "unread" ? "&status=unread" : "";
      const response = await fetch(
        `${baseUrl}/api/expedientes?limit=${maxItems * 2}${statusParam}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ExpedientesResponse = await response.json();

      if (data.success) {
        setPublications(data.expedientes.slice(0, maxItems));
        setLastCheck(data.lastCheck);
        setLawyersCount(data.lawyersConfigured);
      } else {
        setError(data.message || "Erro ao carregar publicações");
      }
    } catch (err) {
      console.error("[DJENWidget] Fetch error:", err);
      setError("Não foi possível conectar ao servidor");
    } finally {
      setLoading(false);
    }
  }, [maxItems, filter]);

  return {
    publications,
    loading,
    error,
    lastCheck,
    lawyersCount,
    fetchPublications,
  };
}
