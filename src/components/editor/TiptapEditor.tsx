import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
// ✅ FIX: Usando Lucide React ao invés de Phosphor Icons
// Phosphor Icons causava erro "Cannot set properties of undefined (setting 'Activity')"
// quando carregado em chunks separados. Lucide é mais leve e não tem esse problema.
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Bot,
  Code,
  Eraser,
  Expand,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Palette,
  Pilcrow,
  Printer,
  Quote,
  Redo,
  Sparkles,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo,
  Wand2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface TiptapEditorProps {
  readonly content: string;
  readonly onChange: (content: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly readOnly?: boolean;
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
}

const COLORS = [
  "#000000",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#CA8A04",
  "#16A34A",
  "#059669",
  "#0D9488",
  "#0891B2",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#9333EA",
  "#C026D3",
  "#DB2777",
  "#E11D48",
];

const AI_QUICK_COMMANDS = [
  {
    label: "Expandir",
    icon: Expand,
    prompt: "Expanda e desenvolva o seguinte texto de forma mais detalhada e formal:",
  },
  {
    label: "Resumir",
    icon: Pilcrow,
    prompt: "Resuma o seguinte texto de forma concisa:",
  },
  {
    label: "Formalizar",
    icon: Wand2,
    prompt: "Reescreva o seguinte texto em linguagem jurídica formal:",
  },
  {
    label: "Corrigir",
    icon: Sparkles,
    prompt: "Corrija erros de gramática e ortografia no seguinte texto:",
  },
] as const;

// ===========================
// Helper Functions
// ===========================

function countWords(text: string): number {
  return text.trim().length === 0
    ? 0
    : text
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
}

function getGenerateButtonText(isStreaming: boolean, hasStreamSupport: boolean): string {
  if (isStreaming) return "Gerando...";
  return hasStreamSupport ? "Gerar com Streaming" : "Gerar Texto";
}

function getAIButtonClassName(isStreaming: boolean): string {
  const base = "gap-2 border-purple-500/20 hover:border-purple-500/40";
  return isStreaming
    ? `${base} bg-purple-500/20 animate-pulse`
    : `${base} bg-linear-to-r from-purple-500/10 to-blue-500/10`;
}

/**
 * Insere conteúdo no editor na posição especificada
 * Helper extraído para reduzir CC (SonarCloud S3776)
 */
function insertContentAtPosition(
  editor: ReturnType<typeof useEditor>,
  content: string,
  from: number,
  to: number
): void {
  if (!editor) return;
  editor
    .chain()
    .focus()
    .setTextSelection({ from, to })
    .deleteSelection()
    .insertContent(content)
    .run();
}

/**
 * Obtém texto selecionado ou todo o texto do editor
 */
function getSelectedOrAllText(
  editor: ReturnType<typeof useEditor>,
  from: number,
  to: number
): string {
  if (!editor) return "";
  const hasSelection = from !== to;
  return hasSelection ? editor.state.doc.textBetween(from, to, " ") : editor.getText();
}

/**
 * Mensagem de sucesso para comando de IA
 */
function getAISuccessMessage(commandLabel: string): string {
  return `Texto ${commandLabel.toLowerCase()}!`;
}

// ===========================
// Toolbar Button Components - Extraídos para reduzir CC
// ===========================

interface ToolbarButtonProps {
  readonly editor: ReturnType<typeof useEditor>;
  readonly disabled: boolean;
}

function UndoRedoButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo() || disabled}
        title="Desfazer"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo() || disabled}
        title="Refazer"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </>
  );
}

function TextFormattingButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <>
      <Button
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("underline") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        title="Sublinhado (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("strike") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
    </>
  );
}

