import { useState } from 'react'
import { Card, CardContent } from '@/components
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, Lightbulb, X, ArrowSqua
import { toast } from 'sonner'
interface PremonicaoModalProps {
import { Copy, Check, Lightbulb, X, ArrowSquareOut, CaretRight } from '@phosphor-icons/react'
import type { PremonicaoJuridica, Precedente } from '@/types'

}
  isOpen: boolean
  percentage: number
  data: PremonicaoJuridica | null
function Probability
  error: string | null
 


  percentage: number
 

function ProbabilityMeter({ percentage }: ProbabilityMeterProps) {
  const radius = 70
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct >= 75) return 'oklch(0.65 0.18 145)'
    if (pct >= 50) return 'oklch(0.75 0.15 85)'
    if (pct >= 25) return 'oklch(0.68 0.15 45)'
    return 'oklch(0.55 0.22 25)'
   

  const getLabel = (pct: number) => {
    if (pct >= 75) return 'Alta Probabilidade'
    if (pct >= 50) return 'Probabilidade Moderada'
    if (pct >= 25) return 'Probabilidade Baixa'
    return 'Probabilidade Muito Baixa'
  }


    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="oklch(0.88 0.005 260)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
      variant="ghost"
            cy={radius}
    >
          <motion.circle
        <Copy className="h-4 w-4" />
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
}: PremonicaoModalProps) {
            cx={radius}
        <div className=
            initial={{ strokeDashoffset: circumference }}
                <Lightbulb className="h-6 
            transition={{ duration: 1, ease: 'linear' }}
                <p c
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground">
              <motion.div
          </span>
              
      </div>
            
                  </p>
        style={{ backgroundColor: getColor(percentage), color: 'white' }}
      >
        {getLabel(percentage)}
      </Badge>
    </div>
   
}

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

                        <CardConte
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado para a área de transferência')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
           
      variant="ghost"
                 
      className="h-8 w-8"
      onClick={handleCopy}
    >
                 
        <Check className="h-4 w-4 text-green-500" />
           
        <Copy className="h-4 w-4" />
        
    </Button>
   
}

export default function PremonicaoModal({
         
  onClose,
  data,
            
        
}: PremonicaoModalProps) {
          
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="sticky top-0 z-10 bg-card border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <Lightbulb className="h-6 w-6 text-accent-foreground" weight="fill" />

              <div>
                <DialogTitle className="text-xl font-semibold">Premonição Jurídica</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Análise inteligente de probabilidade de êxito
                </p>

            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Separator />


          <div className="p-6 space-y-6">

              <motion.div
                className="flex flex-col items-center justify-center py-12 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Analisando o processo...</p>
                  <p className="text-sm text-muted-foreground">
                    A IA está consultando jurisprudências e calculando probabilidades

                </div>
              </motion.div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <p className="text-destructive font-medium">Erro na Análise</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>

            )}

            {!isLoading && !error && data && (

                <div className="grid md:grid-cols-2 gap-6">
                  <ProbabilityMeter percentage={data.probabilidade_exito} />

                  <div className="flex flex-col justify-center">
                    <h3 className="font-semibold text-lg mb-2">Análise da IA</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {data.analise_ia}

                  </div>
                </div>




                  <h3 className="font-semibold text-lg">Estratégias Recomendadas</h3>
                  <div className="space-y-2">
                    {data.estrategias_recomendadas.map((estrategia, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <CaretRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{estrategia}</p>

                          <CopyButton text={estrategia} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Precedentes Relevantes</h3>
                  <div className="space-y-3">
                    {data.precedentes_relevantes.map((precedente: Precedente) => (
                      <Card key={precedente.id} className="border-l-4 border-l-muted">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{precedente.tribunal}</Badge>
                                <span className="text-sm font-medium">{precedente.numero}</span>

                              <p className="text-sm font-medium text-foreground">
                                {precedente.tema}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <CopyButton text={`${precedente.tribunal} - ${precedente.numero}: ${precedente.resumo_relevancia}`} />
                              {precedente.link && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                >
                                  <a
                                    href={precedente.link}
                                    target="_blank"
                                    rel="noopener noreferrer"

                                    <ArrowSquareOut className="h-4 w-4" />

                                </Button>

                            </div>

                          <p className="text-sm text-muted-foreground">

                          </p>

                      </Card>
                    ))}
                  </div>
                </div>
              </>

          </div>

      </DialogContent>

  )

