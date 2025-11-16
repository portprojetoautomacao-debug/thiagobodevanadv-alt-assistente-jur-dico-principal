import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

  type: 'pageview' | 'acti
  data: {
    category?: string
    label?: string
    error
    viewport?: {
      height: number
  }

  const [events, s
  const trackPageV
      id: `${Date.now(
      timestamp:
        path,
        viewport: {
     
   


      return newEvents.slice(-10
  }

  const trackPageView = (path: string) => {
    const event: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'pageview',
      timestamp: Date.now(),
      data: {
        path,
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

  const trackAction = (action: string, category?: string, label?: string, value?: number) => {
    const event: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'action',
      timestamp: Date.now(),
      data: {
        action,
        category,
        label,
        value,
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

  const trackError = (error: string, path?: string) => {
    const event: AnalyticsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      timestamp: Date.now(),
      data: {
        error,
        path,
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

  const clearEvents = () => {
    setEvents(() => [])
  }

  const getAnalytics = () => {
    const eventsList = events || []
    const now = Date.now()
    const last24h = eventsList.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000)
    const last7d = eventsList.filter(e => now - e.timestamp < 7 * 24 * 60 * 60 * 1000)

    const pageViews = last24h.filter(e => e.type === 'pageview')
    const actions = last24h.filter(e => e.type === 'action')
    const errors = last24h.filter(e => e.type === 'error')

    const popularPages = Object.entries(
      pageViews.reduce((acc, e) => {
        const path = e.data.path || 'unknown'
        acc[path] = (acc[path] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topActions = Object.entries(
      actions.reduce((acc, e) => {
        const action = e.data.action || 'unknown'
        acc[action] = (acc[action] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      last24h: {
        total: last24h.length,
        pageViews: pageViews.length,
        actions: actions.length,

























  }, [path, trackPageView])

