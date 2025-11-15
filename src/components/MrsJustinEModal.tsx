import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Sparkle, X } from '@phosphor-icons/react'

interface MrsJustinEModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onActivate?: () => void
}

export default function MrsJustinEModal({ open, onOpenChange, onActivate }: MrsJustinEModalProps) {
  const skills = [
    'Interpreta intimações',
    'Conta prazos',
    'Orienta Controller',
    'Sugere Tarefas',
    'Sistema D-1, D-2 ou D-n',
    'Prepara Atendimentos',
    'Cria Workflow de Controladoria',
    'Refaz Análise após nova informação'
  ]

  const handleActivate = () => {
    if (onActivate) {
      onActivate()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" weight="fill" />
              Mrs. Justin-e
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Quer impulsionar seu escritório?
            </h3>
            <p className="text-base font-medium text-foreground">
              Vamos juntos nessa!
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-foreground">
              Eu analiso intimações com <span className="font-bold text-primary">95%</span> de precisão em menos de 1 minuto,
            </p>
            <p className="text-sm text-foreground">
              enquanto humanos demoram 8 minutos e podem errar ou esquecer detalhes importantes.
            </p>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg border border-accent/30">
            <p className="text-sm text-foreground">
              Comigo, seu escritório economiza <span className="font-bold text-accent">50 horas</span> a cada 150 intimações.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">
              Minhas Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-sm py-1.5 px-3 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-base font-semibold text-foreground mb-3">
              Como utilizar a Justin-e
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Nas suas intimações, clique em <span className="font-semibold">"Ativar Justin-e"</span> para
                    receber um resumo da intimação e sugestões de tarefas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Dentre as opções apresentadas, selecione a tarefa que for mais pertinente ao caso.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Justin-e irá executar a tarefa e criar um workflow completo de controladoria.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Se necessário, forneça informações adicionais e Justin-e refará a análise automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" weight="fill" />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Benefícios Principais</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Análise 8x mais rápida que humanos</li>
                  <li>✓ 95% de precisão garantida</li>
                  <li>✓ Zero intimações esquecidas</li>
                  <li>✓ Workflow automatizado de controladoria</li>
                  <li>✓ Economia de 50 horas a cada 150 intimações</li>
                  <li>✓ Trabalha 24/7 sem pausas</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1" 
              size="lg"
              onClick={handleActivate}
            >
              <Brain className="w-5 h-5 mr-2" weight="fill" />
              Ativar Justin-e
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => onOpenChange(false)}
            >
              Depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
