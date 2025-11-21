import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastCount = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 3000 }: Omit<Toast, 'id'>) => {
      const id = String(toastCount++)
      const newToast: Toast = { id, title, description, variant, duration }

      setState((prev) => ({
        toasts: [...prev.toasts, newToast],
      }))

      // Auto remove after duration
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }

      return id
    },
    []
  )

  const dismiss = useCallback((toastId?: string) => {
    setState((prev) => ({
      toasts: toastId
        ? prev.toasts.filter((t) => t.id !== toastId)
        : [],
    }))
  }, [])

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  }
}
