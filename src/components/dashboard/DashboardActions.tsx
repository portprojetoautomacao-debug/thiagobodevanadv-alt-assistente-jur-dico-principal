/**
 * Dashboard Quick Actions
 * Quick access buttons for common tasks
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, ChartPie, TrendUp } from '@phosphor-icons/react'
import type { ViewType } from '@/types'

interface DashboardActionsProps {
  onNavigate: (view: ViewType) => void
}

export function DashboardActions({ onNavigate }: DashboardActionsProps) {
  return (
    <Card className="bg-gradient-to-br from-neutral-2 to-neutral-3 border-neutral-6">
      <CardHeader>
        <CardTitle className="text-accent-11">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button
          onClick={() => onNavigate('upload-pdf')}
          className="w-full justify-start bg-accent-4 hover:bg-accent-5 text-accent-11"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload de PDF
        </Button>
        <Button
          onClick={() => onNavigate('analytics')}
          variant="outline"
          className="w-full justify-start border-neutral-6 hover:bg-neutral-4"
        >
          <ChartPie className="mr-2 h-4 w-4" />
          Analytics
        </Button>
        <Button
          onClick={() => onNavigate('agentes')}
          variant="outline"
          className="w-full justify-start border-neutral-6 hover:bg-neutral-4"
        >
          <TrendUp className="mr-2 h-4 w-4" />
          Agentes IA
        </Button>
      </CardContent>
    </Card>
  )
}
