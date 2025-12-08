"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

// --- Tiptap Core Extensions ---
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Underline } from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { StarterKit } from "@tiptap/starter-kit";

// --- UI Components ---
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// --- Icons ---
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Bot,
  ChevronDown,
  Expand,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Pilcrow,
  Redo,
  Sparkles,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo,
  User,
  Wand2,
  Zap,
} from "lucide-react";

// --- Lib ---
import { cn } from "@/lib/utils";

// --- Styles ---
import "./professional-editor.scss";

// ===========================
// Props Interface
// ===========================

interface ProfessionalEditorProps {
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
  readonly showCollaboration?: boolean; // Mostrar indicador de colaboração
}

// ===========================
// AI Constants
// ===========================

const AI_QUICK_COMMANDS = [
  {
    label: "Continuar",
    icon: Zap,
    prompt: "Continue escrevendo o texto de forma natural e profissional:",
  },
  {
    label: "Expandir",
    icon: Expand,
    prompt: "Expanda e desenvolva o seguinte texto de forma mais detalhada:",
  },
  {
    label: "Revisar",
    icon: Sparkles,
    prompt: "Revise e melhore a redação do seguinte texto mantendo o significado:",
  },
  {
    label: "Formalizar",
    icon: Wand2,
    prompt: "Reescreva o seguinte texto em linguagem jurídica formal:",
  },
] as const;

const FONT_SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const COLORS = [
  "#000000",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#808080",
];

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

// ===========================
// Main Component
// ===========================

