import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Keyboard } from '@phosphor-icons/react'

interface ShortcutItemProps {
  keys: string[]
  description: string
}

function ShortcutItem({ keys, description }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <Badge key={i} variant="outline" className="font-mono">
            {key}
          </Badge>
        ))}
      </div>
    </div>
  )
}

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const ctrlKey = isMac ? '⌘' : 'Ctrl'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={24} />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente pelo sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Navegação</h3>
            <div className="space-y-1">
              <ShortcutItem keys={[ctrlKey, 'D']} description="Ir para Dashboard" />
              <ShortcutItem keys={[ctrlKey, 'P']} description="Ir para Processos" />
              <ShortcutItem keys={[ctrlKey, 'K']} description="Buscar processos" />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">Ações Rápidas</h3>
            <div className="space-y-1">
              <ShortcutItem keys={[ctrlKey, 'N']} description="Novo processo (mostra dica)" />
              <ShortcutItem keys={[ctrlKey, 'Shift', 'C']} description="Abrir Calculadora de Prazos" />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">Geral</h3>
            <div className="space-y-1">
              <ShortcutItem keys={['Esc']} description="Fechar diálogos" />
              <ShortcutItem keys={['Tab']} description="Navegar entre campos" />
              <ShortcutItem keys={['Shift', 'Tab']} description="Navegar para trás" />
            </div>
          </div>

          <Separator />

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> Você pode pressionar{' '}
              <Badge variant="outline" className="font-mono mx-1">?</Badge>
              {' '}a qualquer momento para ver esta lista de atalhos.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
