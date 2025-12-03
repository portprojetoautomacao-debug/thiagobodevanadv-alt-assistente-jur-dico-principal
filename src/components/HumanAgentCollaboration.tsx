import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Robot,
  User,
  ArrowsLeftRight,
  CheckCircle,
  Clock,
  Sparkle,
  PencilSimple,
  Brain,
  Play,
} from '@phosphor-icons/react'

interface CollaborationDemoProps {
  readonly agentName: string
  readonly taskDescription: string
  readonly onComplete?: () => void
}

type Phase = 'agent_working' | 'human_editing' | 'agent_resuming' | 'completed'

const INACTIVITY_LIMIT_SECONDS = 5
const PROGRESS_STEP = 1
const PROGRESS_INTERVAL_MS = 150
const RESUME_DELAY_MS = 1000

// ===== Helper Functions (extracted to reduce nesting - S2004 compliance) =====

/**
 * Calculates next progress value and determines if phase should change to completed
 */
function calculateNextProgress(
  current: number,
  step: number,
  max: number
): { next: number; isComplete: boolean } {
  const next = Math.min(current + step, max)
  return { next, isComplete: next >= max }
}

// Helper functions to reduce nesting (S2004 compliance)
function createProgressInterval(
  setProgress: (value: React.SetStateAction<number>) => void,
  onComplete: (() => void) | undefined
): () => void {
  let isCancelled = false

  const intervalId = globalThis.setInterval(() => {
    setProgress((prev) => {
      if (isCancelled) return prev

      const { next, isComplete } = calculateNextProgress(prev, PROGRESS_STEP, 100)

      if (isComplete) {
        onComplete?.()
      }

      return next
    })
  }, PROGRESS_INTERVAL_MS)

  return () => {
    isCancelled = true
    globalThis.clearInterval(intervalId)
  }
}

function createInactivityInterval(
  setTimeWithoutActivity: (value: React.SetStateAction<number>) => void,
  setPhase: (phase: Phase) => void,
  isHumanActive: boolean
): () => void {
  let isCancelled = false

  const intervalId = globalThis.setInterval(() => {
    if (isCancelled) return

    setTimeWithoutActivity((prev) => {
      // Early return for human activity
      if (isHumanActive) {
        return 0
      }

      const next = prev + 1

      // Check if agent should resume
      if (next >= INACTIVITY_LIMIT_SECONDS) {
        setPhase('agent_resuming')
        globalThis.setTimeout(() => {
          setPhase('agent_working')
        }, RESUME_DELAY_MS)
        return 0
      }

      return next
    })
  }, 1000)

  return () => {
    isCancelled = true
    globalThis.clearInterval(intervalId)
  }
}

