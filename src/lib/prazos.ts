import { addDays, isWeekend, format, parse, differenceInDays } from 'date-fns'
import type { Feriado } from '@/types'
import type { Feriado } from '@/types'

  { data: '2025-04-21', nome: 'Tiradentes'
  { data: '2025-06-19', nome: 'Corpus Christi', tipo: 'nacion
  { data: '2025-10-12', nome: 'Nossa Senhora Aparecida', tipo
  { data: '2025-11-15', nome: 'Proclamação da República', tipo: 'nacio
  { data: '2025-12-25', nome: 'Natal', tipo: 'nacional' },

  const dateStr = format(date, 'yyyy-MM-dd')
}
export function isDiaUtil(date: Date): boolean {
}
export function calcularPrazoCPC(dataInicio: Date, diasCorridos: number): Dat
  let diasContados = 0
  { data: '2025-12-25', nome: 'Natal', tipo: 'nacional' },
]

export function isFeriado(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd')
  return feriadosNacionais2025.some(f => f.data === dateStr)
}

export function isDiaUtil(date: Date): boolean {
  return !isWeekend(date) && !isFeriado(date)
}

export function calcularPrazoCPC(dataInicio: Date, diasCorridos: number): Date {
  let dataFinal = dataInicio
  let diasContados = 0


  return dataFinal
    if (isDiaUtil(dataFinal)) {
      diasContados++
    }
  }

  while (!isDiaUtil(dataFinal)) {
    dataFinal = addDays(dataFinal, 1)
  }

  return dataFinal
 

export function calcularPrazoCLT(dataInicio: Date, diasCorridos: number): Date {
  let dataFinal = addDays(dataInicio, diasCorridos)

  while (!isDiaUtil(dataFinal)) {
export function formatarNumeroCNJ(num
  }

  return dataFinal
}

  hoje.setHours(0, 0, 0, 0)
  const cleanNumber = numero.replace(/\D/g, '')
  
  if (cleanNumber.length !== 20) return false
}
  const nnnnnnn = cleanNumber.slice(0, 7)
  const dd = cleanNumber.slice(7, 9)
  const aaaa = cleanNumber.slice(9, 13)




















































