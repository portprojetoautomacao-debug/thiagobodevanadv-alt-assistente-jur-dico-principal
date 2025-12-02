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
    readonly confirmDisabled?: boolean
    readonly autoCloseOnConfirmResult?: boolean
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly title: string
  readonly description: string
  readonly confirmText?: string
  readonly cancelText?: string
  readonly onConfirm: () => void | Promise<void>
  readonly variant?: 'default' | 'destructive'
}

export default function ConfirmDialog({
    confirmDisabled = false,
    autoCloseOnConfirmResult = true,
  open,
  onOpenChange,
    const [confirming, setConfirming] = useState(false)
  title,
    const handleConfirmClick = () => {
  confirmText = 'Confirmar',
      try {
        const res = onConfirm()
        if (res instanceof Promise) {
          setConfirming(true)
          res
            .then((value) => {
              if (autoCloseOnConfirmResult && value === true) {
                onOpenChange(false)
              }
            })
            .catch((err) => {
              console.error('[ConfirmDialog] Erro no onConfirm:', err)
            })
            .finally(() => setConfirming(false))
        } else {
          if (autoCloseOnConfirmResult && res === true) {
            onOpenChange(false)
          }
        }
      } catch (err) {
        console.error('[ConfirmDialog] Erro no onConfirm (sync):', err)
      }
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
              disabled={confirmDisabled || confirming}
          </AlertDialogCancel>
              {confirming ? 'Processando...' : confirmText}
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