export default function HumanAgentCollaboration({
  agentName,
  taskDescription,
  onComplete,
}: CollaborationDemoProps) {
  const [phase, setPhase] = useState<Phase>('agent_working')
  const [progress, setProgress] = useState(0)
  const [timeWithoutActivity, setTimeWithoutActivity] = useState(0)
  const [isHumanActive, setIsHumanActive] = useState(false)

  // Refs para controlar timers e evitar vazamentos de memória
  const humanActivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Progresso do agente quando está trabalhando
  useEffect(() => {
    if (phase !== 'agent_working') return

    return createProgressInterval(setProgress, onComplete)
  }, [phase, onComplete])

  // Reset de inatividade quando sai do modo edição humana
  const previousPhaseRef = useRef(phase)
  useEffect(() => {
    if (previousPhaseRef.current === 'human_editing' && phase !== 'human_editing') {
      setTimeWithoutActivity(0)
    }
    previousPhaseRef.current = phase
  }, [phase])

  // Timer de inatividade durante edição humana
  useEffect(() => {
    if (phase !== 'human_editing') {
      return // No cleanup needed when not in human_editing phase
    }

    // Reset timer when entering human_editing phase
    const resetTimer = () => {
      setTimeWithoutActivity(0)
    }
    
    // Schedule reset on next tick to avoid synchronous setState in effect
    const timeoutId = globalThis.setTimeout(resetTimer, 0)

    const cleanup = createInactivityInterval(setTimeWithoutActivity, setPhase, isHumanActive)
    
    return () => {
      globalThis.clearTimeout(timeoutId)
      cleanup()
    }
  }, [phase, isHumanActive])

  // Limpa timeout de atividade humana ao desmontar
  useEffect(() => {
    return () => {
      if (humanActivityTimeoutRef.current != null) {
        globalThis.clearTimeout(humanActivityTimeoutRef.current)
      }
    }
  }, [])

  const handleHumanIntervention = () => {
    if (phase === 'completed') return

    setPhase('human_editing')
    setIsHumanActive(true)
    setTimeWithoutActivity(0)

    // Simula uma janela de "atividade" humana por alguns segundos
    if (humanActivityTimeoutRef.current != null) {
      globalThis.clearTimeout(humanActivityTimeoutRef.current)
    }
    humanActivityTimeoutRef.current = globalThis.setTimeout(() => {
      setIsHumanActive(false)
    }, 3000)
  }

  const handleHumanFinish = () => {
    setIsHumanActive(false)
    setTimeWithoutActivity(0)
    setPhase('agent_resuming')

    const resumeId = globalThis.setTimeout(() => {
      setPhase('agent_working')
    }, RESUME_DELAY_MS)

    // Apenas por segurança – se o componente desmontar MUITO rápido
    humanActivityTimeoutRef.current = resumeId
  }

  const getPhaseIcon = () => {
    switch (phase) {
      case 'agent_working':
        return <Robot className="w-6 h-6 text-primary animate-pulse" weight="fill" />
      case 'human_editing':
        return <User className="w-6 h-6 text-accent" weight="fill" />
      case 'agent_resuming':
        return <Play className="w-6 h-6 text-green-600" weight="fill" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" weight="fill" />
      default:
        return <Robot className="w-6 h-6 text-primary" weight="fill" />
    }
  }

  const getPhaseTitle = () => {
    switch (phase) {
      case 'agent_working':
        return 'Agente trabalhando autonomamente'
      case 'human_editing':
        return 'Humano editando documento'
      case 'agent_resuming':
        return 'Retomando trabalho autônomo'
      case 'completed':
        return 'Tarefa concluída'
    }
  }

  const getPhaseDescription = () => {
    const safeAgentName = agentName || 'O agente'
    const safeTask = taskDescription || 'a tarefa atual'

    switch (phase) {
      case 'agent_working':
        return `${safeAgentName} está processando ${safeTask} sem intervenção humana.`
      case 'human_editing':
        return 'Você está editando o documento. O agente entrou em modo de espera colaborativa.'
      case 'agent_resuming':
        return 'Encerrada a atividade humana, o agente está retomando o trabalho automático...'
      case 'completed':
        return 'Tarefa finalizada com sucesso através da colaboração humano-agente.'
    }
  }

  const remainingSeconds = Math.max(INACTIVITY_LIMIT_SECONDS - timeWithoutActivity, 0)

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {getPhaseIcon()}
            <div>
              <CardTitle className="text-base">{getPhaseTitle()}</CardTitle>
              <CardDescription className="mt-1">{getPhaseDescription()}</CardDescription>
            </div>
          </div>
          {phase === 'agent_working' && (
            <Button variant="outline" size="sm" onClick={handleHumanIntervention}>
              <PencilSimple className="w-4 h-4 mr-2" />
              Intervir
            </Button>
          )}
          {phase === 'human_editing' && (
            <Button variant="default" size="sm" onClick={handleHumanFinish}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Concluir Edição
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} />
        </div>

        {phase === 'human_editing' && !isHumanActive && (
          <Alert>
            <Clock className="w-4 h-4" />
            <AlertDescription>
              Sem atividade detectada há {timeWithoutActivity}s. O agente retomará
              automaticamente em {remainingSeconds}s.
            </AlertDescription>
          </Alert>
        )}

        {phase === 'human_editing' && isHumanActive && (
          <Alert className="border-accent bg-accent/10">
            <Brain className="w-4 h-4 text-accent" />
            <AlertDescription>
              Atividade humana detectada. O agente está em modo de espera colaborativa.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <Robot
              className={`w-8 h-8 mx-auto mb-2 ${phase === 'agent_working' || phase === 'agent_resuming'
                ? 'text-primary animate-pulse'
                : 'text-muted-foreground'
                }`}
              weight="fill"
            />
            <p className="text-xs font-medium">Agente de IA</p>
            <p className="text-xs text-muted-foreground">
              {phase === 'agent_working' || phase === 'agent_resuming'
                ? 'Trabalhando'
                : 'Aguardando'}
            </p>
          </div>

          <div className="text-center">
            <ArrowsLeftRight className="w-8 h-8 mx-auto mb-2 text-primary" weight="bold" />
            <p className="text-xs font-medium">Colaboração</p>
            <p className="text-xs text-muted-foreground">Handoff inteligente</p>
          </div>

          <div className="text-center">
            <User
              className={`w-8 h-8 mx-auto mb-2 ${phase === 'human_editing' ? 'text-accent' : 'text-muted-foreground'
                }`}
              weight="fill"
            />
            <p className="text-xs font-medium">Você</p>
            <p className="text-xs text-muted-foreground">
              {phase === 'human_editing' ? 'Editando' : 'Observando'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-start gap-2">
            <Sparkle
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              weight="fill"
            />
            <p className="text-xs text-muted-foreground">
              O agente detecta automaticamente quando você começa a editar e entra em modo
              de espera colaborativa.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkle
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              weight="fill"
            />
            <p className="text-xs text-muted-foreground">
              Após {INACTIVITY_LIMIT_SECONDS}s sem atividade humana, o agente retoma o
              trabalho automaticamente.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkle
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              weight="fill"
            />
            <p className="text-xs text-muted-foreground">
              Seu trabalho é preservado e o agente continua de onde parou.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