export function ProfessionalEditor({
  content,
  onChange,
  placeholder = "Digite seu texto aqui...",
  className,
  readOnly = false,
  onAIGenerate,
  onAIStream,
  variables = {},
  showCollaboration = true,
}: ProfessionalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastUserInputRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isAIActive, setIsAIActive] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [fontSize, setFontSize] = useState("16px");

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "professional-editor-content",
        spellcheck: "true",
      },
    },
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({ multicolor: true }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
      Superscript,
      Subscript,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);

      const text = ed.getText();
      setCharCount(text.length);
      setWordCount(countWords(text));

      // Detectar input do usuário
      if (!readOnly) {
        handleUserInput();
      }
    },
  });

  // ===========================
  // Human + AI Collaboration Logic
  // ===========================

  const handleUserInput = useCallback(() => {
    lastUserInputRef.current = Date.now();
    setIsUserTyping(true);

    // Pausar IA se estiver ativa
    if (isAIActive) {
      setIsAIActive(false);
    }

    // Resetar timer de inatividade
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Após 3 segundos de inatividade, IA pode retomar
    inactivityTimerRef.current = setTimeout(() => {
      setIsUserTyping(false);
      // IA pode retomar aqui se necessário
    }, 3000);
  }, [isAIActive]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Sync external content
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // ===========================
  // AI Functions
  // ===========================

  const replaceVariables = useCallback(
    (text: string) => {
      let result = text;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(String.raw`\{\{\s*${key}\s*\}\}`, "g");
        result = result.replaceAll(regex, value);
      });
      return result;
    },
    [variables]
  );

  const runAIStreaming = useCallback(
    async (prompt: string) => {
      if (!editor || !onAIStream) return;

      setIsAIActive(true);
      setIsStreaming(true);

      let accumulated = "";

      try {
        await onAIStream(prompt, {
          onChunk: (chunk: string) => {
            // Pausar se usuário começou a digitar
            if (isUserTyping) {
              return;
            }
            accumulated += chunk;
            editor.commands.insertContent(chunk);
          },
          onComplete: () => {
            setIsStreaming(false);
            setIsAIActive(false);
            setAiPrompt("");
            toast.success("IA finalizou a redação");
          },
          onError: (error: Error) => {
            console.error("Erro no streaming:", error);
            toast.error("Erro no streaming de IA");
            setIsStreaming(false);
            setIsAIActive(false);
          },
        });
      } catch (error) {
        console.error("Erro ao iniciar streaming:", error);
        setIsStreaming(false);
        setIsAIActive(false);
      }
    },
    [editor, onAIStream, isUserTyping]
  );

  const handleQuickAI = useCallback(
    async (command: (typeof AI_QUICK_COMMANDS)[number]) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      const fullPrompt = `${command.prompt}\n\n${selectedText || editor.getText()}`;

      if (onAIStream) {
        await runAIStreaming(fullPrompt);
      } else if (onAIGenerate) {
        setIsAILoading(true);
        try {
          const result = await onAIGenerate(fullPrompt);
          const processed = replaceVariables(result);
          if (from !== to) {
            editor.chain().focus().deleteSelection().insertContent(processed).run();
          } else {
            editor.commands.insertContent(processed);
          }
          toast.success(`IA aplicou: ${command.label}`);
        } catch (error) {
          toast.error("Erro ao processar comando de IA");
        } finally {
          setIsAILoading(false);
        }
      }
    },
    [editor, onAIGenerate, onAIStream, replaceVariables, runAIStreaming]
  );

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !editor) return;

    if (onAIStream) {
      await runAIStreaming(aiPrompt);
    } else if (onAIGenerate) {
      setIsAILoading(true);
      try {
        const result = await onAIGenerate(aiPrompt);
        const processed = replaceVariables(result);
        editor.commands.insertContent(processed);
        setAiPrompt("");
        toast.success("Texto gerado com IA");
      } catch (error) {
        toast.error("Erro ao gerar texto");
      } finally {
        setIsAILoading(false);
      }
    }
  }, [aiPrompt, editor, onAIGenerate, onAIStream, replaceVariables, runAIStreaming]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("professional-editor-wrapper", className)}>
      {/* Toolbar */}
      <div className="professional-editor-toolbar">
        {/* Row 1: Formatting */}
        <div className="toolbar-row">
          <div className="toolbar-group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Desfazer"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Refazer"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="toolbar-group">
            <Select
              value={fontSize}
              onValueChange={(value) => {
                setFontSize(value);
                editor.chain().focus().setMark("textStyle", { fontSize: value }).run();
              }}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="toolbar-group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              data-active={editor.isActive("bold")}
              title="Negrito"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              data-active={editor.isActive("italic")}
              title="Itálico"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              data-active={editor.isActive("underline")}
              title="Sublinhado"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              data-active={editor.isActive("strike")}
              title="Tachado"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="toolbar-group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              data-active={editor.isActive({ textAlign: "left" })}
              title="Alinhar à esquerda"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              data-active={editor.isActive({ textAlign: "center" })}
              title="Centralizar"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              data-active={editor.isActive({ textAlign: "right" })}
              title="Alinhar à direita"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
              data-active={editor.isActive({ textAlign: "justify" })}
              title="Justificar"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="toolbar-group">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              data-active={editor.isActive("bulletList")}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              data-active={editor.isActive("orderedList")}
              title="Lista numerada"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* AI Commands */}
          <div className="toolbar-group ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={isAIActive || isStreaming ? "default" : "ghost"}
                  size="sm"
                  title="Comandos de IA"
                >
                  {isAIActive || isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Comandos Rápidos</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {AI_QUICK_COMMANDS.map((cmd) => (
                        <Button
                          key={cmd.label}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAI(cmd)}
                          disabled={isStreaming || isAILoading}
                          className="justify-start"
                        >
                          <cmd.icon className="h-3 w-3 mr-2" />
                          {cmd.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gerar com IA</label>
                    <Input
                      placeholder="Digite o que deseja..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAIGenerate()}
                    />
                    <Button
                      className="w-full"
                      onClick={handleAIGenerate}
                      disabled={!aiPrompt.trim() || isAILoading || isStreaming}
                    >
                      {isAILoading || isStreaming ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Gerar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Collaboration Indicator */}
      {showCollaboration && (
        <div className="collaboration-indicator">
          {isUserTyping && (
            <Badge variant="default" className="bg-blue-500">
              <User className="h-3 w-3 mr-1" />
              Você está editando
            </Badge>
          )}
          {isAIActive && !isUserTyping && (
            <Badge variant="default" className="bg-purple-500">
              <Bot className="h-3 w-3 mr-1" />
              IA escrevendo...
            </Badge>
          )}
        </div>
      )}

      {/* Editor Content - A4 Page Style */}
      <div className="professional-editor-page" ref={editorRef}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer - Word Count */}
      <div className="professional-editor-footer">
        <div className="text-xs text-muted-foreground">
          {wordCount} {wordCount === 1 ? "palavra" : "palavras"} • {charCount}{" "}
          {charCount === 1 ? "caractere" : "caracteres"}
        </div>
      </div>
    </div>
  );
}
