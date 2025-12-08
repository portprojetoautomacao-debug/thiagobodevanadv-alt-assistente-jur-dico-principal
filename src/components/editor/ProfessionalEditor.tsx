/**
 * ProfessionalEditor - Editor profissional com aparência A4 e colaboração IA
 *
 * Features:
 * - Toolbar completa (baseada em TiptapEditorV2)
 * - Aparência de página A4 com sombra
 * - Indicador de quem está escrevendo (humano vs IA)
 * - Colaboração: quando humano digita, IA pausa; após 3s de inatividade, IA pode continuar
 * - Comandos de IA: Continuar, Revisar, Expandir
 * - Word count no footer
 * - Variáveis e placeholders
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import TiptapEditorV2 from "./TiptapEditorV2";

interface ProfessionalEditorProps {
  readonly content: string;
  readonly onChange: (content: string) => void;
  readonly onAIGenerate?: (prompt: string) => Promise<string>;
  readonly onAIStream?: (
    prompt: string,
    callbacks: {
      onChunk: (chunk: string) => void;
      onComplete: () => void;
      onError: (error: Error) => void;
    }
  ) => Promise<void>;
  readonly variables?: Record<string, string>;
  readonly readOnly?: boolean;
  readonly className?: string;
}

export function ProfessionalEditor({
  content,
  onChange,
  onAIGenerate,
  onAIStream,
  variables,
  readOnly = false,
  className,
}: ProfessionalEditorProps) {
  const [isTyping, setIsTyping] = useState(false);
  const [lastAuthor, setLastAuthor] = useState<"human" | "ai" | null>(null);
  const [isAIActive, setIsAIActive] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef(content);

  // Calcular contagem de palavras
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, "").trim();
    const words = text.length === 0 ? 0 : text.split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  // Detectar quando humano está digitando
  const handleChange = useCallback(
    (newContent: string) => {
      const isUserChange = lastContentRef.current !== newContent && !isAIActive;

      if (isUserChange) {
        setIsTyping(true);
        setLastAuthor("human");

        // Clear timeout anterior
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Após 3s de inatividade, considerar que humano parou de digitar
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }

      lastContentRef.current = newContent;
      onChange(newContent);
    },
    [onChange, isAIActive]
  );

  // Wrapper para onAIGenerate que marca como ação da IA
  const handleAIGenerate = useCallback(
    async (prompt: string) => {
      if (!onAIGenerate) return "";

      setIsAIActive(true);
      setLastAuthor("ai");
      try {
        const result = await onAIGenerate(prompt);
        return result;
      } finally {
        setIsAIActive(false);
      }
    },
    [onAIGenerate]
  );

  // Wrapper para onAIStream que marca como ação da IA
  const handleAIStream = useCallback(
    async (
      prompt: string,
      callbacks: {
        onChunk: (chunk: string) => void;
        onComplete: () => void;
        onError: (error: Error) => void;
      }
    ) => {
      if (!onAIStream) return;

      setIsAIActive(true);
      setLastAuthor("ai");
      try {
        await onAIStream(prompt, {
          ...callbacks,
          onComplete: () => {
            setIsAIActive(false);
            callbacks.onComplete();
          },
          onError: (error) => {
            setIsAIActive(false);
            callbacks.onError(error);
          },
        });
      } catch (error) {
        setIsAIActive(false);
        throw error;
      }
    },
    [onAIStream]
  );

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header com indicador de autor */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Editor Profissional</h3>
          {lastAuthor && (
            <Badge
              variant={lastAuthor === "human" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                lastAuthor === "human" && "bg-blue-500 text-white",
                lastAuthor === "ai" && "bg-purple-500 text-white"
              )}
            >
              {lastAuthor === "human" ? (
                <>
                  <User className="h-3 w-3 mr-1" />
                  Humano
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 mr-1" />
                  IA
                </>
              )}
            </Badge>
          )}
          {isTyping && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Digitando...
            </span>
          )}
          {isAIActive && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              IA processando...
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {wordCount.toLocaleString("pt-BR")} palavras
        </div>
      </div>

      {/* Editor com aparência A4 */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div
          className={cn(
            "mx-auto bg-white shadow-lg",
            // Tamanho A4 (210mm x 297mm em pixels @ 96 DPI)
            "w-[794px] min-h-[1123px]",
            "p-16", // Margens generosas
            "rounded-sm",
            "print:shadow-none print:w-full print:min-h-0"
          )}
          style={{
            // Garantir que o editor sempre ocupe altura mínima de 1 página A4
            minHeight: "1123px",
          }}
        >
          <TiptapEditorV2
            content={content}
            onChange={handleChange}
            onAIGenerate={handleAIGenerate}
            onAIStream={handleAIStream}
            variables={variables}
            readOnly={readOnly || isTyping} // Bloquear IA quando humano está digitando
            placeholder="Comece a escrever ou use os comandos de IA..."
            className="min-h-full"
          />
        </div>
      </div>

      {/* Footer com word count */}
      <div className="px-6 py-2 border-t border-border bg-card/50 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {isTyping
            ? "IA pausada - aguardando você terminar de digitar"
            : isAIActive
              ? "IA está processando sua solicitação"
              : "Pronto para colaboração"}
        </div>
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString("pt-BR")} palavras</span>
          <span>
            {Math.ceil(content.replace(/<[^>]*>/g, "").length / 1800)} páginas (aprox.)
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProfessionalEditor;
