import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  TextH,
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  TextAlignLeft,
  TextAlignCenter,
  TextAlignRight,
  TextAlignJustify,
  Quotes,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  ArrowCounterClockwise,
  ArrowClockwise,
  Eraser,
  Robot,
  SpinnerGap,
  Lightning,
  MagicWand,
  Sparkle,
  ArrowsOut,
  TextAa,
  Palette,
  Printer,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  readonly content: string
  readonly onChange: (content: string) => void
  readonly placeholder?: string
  readonly className?: string
  readonly readOnly?: boolean
  readonly onAIGenerate?: (prompt: string) => Promise<string>
  readonly onAIStream?: (prompt: string, callbacks: {
    onChunk: (chunk: string) => void
    onComplete: () => void
    onError: (error: Error) => void
  }) => Promise<void>
  readonly variables?: Record<string, string>
}

const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#DC2626', '#EA580C', '#D97706', '#CA8A04',
  '#16A34A', '#059669', '#0D9488', '#0891B2',
  '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
  '#C026D3', '#DB2777', '#E11D48',
]

const AI_QUICK_COMMANDS = [
  {
    label: 'Expandir',
    icon: ArrowsOut,
    prompt: 'Expanda e desenvolva o seguinte texto de forma mais detalhada e formal:',
  },
  {
    label: 'Resumir',
    icon: TextAa,
    prompt: 'Resuma o seguinte texto de forma concisa:',
  },
  {
    label: 'Formalizar',
    icon: MagicWand,
    prompt: 'Reescreva o seguinte texto em linguagem jurídica formal:',
  },
  {
    label: 'Corrigir',
    icon: Sparkle,
    prompt: 'Corrija erros de gramática e ortografia no seguinte texto:',
  },
] as const

// ===========================
// Helper Functions
// ===========================

function countWords(text: string): number {
  return text.trim().length === 0
    ? 0
    : text.trim().split(/\s+/).filter(w => w.length > 0).length
}

function getGenerateButtonText(isStreaming: boolean, hasStreamSupport: boolean): string {
  if (isStreaming) return 'Gerando...'
  return hasStreamSupport ? 'Gerar com Streaming' : 'Gerar Texto'
}

function getAIButtonClassName(isStreaming: boolean): string {
  const base = 'gap-2 border-purple-500/20 hover:border-purple-500/40'
  return isStreaming
    ? `${base} bg-purple-500/20 animate-pulse`
    : `${base} bg-gradient-to-r from-purple-500/10 to-blue-500/10`
}

// ===========================
// Toolbar Button Components - Extraídos para reduzir CC
// ===========================

interface ToolbarButtonProps {
  readonly editor: ReturnType<typeof useEditor>
  readonly disabled: boolean
}

function UndoRedoButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo() || disabled}
        title="Desfazer"
      >
        <ArrowCounterClockwise className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo() || disabled}
        title="Refazer"
      >
        <ArrowClockwise className="h-4 w-4" />
      </Button>
    </>
  )
}

function TextFormattingButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
  return (
    <>
      <Button
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        title="Negrito (Ctrl+B)"
      >
        <TextB className="h-4 w-4" weight="bold" />
      </Button>
      <Button
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        title="Itálico (Ctrl+I)"
      >
        <TextItalic className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
        title="Sublinhado (Ctrl+U)"
      >
        <TextUnderline className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        title="Tachado"
      >
        <TextStrikethrough className="h-4 w-4" />
      </Button>
    </>
  )
}

