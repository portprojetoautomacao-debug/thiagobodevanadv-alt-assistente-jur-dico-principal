import { useEffect, useState, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo } from '@/types'
import { toast } from 'sonner'

interface NotificationSettings {
  enabled: boolean
  deadlineAlerts: boolean
  agentAlerts: boolean
  checkInterval: number // in milliseconds
}

interface StoredNotification {
  id: string
  prazoId: string
  processoId: string
  daysRemaining: number
  lastNotified: string
}

export function useNotifications() {
  const [processes] = useKV<Process[]>('processes', [])
  const [settings, setSettings] = useKV<NotificationSettings>('notification-settings', {
    enabled: true,
    deadlineAlerts: true,
    agentAlerts: true,
    checkInterval: 60000, // 1 minute
  })
  const [notifiedPrazos, setNotifiedPrazos] = useKV<StoredNotification[]>('notified-prazos', [])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Notificações não são suportadas neste navegador')
      return false
    }

    if (Notification.permission === 'granted') {
      setPermission('granted')
      return true
    }

    if (Notification.permission === 'denied') {
      setPermission('denied')
      toast.error('Permissão de notificações negada. Ative nas configurações do navegador.')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        toast.success('Notificações ativadas!')
        return true
      } else {
        toast.error('Permissão de notificações negada')
        return false
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }, [])

  // Send notification
  const sendNotification = useCallback((title: string, body: string, tag?: string) => {
    if (Notification.permission !== 'granted' || !settings.enabled) {
      return
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag || `notification-${Date.now()}`,
        requireInteraction: false,
        silent: false,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000)
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }, [settings.enabled])

  // Check if we should notify about a prazo
  const shouldNotify = useCallback((prazo: Prazo, daysRemaining: number): boolean => {
    if (prazo.concluido) return false
    if (![7, 2, 1, 0].includes(daysRemaining)) return false

    const existing = notifiedPrazos.find(n => n.prazoId === prazo.id && n.daysRemaining === daysRemaining)
    
    if (!existing) return true

    // Only notify again after 12 hours
    const lastNotified = new Date(existing.lastNotified)
    const hoursSinceLastNotification = (Date.now() - lastNotified.getTime()) / (1000 * 60 * 60)
    
    return hoursSinceLastNotification >= 12
  }, [notifiedPrazos])

  // Mark prazo as notified
  const markAsNotified = useCallback((prazoId: string, processoId: string, daysRemaining: number) => {
    setNotifiedPrazos((current) => {
      const filtered = (current || []).filter(
        n => !(n.prazoId === prazoId && n.daysRemaining === daysRemaining)
      )
      
      return [
        ...filtered,
        {
          id: crypto.randomUUID(),
          prazoId,
          processoId,
          daysRemaining,
          lastNotified: new Date().toISOString(),
        }
      ]
    })
  }, [setNotifiedPrazos])

  // Check deadlines and send notifications
  const checkDeadlines = useCallback(() => {
    if (!settings.enabled || !settings.deadlineAlerts) return
    if (Notification.permission !== 'granted') return

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    let urgentCount = 0

    processes.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          if (prazo.concluido) return

          const vencimento = new Date(prazo.dataFinal)
          vencimento.setHours(0, 0, 0, 0)
          
          const diffTime = vencimento.getTime() - hoje.getTime()
          const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          if (daysRemaining <= 7 && daysRemaining >= 0) {
            urgentCount++
          }

          if (shouldNotify(prazo, daysRemaining)) {
            let emoji = '📅'
            let urgency = ''
            
            if (daysRemaining === 0) {
              emoji = '🚨'
              urgency = 'URGENTE - VENCE HOJE!'
            } else if (daysRemaining === 1) {
              emoji = '⚠️'
              urgency = 'ATENÇÃO - Vence amanhã!'
            } else if (daysRemaining === 2) {
              emoji = '⏰'
              urgency = 'Vence em 2 dias'
            } else if (daysRemaining === 7) {
              emoji = '📌'
              urgency = 'Vence em 7 dias'
            }

            const title = `${emoji} ${urgency}`
            const body = `${prazo.titulo}\nProcesso: ${process.titulo || process.numeroCNJ}`

            sendNotification(title, body, `prazo-${prazo.id}-${daysRemaining}`)
            markAsNotified(prazo.id, process.id, daysRemaining)
            
            // Also show toast for immediate feedback
            if (daysRemaining <= 1) {
              toast.error(title, {
                description: body,
                duration: 10000,
              })
            } else {
              toast.warning(title, {
                description: body,
                duration: 8000,
              })
            }
          }
        })
      }
    })

    setUnreadCount(urgentCount)
  }, [processes, settings, shouldNotify, markAsNotified, sendNotification])

  // Auto-request permission on first load
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      if (Notification.permission === 'default') {
        // Wait 5 seconds before requesting to avoid overwhelming the user
        const timer = setTimeout(() => {
          toast.info('Ative as notificações para receber alertas de prazos', {
            action: {
              label: 'Ativar',
              onClick: requestPermission,
            },
            duration: 10000,
          })
        }, 5000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [requestPermission])

  // Set up periodic deadline checking
  useEffect(() => {
    if (!settings.enabled || !settings.deadlineAlerts) return

    // Check immediately
    checkDeadlines()

    // Then check periodically
    const interval = setInterval(checkDeadlines, settings.checkInterval)

    return () => clearInterval(interval)
  }, [checkDeadlines, settings.enabled, settings.deadlineAlerts, settings.checkInterval])

  // Notify about agent tasks
  const notifyAgentTask = useCallback((agentName: string, taskDescription: string, success: boolean = true) => {
    if (!settings.enabled || !settings.agentAlerts) return
    if (Notification.permission !== 'granted') return

    const emoji = success ? '✅' : '❌'
    const title = `${emoji} Agente ${agentName}`
    const body = taskDescription

    sendNotification(title, body, `agent-${agentName}-${Date.now()}`)
    
    if (success) {
      toast.success(title, { description: body })
    } else {
      toast.error(title, { description: body })
    }
  }, [settings, sendNotification])

  const toggleNotifications = useCallback(() => {
    setSettings((current) => ({
      ...current,
      enabled: !current.enabled,
    }))
  }, [setSettings])

  const toggleDeadlineAlerts = useCallback(() => {
    setSettings((current) => ({
      ...current,
      deadlineAlerts: !current.deadlineAlerts,
    }))
  }, [setSettings])

  const toggleAgentAlerts = useCallback(() => {
    setSettings((current) => ({
      ...current,
      agentAlerts: !current.agentAlerts,
    }))
  }, [setSettings])

  return {
    permission,
    settings,
    unreadCount,
    requestPermission,
    sendNotification,
    notifyAgentTask,
    toggleNotifications,
    toggleDeadlineAlerts,
    toggleAgentAlerts,
    checkDeadlines,
  }
}
