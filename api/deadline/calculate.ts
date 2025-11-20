/**
 * Cálculo Real de Prazos Processuais
 * Considera feriados nacionais, estaduais e recesso forense
 * 
 * Path: /api/deadline/calculate
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Feriados nacionais fixos
const feriadosNacionais2025 = [
  '2025-01-01', // Ano Novo
  '2025-04-18', // Sexta-feira Santa
  '2025-04-21', // Tiradentes
  '2025-05-01', // Dia do Trabalho
  '2025-06-19', // Corpus Christi
  '2025-09-07', // Independência
  '2025-10-12', // Nossa Senhora Aparecida
  '2025-11-02', // Finados
  '2025-11-15', // Proclamação da República
  '2025-11-20', // Consciência Negra
  '2025-12-25', // Natal
];

const feriadosDF2025 = [
  '2025-04-21', // Fundação de Brasília
  '2025-11-30', // Dia do Evangélico
];

// Recesso forense (CNJ Resolução 298/2019)
const recessoForense2025 = {
  start: '2025-12-20',
  end: '2026-01-06',
};

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Domingo ou Sábado
}

function isFeriado(date: Date, tribunalCode?: string): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  // Feriados nacionais
  if (feriadosNacionais2025.includes(dateStr)) {
    return true;
  }
  
  // Feriados específicos por tribunal
  if (tribunalCode?.includes('DF') || tribunalCode?.includes('TJDFT')) {
    if (feriadosDF2025.includes(dateStr)) {
      return true;
    }
  }
  
  return false;
}

function isRecessoForense(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return dateStr >= recessoForense2025.start && dateStr <= recessoForense2025.end;
}

function isDiaUtil(date: Date, tribunalCode?: string): boolean {
  if (isWeekend(date)) return false;
  if (isFeriado(date, tribunalCode)) return false;
  if (isRecessoForense(date)) return false;
  return true;
}

function calcularPrazo(
  startDate: Date,
  businessDays: number,
  tribunalCode?: string
): {
  deadline: string;
  businessDays: number;
  calendarDays: number;
  reasoning: string[];
  holidays: string[];
  alerts: Array<{ type: string; days: number; message: string }>;
} {
  const reasoning: string[] = [];
  const holidays: string[] = [];
  let currentDate = new Date(startDate);
  let daysAdded = 0;
  let calendarDays = 0;

  reasoning.push(`Data inicial: ${currentDate.toLocaleDateString('pt-BR')}`);
  reasoning.push(`Dias úteis a contar: ${businessDays}`);

  while (daysAdded < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    calendarDays++;

    if (isDiaUtil(currentDate, tribunalCode)) {
      daysAdded++;
    } else {
      const reason = isWeekend(currentDate)
        ? 'Final de semana'
        : isFeriado(currentDate, tribunalCode)
        ? 'Feriado'
        : 'Recesso forense';
      
      holidays.push(`${currentDate.toLocaleDateString('pt-BR')} - ${reason}`);
      reasoning.push(`Dia ${currentDate.toLocaleDateString('pt-BR')} desconsiderado (${reason})`);
    }
  }

  reasoning.push(`Total de dias corridos: ${calendarDays}`);
  reasoning.push(`Vencimento: ${currentDate.toLocaleDateString('pt-BR')}`);

  return {
    deadline: currentDate.toISOString(),
    businessDays,
    calendarDays,
    reasoning,
    holidays,
    alerts: [
      {
        type: 'warning',
        days: 3,
        message: 'Prazo se aproximando - verificar providências',
      },
      {
        type: 'critical',
        days: 1,
        message: 'URGENTE: Último dia para protocolo',
      },
    ],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      startDate,
      businessDays = 15,
      tribunalCode,
    } = req.body as {
      startDate: string;
      businessDays?: number;
      tribunalCode?: string;
    };

    if (!startDate) {
      return res.status(400).json({
        error: 'Missing required field: startDate',
      });
    }

    const start = new Date(startDate);
    
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        error: 'Invalid startDate format',
      });
    }

    const result = calcularPrazo(start, businessDays, tribunalCode);

    return res.status(200).json({
      ok: true,
      ...result,
      metadata: {
        tribunalCode: tribunalCode || 'Nacional',
        calculatedAt: new Date().toISOString(),
        recessoForense: isRecessoForense(new Date(result.deadline))
          ? 'Vencimento durante recesso forense'
          : null,
      },
    });

  } catch (error) {
    console.error('[Deadline Calculate API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