function HeadingsPopover({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Títulos" disabled={disabled}>
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex flex-col gap-1">
          <Button
            variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="justify-start"
          >
            <Heading1 className="h-4 w-4 mr-2" /> Título 1
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="justify-start"
          >
            <Heading2 className="h-4 w-4 mr-2" /> Título 2
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className="justify-start"
          >
            <Heading3 className="h-4 w-4 mr-2" /> Título 3
          </Button>
          <Button
            variant={editor.isActive("paragraph") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className="justify-start"
          >
            <Pilcrow className="h-4 w-4 mr-2" /> Parágrafo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ListButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <>
      <Button
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </>
  );
}

function AlignmentButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <>
      <Button
        variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        disabled={disabled}
        title="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        disabled={disabled}
        title="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        disabled={disabled}
        title="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        disabled={disabled}
        title="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
    </>
  );
}

function ExtraFormattingButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <>
      <Button
        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
        title="Citação"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={disabled}
        title="Bloco de código"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive("highlight") ? "secondary" : "ghost"}
        size="icon"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={disabled}
        title="Destacar"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
    </>
  );
}

function ColorPickerPopover({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Cor do texto" disabled={disabled}>
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="w-6 h-6 rounded border hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().setColor(color).run()}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => editor.chain().focus().unsetColor().run()}
        >
          <Eraser className="h-4 w-4 mr-2" /> Remover cor
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// ===========================
// AI Toolbar Section - Extracted to reduce CC
// ===========================

interface AIToolbarSectionProps {
  readonly isStreaming: boolean;
  readonly isAILoading: boolean;
  readonly showAIPopover: boolean;
  readonly setShowAIPopover: (open: boolean) => void;
  readonly onAIStream?: TiptapEditorProps["onAIStream"];
  readonly aiPrompt: string;
  readonly setAiPrompt: (prompt: string) => void;
  readonly streamingText: string;
  readonly handleAIGenerate: () => void;
  readonly handleQuickAI: (cmd: (typeof AI_QUICK_COMMANDS)[number]) => void;
  readonly aiQuickCommands: typeof AI_QUICK_COMMANDS;
}

function AIToolbarSection({
  isStreaming,
  isAILoading,
  showAIPopover,
  setShowAIPopover,
  onAIStream,
  aiPrompt,
  setAiPrompt,
  streamingText,
  handleAIGenerate,
  handleQuickAI,
  aiQuickCommands,
}: AIToolbarSectionProps) {
  return (
    <>
      {isStreaming && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 animate-pulse">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-xs text-purple-400 font-medium">Streaming...</span>
        </div>
      )}

      <Popover open={showAIPopover} onOpenChange={setShowAIPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={getAIButtonClassName(isStreaming)}
            disabled={isAILoading || isStreaming}
          >
            {isAILoading || isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {isStreaming ? "Gerando..." : "IA"}
            {onAIStream && !isStreaming && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 bg-purple-500/20 text-purple-400"
              >
                Stream
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-4" align="end">
          <div className="space-y-4">
            {onAIStream && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-purple-400">
                  Modo Streaming ativo – texto gerado em tempo real
                </span>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-sm font-medium">Comandos rápidos</span>
              <div className="flex flex-wrap gap-2">
                {aiQuickCommands.map((cmd) => (
                  <Button
                    key={cmd.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAI(cmd)}
                    disabled={isAILoading || isStreaming}
                  >
                    <cmd.icon className="h-3 w-3 mr-1" />
                    {cmd.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label htmlFor="ai-prompt-input" className="text-sm font-medium">
                Gerar com IA
              </label>
              <Input
                id="ai-prompt-input"
                placeholder="Ex: Escreva uma petição inicial sobre..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
                disabled={isStreaming}
              />
              <Button
                className="w-full gap-2"
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isAILoading || isStreaming}
              >
                {isAILoading || isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {getGenerateButtonText(isStreaming, !!onAIStream)}
              </Button>
            </div>

            {isStreaming && streamingText && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 max-h-40 overflow-y-auto">
                <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                  {streamingText.slice(-600)}
                  <span className="animate-pulse text-purple-400">▊</span>
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Digite ou use /ai para comandos de IA...",
  className,
  readOnly = false,
  onAIGenerate,
  onAIStream,
  variables = {},
}: TiptapEditorProps) {
  const [isAILoading, setIsAILoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAIPopover, setShowAIPopover] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      // ✅ Underline não está no StarterKit - adicionamos apenas 1x
      Underline,
      // ✅ Link configurado apenas 1x (removido .extend para evitar duplicação)
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextStyle,
      Color,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      const text = editor.getText();
      setCharCount(text.length);
      setWordCount(countWords(text));
    },
  });

  // Sincronizar conteúdo externo sem loop
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Substituir variáveis no conteúdo
  const replaceVariables = useCallback(
    (text: string) => {
      let result = text;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
        result = result.replace(regex, value);
      });
      return result;
    },
    [variables]
  );

  const aiQuickCommands = AI_QUICK_COMMANDS;

  // Execução genérica de IA em streaming (respeita posição/seleção atual)
  const runAIStreaming = useCallback(
    async (prompt: string) => {
      if (!editor || !onAIStream) return;

      const { from, to } = editor.state.selection;

      setIsStreaming(true);
      setStreamingText("");

      let accumulated = "";

      try {
        await onAIStream(prompt, {
          onChunk: (chunk: string) => {
            accumulated += chunk;
            setStreamingText(accumulated);
          },
          onComplete: () => {
            const finalText = replaceVariables(accumulated);
            insertContentAtPosition(editor, finalText, from, to);

            setIsStreaming(false);
            setStreamingText("");
            setAiPrompt("");
            setShowAIPopover(false);
            toast.success("Texto inserido com IA (streaming)!");
          },
          onError: (error: Error) => {
            console.error("Erro no streaming:", error);
            toast.error("Erro no streaming de IA");
            setIsStreaming(false);
            setStreamingText("");
          },
        });
      } catch (error) {
        console.error("Erro ao iniciar streaming:", error);
        setIsStreaming(false);
        setStreamingText("");
      }
    },
    [editor, onAIStream, replaceVariables]
  );

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !editor) return;
    const prompt = aiPrompt.trim();

    // Streaming - early return para reduzir CC
    if (onAIStream) {
      await runAIStreaming(prompt);
      return;
    }

    if (!onAIGenerate) return;

    setIsAILoading(true);
    try {
      const generatedText = await onAIGenerate(prompt);
      const processedText = replaceVariables(generatedText);
      const { from, to } = editor.state.selection;

      insertContentAtPosition(editor, processedText, from, to);

      setAiPrompt("");
      setShowAIPopover(false);
      toast.success("Texto gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar texto com IA:", error);
      toast.error("Erro ao gerar texto com IA");
    } finally {
      setIsAILoading(false);
    }
  }, [aiPrompt, editor, onAIGenerate, onAIStream, runAIStreaming, replaceVariables]);

  const handleQuickAI = useCallback(
    async (command: (typeof aiQuickCommands)[number]) => {
      if (!editor || (!onAIGenerate && !onAIStream)) return;

      const { from, to } = editor.state.selection;
      const selectedText = getSelectedOrAllText(editor, from, to);

      if (!selectedText.trim()) {
        toast.error("Selecione um texto ou escreva algo primeiro");
        return;
      }

      const fullPrompt = `${command.prompt}\n\n"${selectedText}"`;

      // Early return para streaming
      if (onAIStream) {
        await runAIStreaming(fullPrompt);
        return;
      }

      setIsAILoading(true);
      try {
        const generatedText = await onAIGenerate!(fullPrompt);
        const processedText = replaceVariables(generatedText);
        const hasSelection = from !== to;

        if (hasSelection) {
          insertContentAtPosition(editor, processedText, from, to);
        } else {
          editor.chain().focus().insertContent(processedText).run();
        }

        toast.success(getAISuccessMessage(command.label));
      } catch (error) {
        console.error("Erro ao processar com IA:", error);
        toast.error("Erro ao processar com IA");
      } finally {
        setIsAILoading(false);
      }
    },
    [editor, onAIGenerate, onAIStream, runAIStreaming, replaceVariables]
  );

  const setLink = useCallback(() => {
    if (!editor || readOnly) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = globalThis.window?.prompt("URL do link:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor, readOnly]);

  const addImage = useCallback(() => {
    if (!editor || readOnly) return;

    const url = globalThis.window?.prompt("URL da imagem:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor, readOnly]);

  // Imprimir / Exportar PDF com layout A4
  const handlePrint = useCallback(() => {
    if (!editor) return;

    const html = editor.getHTML();
    const printWindow = globalThis.window?.open("", "_blank");

    if (!printWindow) {
      toast.error("Habilite pop-ups para imprimir/exportar PDF");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charSet="utf-8" />
          <title>Documento</title>
          <style>
            @page {
              size: A4;
              margin: 2.5cm 2.5cm 2cm 3cm;
            }
            html, body {
              padding: 0;
              margin: 0;
              height: 100%;
            }
            body {
              -webkit-print-color-adjust: exact;
              font-family: "Times New Roman", Times, serif;
              font-size: 12pt;
              background: #ffffff;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 2.5cm 2.5cm 2cm 3cm;
              box-sizing: border-box;
            }
            h1, h2, h3, h4 {
              page-break-after: avoid;
            }
            p {
              text-align: justify;
              line-height: 1.5;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
            }
            @media print {
              body {
                counter-reset: page;
              }
              .page-footer {
                position: fixed;
                bottom: 1cm;
                right: 2.5cm;
                font-size: 10pt;
              }
              .page-footer::after {
                content: "Página " counter(page);
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            ${html}
          </div>
          <div class="page-footer"></div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [editor]);

  if (!editor) return null;

  const editingDisabled = readOnly || isStreaming || isAILoading;

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar - Using extracted components to reduce CC */}
      <div className="border-b bg-muted p-2 flex flex-wrap items-center gap-1">
        <UndoRedoButtons editor={editor} disabled={editingDisabled} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <TextFormattingButtons editor={editor} disabled={editingDisabled} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <HeadingsPopover editor={editor} disabled={editingDisabled} />
        <ListButtons editor={editor} disabled={editingDisabled} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <AlignmentButtons editor={editor} disabled={editingDisabled} />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <ExtraFormattingButtons editor={editor} disabled={editingDisabled} />
        <ColorPickerPopover editor={editor} disabled={editingDisabled} />
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link, Imagem */}
        <Button
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          onClick={setLink}
          disabled={editingDisabled}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={addImage}
          disabled={editingDisabled}
          title="Imagem"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Limpar formatação */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          disabled={editingDisabled}
          title="Limpar formatação"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Imprimir / PDF (A4) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrint}
          title="Imprimir / Exportar PDF (A4)"
        >
          <Printer className="h-4 w-4" />
        </Button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* IA - Renderizado condicionalmente */}
        {(onAIGenerate || onAIStream) && (
          <AIToolbarSection
            isStreaming={isStreaming}
            isAILoading={isAILoading}
            showAIPopover={showAIPopover}
            setShowAIPopover={setShowAIPopover}
            onAIStream={onAIStream}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            streamingText={streamingText}
            handleAIGenerate={handleAIGenerate}
            handleQuickAI={handleQuickAI}
            aiQuickCommands={aiQuickCommands}
          />
        )}
      </div>

      {/* Área do editor */}
      <div className="p-4 bg-background">
        <div
          className="bg-white dark:bg-slate-900 rounded-lg border shadow-sm mx-auto"
          style={{ maxWidth: "800px", minHeight: "300px" }}
        >
          <EditorContent
            editor={editor}
            className={cn(
              "prose prose-sm dark:prose-invert max-w-none",
              "p-6",
              "[&_.ProseMirror]:outline-none",
              "[&_.ProseMirror]:min-h-[250px]",
              "[&_.ProseMirror]:text-foreground",
              "[&_.ProseMirror_p]:text-foreground",
              "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
              "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
              "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
              "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
              "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
              "[&_.ProseMirror_p.is-editor-empty:first-child::before]:opacity-60"
            )}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{wordCount} palavras</span>
          <span>{charCount} caracteres</span>
        </div>
        {Object.keys(variables).length > 0 && (
          <Badge variant="outline" className="text-xs">
            {Object.keys(variables).length} variável(is) disponível(is)
          </Badge>
        )}
      </div>
    </div>
  );
}

export default TiptapEditor;