function HeadingsPopover({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Títulos" disabled={disabled}>
          <TextH className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex flex-col gap-1">
          <Button
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="justify-start"
          >
            <TextHOne className="h-4 w-4 mr-2" /> Título 1
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="justify-start"
          >
            <TextHTwo className="h-4 w-4 mr-2" /> Título 2
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className="justify-start"
          >
            <TextHThree className="h-4 w-4 mr-2" /> Título 3
          </Button>
          <Button
            variant={editor.isActive('paragraph') ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className="justify-start"
          >
            <TextAa className="h-4 w-4 mr-2" /> Parágrafo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ListButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
  return (
    <>
      <Button
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        title="Lista com marcadores"
      >
        <ListBullets className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        title="Lista numerada"
      >
        <ListNumbers className="h-4 w-4" />
      </Button>
    </>
  )
}

function AlignmentButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
  return (
    <>
      <Button
        variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        disabled={disabled}
        title="Alinhar à esquerda"
      >
        <TextAlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        disabled={disabled}
        title="Centralizar"
      >
        <TextAlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        disabled={disabled}
        title="Alinhar à direita"
      >
        <TextAlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        disabled={disabled}
        title="Justificar"
      >
        <TextAlignJustify className="h-4 w-4" />
      </Button>
    </>
  )
}

function ExtraFormattingButtons({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
  return (
    <>
      <Button
        variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
        title="Citação"
      >
        <Quotes className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={disabled}
        title="Bloco de código"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant={editor.isActive('highlight') ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={disabled}
        title="Destacar"
      >
        <Highlighter className="h-4 w-4" />
      </Button>
    </>
  )
}

function ColorPickerPopover({ editor, disabled }: ToolbarButtonProps) {
  if (!editor) return null
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
  )
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Digite ou use /ai para comandos de IA...',
  className,
  readOnly = false,
  onAIGenerate,
  onAIStream,
  variables = {},
}: TiptapEditorProps) {
  const [isAILoading, setIsAILoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAIPopover, setShowAIPopover] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

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
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
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
      const html = editor.getHTML()
      onChange(html)

      const text = editor.getText()
      setCharCount(text.length)
      setWordCount(countWords(text))
    },
  })

  // Sincronizar conteúdo externo sem loop
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  // Substituir variáveis no conteúdo
  const replaceVariables = useCallback((text: string) => {
    let result = text
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
      result = result.replace(regex, value)
    })
    return result
  }, [variables])

  const aiQuickCommands = AI_QUICK_COMMANDS

  // Execução genérica de IA em streaming (respeita posição/seleção atual)
  const runAIStreaming = useCallback(async (prompt: string) => {
    if (!editor || !onAIStream) return

    const { from, to } = editor.state.selection
    const hasSelection = from !== to

    setIsStreaming(true)
    setStreamingText('')

    let accumulated = ''

    try {
      await onAIStream(prompt, {
        onChunk: (chunk: string) => {
          accumulated += chunk
          setStreamingText(accumulated)
        },
        onComplete: () => {
          const finalText = replaceVariables(accumulated)

          editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .deleteSelection()
            .insertContent(finalText)
            .run()

          setIsStreaming(false)
          setStreamingText('')
          setAiPrompt('')
          setShowAIPopover(false)
          toast.success(
            hasSelection
              ? 'Texto atualizado com IA (streaming)!'
              : 'Texto inserido com IA (streaming)!',
          )
        },
        onError: (error: Error) => {
          console.error('Erro no streaming:', error)
          toast.error('Erro no streaming de IA')
          setIsStreaming(false)
          setStreamingText('')
        },
      })
    } catch (error) {
      console.error('Erro ao iniciar streaming:', error)
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [editor, onAIStream, replaceVariables])

  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || !editor) return
    const prompt = aiPrompt.trim()

    // Streaming
    if (onAIStream) {
      await runAIStreaming(prompt)
      return
    }

    if (!onAIGenerate) return

    setIsAILoading(true)
    try {
      const generatedText = await onAIGenerate(prompt)
      const processedText = replaceVariables(generatedText)

      const { from, to } = editor.state.selection

      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(processedText)
        .run()

      setAiPrompt('')
      setShowAIPopover(false)
      toast.success('Texto gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar texto com IA:', error)
      toast.error('Erro ao gerar texto com IA')
    } finally {
      setIsAILoading(false)
    }
  }, [aiPrompt, editor, onAIGenerate, onAIStream, runAIStreaming, replaceVariables])

  const handleQuickAI = useCallback(async (command: (typeof aiQuickCommands)[number]) => {
    if (!editor || (!onAIGenerate && !onAIStream)) return

    const { from, to } = editor.state.selection
    const hasSelection = from !== to

    const selectedText = hasSelection
      ? editor.state.doc.textBetween(from, to, ' ')
      : editor.getText()

    if (!selectedText.trim()) {
      toast.error('Selecione um texto ou escreva algo primeiro')
      return
    }

    const fullPrompt = `${command.prompt}\n\n"${selectedText}"`

    if (onAIStream) {
      await runAIStreaming(fullPrompt)
      return
    }

    setIsAILoading(true)
    try {
      const generatedText = await onAIGenerate!(fullPrompt)
      const processedText = replaceVariables(generatedText)

      if (hasSelection) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .deleteSelection()
          .insertContent(processedText)
          .run()
      } else {
        // Sem seleção: insere no cursor (comportamento mais “Word/Docs”)
        editor
          .chain()
          .focus()
          .insertContent(processedText)
          .run()
      }

      toast.success(`Texto ${command.label.toLowerCase()}!`)
    } catch (error) {
      console.error('Erro ao processar com IA:', error)
      toast.error('Erro ao processar com IA')
    } finally {
      setIsAILoading(false)
    }
  }, [editor, onAIGenerate, onAIStream, runAIStreaming, replaceVariables])

  const setLink = useCallback(() => {
    if (!editor || readOnly) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL do link:', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor, readOnly])

  const addImage = useCallback(() => {
    if (!editor || readOnly) return

    const url = window.prompt('URL da imagem:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor, readOnly])

  // Imprimir / Exportar PDF com layout A4
  const handlePrint = useCallback(() => {
    if (!editor) return

    const html = editor.getHTML()
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      toast.error('Habilite pop-ups para imprimir/exportar PDF')
      return
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
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }, [editor])

  if (!editor) return null

  const editingDisabled = readOnly || isStreaming || isAILoading

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {/* Toolbar - Using extracted components to reduce CC */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap items-center gap-1">
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
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
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

      {/* Área tipo folha A4 */}
      <div className="bg-muted/40 px-4 py-4 flex justify-center">
        <div className="bg-background shadow-sm w-[210mm] min-h-[297mm] px-10 py-10 rounded-sm">
          <EditorContent
            editor={editor}
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none',
              'min-h-[277mm] focus:outline-none',
              '[&_.ProseMirror]:outline-none',
              '[&_.ProseMirror]:min-h-[277mm]',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
            )}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
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
  )
}

export default TiptapEditor
