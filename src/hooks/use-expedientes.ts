import type { Expediente } from '@/types'
import { useKV } from './use-kv'

/**
 * Hook para gerenciar expedientes (intimações, publicações, etc.)
 */
export function useExpedientes() {
  const [expedientes, setExpedientes] = useKV<Expediente[]>('expedientes', [])

  const addExpediente = (expediente: Expediente) => {
    setExpedientes([...expedientes, expediente])
  }

  const updateExpediente = (id: string, updates: Partial<Expediente>) => {
    setExpedientes(
      expedientes.map((exp: Expediente) => 
        exp.id === id ? { ...exp, ...updates } : exp
      )
    )
  }

  const deleteExpediente = (id: string) => {
    setExpedientes(expedientes.filter((exp: Expediente) => exp.id !== id))
  }

  const getExpedienteById = (id: string) => {
    return expedientes.find((exp: Expediente) => exp.id === id)
  }

  const expedientesNaoLidos = expedientes.filter((exp: Expediente) => !exp.lido)

  return {
    expedientes,
    expedientesNaoLidos,
    addExpediente,
    updateExpediente,
    deleteExpediente,
    getExpedienteById,
  }
}
