import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Check, LinkSimple, Sparkle, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import type { PremonicaoJuridica } from '@/types'

interface PremonicaoModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  data: PremonicaoJuridica | null
  error: string | null
}

interface ProbabilityMeterProps {
  percentage: number
}

function ProbabilityMeter({ percentage }: ProbabilityMeterProps) {
  const radius = 70
  const strokeWidth = 10
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct >= 75) return 'oklch(0.65 0.18 145)'
    if (pct >= 50) return 'oklch(0.75 0.15 85)'
    if (pct >= 25) return 'oklch(0.68 0.15 45)'
    return 'oklch(0.55 0.22 25)'
  }

  const getLabel = (pct: number) => {
    if (pct >= 75) return 'Alta Probabilidade'
    if (pct >= 50) return 'Probabilidade Moderada'
    if (pct >= 25) return 'Probabilidade Baixa'
    return 'Probabilidade Muito Baixa'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="oklch(0.88 0.005 260)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <motion.circle
            stroke={getColor(percentage)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'linear' }}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: getColor(percentage) }}>
            {percentage}%
          </span>
        </div>
      </div>
      <Badge
        variant="secondary"
        className="text-sm px-3 py-1"
        style={{ backgroundColor: getColor(percentage) + '20', color: getColor(percentage) }}
      >
        {getLabel(percentage)}
      </Badge>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado para a área de transferência')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}

export default function PremonicaoModal({
  isOpen,
  onClose,
  isLoading,
  data,
  error,
}: PremonicaoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Sparkle className="h-6 w-6 text-accent" weight="fill" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Premonição Jurídica</DialogTitle>
                {data && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Processo: {data.processo_cnj}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="px-6 py-6 space-y-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkle className="h-12 w-12 text-accent" weight="fill" />
                </motion.div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">A IA está analisando o processo...</p>
                  <p className="text-sm text-muted-foreground">
                    Isso pode levar alguns segundos
                  </p>
                </div>
              </div>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" weight="bold" />
                    <div>
                      <p className="font-medium text-destructive">Erro na Análise</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data && !isLoading && (
              <>
                <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                  <ProbabilityMeter percentage={data.probabilidade_exito} />
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Análise da IA</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {data.analise_ia}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Estratégias Recomendadas</h3>
                  <div className="space-y-2">
                    {data.estrategias_recomendadas.map((estrategia, index) => (
                      <Card key={index} className="hover:bg-accent/5 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-medium text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <p className="flex-1 text-sm leading-relaxed">{estrategia}</p>
                            <CopyButton text={estrategia} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Precedentes Relevantes</h3>
                  <div className="grid gap-4">
                    {data.precedentes_relevantes.map((precedente) => (
                      <Card key={precedente.id} className="border-l-4 border-l-muted-foreground/30">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {precedente.tribunal}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {precedente.numero}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground">
                                {precedente.tema}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <CopyButton text={`${precedente.id}: ${precedente.resumo_relevancia}`} />
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
                                  >
                                    <LinkSimple className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {precedente.resumo_relevancia}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
