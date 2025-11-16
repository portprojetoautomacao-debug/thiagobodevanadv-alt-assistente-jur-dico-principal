import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

export interface AnalyticsEvent {
  id: string
  type: 'pageview' | 'action' | 'error'
  timestamp: number
  data: {
    path?: string
    action?: string
    category?: string
    label?: string
    value?: number
    error?: string
    userAgent?: string
    viewport?: { width: number; height: number }
  }
}

export function useAnalytics() {
  const [events, setEvents] = useKV<AnalyticsEvent[]>('analytics-events', [])

  const track = (
    type: AnalyticsEvent['type'],
    data: AnalyticsEvent['data']
  ) => {
    const event: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      data: {
        ...data,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    }

    setEvents((currentEvents) => {
      const eventsList = currentEvents || []
      const newEvents = [...eventsList, event]
      return newEvents.slice(-1000)
    })
  }

  const trackPageView = (path: string) => {
    track('pageview', { path })
  }

  const trackAction = (
    action: string,
    category?: string,
    label?: string,
    value?: number
  ) => {
    track('action', { action, category, label, value })
  }

  const trackError = (error: string) => {
    track('error', { error })
  }

  const clearEvents = () => {
    setEvents([])
  }

  const getAnalytics = () => {
    const eventList = events || []
    const now = Date.now()
    const last24h = eventList.filter((e) => now - e.timestamp < 86400000)
    const last7d = eventList.filter((e) => now - e.timestamp < 604800000)

    const pageViews = last24h.filter((e) => e.type === 'pageview')
    const actions = last24h.filter((e) => e.type === 'action')
    const errors = last24h.filter((e) => e.type === 'error')

    const popularPages = pageViews.reduce((acc, event) => {
      const path = event.data.path || 'unknown'
      acc[path] = (acc[path] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topActions = actions.reduce((acc, event) => {
      const action = event.data.action || 'unknown'
      acc[action] = (acc[action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEvents: eventList.length,
      last24h: {
        total: last24h.length,
        pageViews: pageViews.length,
        actions: actions.length,
        errors: errors.length,
        popularPages,
        topActions,
      },
      last7d: {
        total: last7d.length,
      },
    }
  }

  return {
    trackPageView,
    trackAction,
    trackError,
    clearEvents,
    getAnalytics,
    events,
  }
}

export function usePageViewTracking(path: string) {
  const { trackPageView } = useAnalytics()

  useEffect(() => {
    trackPageView(path)
  }, [path])
}
