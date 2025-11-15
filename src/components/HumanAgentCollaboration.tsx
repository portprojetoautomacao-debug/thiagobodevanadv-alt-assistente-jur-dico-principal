import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Pause,
  Play
} from '@phosphor-icons/react'

interface CollaborationDemoProps {
  agentName: string
  taskDescription: string
  onComplete?: () => void
}

export default function HumanAgentCollaboration({ agentName, taskDescription, onComplete }: CollaborationDemoProps) {
  const [phase, setPhase] = useState<'agent_working' | 'human_editing' | 'agent_waiting' | 'agent_resuming' | 'completed'>('agent_working')
  const [progress, setProgress] = useState(0)
  const [timeWithoutActivity, setTimeWithoutActivity] = useState(0)
  const [isHumanActive, setIsHumanActive] = useState(false)

  useEffect(() => {
    if (phase === 'agent_working') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setPhase('completed')
            onComplete?.()
            return 100
          }
          return prev + 2
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [phase, onComplete])

  useEffect(() => {
    if (phase === 'human_editing') {
      const interval = setInterval(() => {
        if (!isHumanActive) {
          setTimeWithoutActivity((prev) => {
            if (prev >= 5) {
              setPhase('agent_resuming')
              setTimeout(() => setPhase('agent_working'), 1000)
              return 0
            }
            return prev + 1
          })
        } else {
          setTimeWithoutActivity(0)
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [phase, isHumanActive])

  const handleHumanIntervention = () => {
    setPhase('human_editing')
    setIsHumanActive(true)
    setTimeout(() => setIsHumanActive(false), 3000)
  }

  const handleHumanFinish = () => {
    setPhase('agent_resuming')
    setTimeout(() => setPhase('agent_working'), 1000)
  }

  const getPhaseIcon = () => {
    switch (phase) {
      case 'agent_working':
        return <Robot className="w-6 h-6 text-primary animate-pulse" weight="fill" />
      case 'human_editing':
        return <User className="w-6 h-6 text-accent" weight="fill" />
      case 'agent_waiting':
        return <Pause className="w-6 h-6 text-muted-foreground" weight="fill" />
      case 'agent_resuming':
        return <Play className="w-6 h-6 text-green-600" weight="fill" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" weight="fill" />
    }
  }

  const getPhaseTitle = () => {
    switch (phase) {
      case 'agent_working':
        return 'Agente trabalhando autonomamente'
      case 'human_editing':
        return 'Humano editando documento'
      case 'agent_waiting':
        return 'Agente aguardando conclusão humana'
      case 'agent_resuming':
        return 'Retomando trabalho autônomo'
      case 'completed':
        return 'Tarefa concluída'
    }
  }

  const getPhaseDescription = () => {
    switch (phase) {
      case 'agent_working':
        return `${agentName} está processando ${taskDescription} sem intervenção humana`
      case 'human_editing':
        return `Você está editando o documento. O agente detectou a atividade humana e entrou em modo de espera.`
      case 'agent_waiting':
        return `Aguardando você terminar a edição. O agente retomará em ${5 - timeWithoutActivity}s sem atividade.`
      case 'agent_resuming':
        return `Nenhuma atividade detectada por 5 segundos. Retomando trabalho automático...`
      case 'completed':
        return `Tarefa finalizada com sucesso através da colaboração humano-agente`
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
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
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {phase === 'human_editing' && !isHumanActive && (
          <Alert>
            <Clock className="w-4 h-4" />
            <AlertDescription>
              Sem atividade detectada há {timeWithoutActivity}s. O agente retomará automaticamente em {5 - timeWithoutActivity}s.
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
            <Robot className={`w-8 h-8 mx-auto mb-2 ${
              phase === 'agent_working' || phase === 'agent_resuming' 
                ? 'text-primary animate-pulse' 
                : 'text-muted-foreground'
            }`} weight="fill" />
            <p className="text-xs font-medium">Agente de IA</p>
            <p className="text-xs text-muted-foreground">
              {phase === 'agent_working' || phase === 'agent_resuming' ? 'Trabalhando' : 'Aguardando'}
            </p>
          </div>
          <div className="text-center">
            <ArrowsLeftRight className="w-8 h-8 mx-auto mb-2 text-primary" weight="bold" />
            <p className="text-xs font-medium">Colaboração</p>
            <p className="text-xs text-muted-foreground">Handoff inteligente</p>
          </div>
          <div className="text-center">
            <User className={`w-8 h-8 mx-auto mb-2 ${
              phase === 'human_editing' 
                ? 'text-accent' 
                : 'text-muted-foreground'
            }`} weight="fill" />
            <p className="text-xs font-medium">Você</p>
            <p className="text-xs text-muted-foreground">
              {phase === 'human_editing' ? 'Editando' : 'Observando'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-start gap-2">
            <Sparkle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs text-muted-foreground">
              O agente detecta automaticamente quando você começa a editar e entra em modo de espera
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs text-muted-foreground">
              Após 5 segundos sem atividade humana, o agente retoma o trabalho automaticamente
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs text-muted-foreground">
              Seu trabalho é preservado e o agente continua de onde parou
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
