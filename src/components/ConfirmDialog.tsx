import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Warning } from '@phosphor-icons/react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive'

  const handleConfirmClick = () => {
    // suporta tanto função sync quanto async, sem quebrar o AlertDialog
    const result = onConfirm()
    if (result instanceof Promise) {
      result.catch((err) => {
        console.error('[ConfirmDialog] Erro no onConfirm:', err)
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="glassmorphic">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDestructive && (
              <Warning
                className="text-destructive"
                size={24}
                weight="fill"
              />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClick}
            className={
              isDestructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'button-gradient'
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
