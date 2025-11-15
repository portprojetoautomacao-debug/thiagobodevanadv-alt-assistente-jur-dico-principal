import { addDays, isWeekend, format, parse, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Feriado } from '@/types'

const feriadosNacionais2025: Feriado[] = [
  { data: '2025-01-01', nome: 'Ano Novo', tipo: 'nacional' },
  { data: '2025-03-04', nome: 'Carnaval', tipo: 'nacional' },
  { data: '2025-04-18', nome: 'Sexta-feira Santa', tipo: 'nacional' },
  { data: '2025-04-21', nome: 'Tiradentes', tipo: 'nacional' },
  { data: '2025-05-01', nome: 'Dia do Trabalhador', tipo: 'nacional' },
  { data: '2025-06-19', nome: 'Corpus Christi', tipo: 'nacional' },
  { data: '2025-09-07', nome: 'Independência do Brasil', tipo: 'nacional' },
  { data: '2025-10-12', nome: 'Nossa Senhora Aparecida', tipo: 'nacional' },
  { data: '2025-11-02', nome: 'Finados', tipo: 'nacional' },
  { data: '2025-11-15', nome: 'Proclamação da República', tipo: 'nacional' },
  { data: '2025-11-20', nome: 'Consciência Negra', tipo: 'nacional' },
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

export function validarNumeroCNJ(numero: string): boolean {
  const cleanNumber = numero.replace(/\D/g, '')
  return cleanNumber.length === 20
}

export function formatarNumeroCNJ(numero: string): string {
  const clean = numero.replace(/\D/g, '')
  if (clean.length !== 20) return numero
  
  return `${clean.slice(0, 7)}-${clean.slice(7, 9)}.${clean.slice(9, 13)}.${clean.slice(13, 14)}.${clean.slice(14, 16)}.${clean.slice(16, 20)}`
}

export function calcularDiasRestantes(dataFinal: string): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const final = parse(dataFinal, 'yyyy-MM-dd', new Date())
  final.setHours(0, 0, 0, 0)
  
  return differenceInDays(final, hoje)
}

export function formatarData(data: string): string {
  const date = parse(data, 'yyyy-MM-dd', new Date())
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function isUrgente(diasRestantes: number): boolean {
  return diasRestantes <= 3 && diasRestantes >= 0
}

export function getFeriadosNacionais(): Feriado[] {
  return [...feriadosNacionais2025]
}
