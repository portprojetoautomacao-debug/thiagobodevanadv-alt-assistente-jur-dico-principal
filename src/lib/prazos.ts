import { addDays, isWeekend, format, differenceInDays, parseISO } from 'date-fns'
import type { Feriado } from '@/types'

const feriadosNacionais2025: Feriado[] = [
  { data: '2025-01-01', nome: 'Ano Novo', tipo: 'nacional' },
  { data: '2025-04-18', nome: 'Sexta-feira Santa', tipo: 'nacional' },
  { data: '2025-04-21', nome: 'Tiradentes', tipo: 'nacional' },
  { data: '2025-05-01', nome: 'Dia do Trabalho', tipo: 'nacional' },
  { data: '2025-06-19', nome: 'Corpus Christi', tipo: 'nacional' },
  { data: '2025-09-07', nome: 'Independência do Brasil', tipo: 'nacional' },
  { data: '2025-10-12', nome: 'Nossa Senhora Aparecida', tipo: 'nacional' },
  { data: '2025-11-02', nome: 'Finados', tipo: 'nacional' },
  { data: '2025-11-15', nome: 'Proclamação da República', tipo: 'nacional' },
  { data: '2025-12-25', nome: 'Natal', tipo: 'nacional' },
]

export function getFeriadosNacionais(): Feriado[] {
  return feriadosNacionais2025
}

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

  while (diasContados < diasCorridos) {
    dataFinal = addDays(dataFinal, 1)
    if (isDiaUtil(dataFinal)) {
      diasContados++
    }
  }

  while (!isDiaUtil(dataFinal)) {
    dataFinal = addDays(dataFinal, 1)
  }

  return dataFinal
}

export function calcularPrazoCLT(dataInicio: Date, diasCorridos: number): Date {
  let dataFinal = addDays(dataInicio, diasCorridos)

  while (!isDiaUtil(dataFinal)) {
    dataFinal = addDays(dataFinal, 1)
  }

  return dataFinal
}

export function calcularDiasRestantes(dataFinal: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const final = parseISO(dataFinal)
  final.setHours(0, 0, 0, 0)
  
  return differenceInDays(final, hoje)
}

export function isUrgente(diasRestantes: number): boolean {
  return diasRestantes >= 0 && diasRestantes <= 5
}

export function formatarData(dataISO: string): string {
  const date = parseISO(dataISO)
  return format(date, 'dd/MM/yyyy')
}

export function formatarNumeroCNJ(numero: string): string {
  const cleanNumber = numero.replace(/\D/g, '')
  
  if (cleanNumber.length !== 20) return numero

  const nnnnnnn = cleanNumber.slice(0, 7)
  const dd = cleanNumber.slice(7, 9)
  const aaaa = cleanNumber.slice(9, 13)
  const j = cleanNumber.slice(13, 14)
  const tr = cleanNumber.slice(14, 16)
  const oooo = cleanNumber.slice(16, 20)

  return `${nnnnnnn}-${dd}.${aaaa}.${j}.${tr}.${oooo}`
}

export function validarNumeroCNJ(numero: string): boolean {
  const cleanNumber = numero.replace(/\D/g, '')
  
  if (cleanNumber.length !== 20) return false

  const ano = parseInt(cleanNumber.slice(9, 13))
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()

  if (ano < 1900 || ano > anoAtual + 1) return false

  return true
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}
