import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  House, 
  Briefcase, 
  Tray, 
  FileText, 
  MicrophoneStage, 
  Calculator, 
  Database, 
  CalendarDots, 
  CurrencyCircleDollar, 
  Books,
  SignOut
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface SidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  user: User
  onLogout: () => void
}

const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Meu Painel', icon: House },
  { id: 'processes', label: 'Acervo (CRM)', icon: Briefcase },
  { id: 'expedientes', label: 'Expedientes', icon: Tray },
  { id: 'batch', label: 'Análise em Lote', icon: FileText },
  { id: 'audio', label: 'Transcrição', icon: MicrophoneStage },
  { id: 'calculator', label: 'Calc. Prazos', icon: Calculator },
  { id: 'queries', label: 'Consultas', icon: Database },
  { id: 'calendar', label: 'Agenda', icon: CalendarDots },
  { id: 'financial', label: 'Financeiro', icon: CurrencyCircleDollar },
  { id: 'knowledge', label: 'Base Conhecimento', icon: Books },
]

export default function Sidebar({ currentView, onViewChange, user, onLogout }: SidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">PJe Assistente</h2>
        <p className="text-sm text-muted-foreground mt-1">Com IA Gemini</p>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                )}
                onClick={() => onViewChange(item.id)}
              >
                <Icon className="w-5 h-5 mr-3" weight={isActive ? 'fill' : 'regular'} />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Separator />
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onLogout}
        >
          <SignOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  )
}
