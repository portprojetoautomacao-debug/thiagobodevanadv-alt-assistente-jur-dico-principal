import type { Minuta } from '@/types'
import { useState } from 'react'

/**
 * Hook stub para integração com Google Docs
 * TODO: Implementar integração real com Google Docs API
 */
export function useGoogleDocs() {
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const createDocument = async (title: string, content: string) => {
    console.warn('useGoogleDocs.createDocument: Implementação pendente')
    return {
      id: crypto.randomUUID(),
      url: `https://docs.google.com/document/d/${crypto.randomUUID()}`,
    }
  }

  const updateDocument = async (docId: string, content: string) => {
    console.warn('useGoogleDocs.updateDocument: Implementação pendente')
    return true
  }

  const getDocument = async (docId: string) => {
    console.warn('useGoogleDocs.getDocument: Implementação pendente')
    return {
      id: docId,
      title: 'Documento',
      content: '',
    }
  }

  const syncWithGoogleDocs = async () => {
    setIsSyncing(true)
    console.warn('useGoogleDocs.syncWithGoogleDocs: Implementação pendente')
    setTimeout(() => setIsSyncing(false), 1000)
  }

  const exportToGoogleDocs = async (minuta: Minuta) => {
    console.warn('useGoogleDocs.exportToGoogleDocs: Implementação pendente')
    return {
      docId: minuta.id,
      url: `https://docs.google.com/document/d/${minuta.id}`
    }
  }

  const openDocument = (docId: string) => {
    window.open(`https://docs.google.com/document/d/${docId}`, '_blank')
  }

  const isAuthenticated = isConnected

  return {
    isConnected,
    isSyncing,
    isAuthenticated,
    createDocument,
    updateDocument,
    getDocument,
    syncWithGoogleDocs,
    exportToGoogleDocs,
    openDocument,
  }
}
