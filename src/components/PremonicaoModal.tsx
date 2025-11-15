import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Copy, Check, Lightbulb, X } from '@phosphor-icons/react'

interface PremonicaoModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  isLoading: boolean
  error: string | null
}

interface ProbabilityMeterProps {
  percentage: number
}

function ProbabilityMeter({ percentage }: ProbabilityMeterProps) {
  const radius = 70
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct >= 70) return 'oklch(0.65 0.18 145)'
    if (pct >= 40) return 'oklch(0.75 0.15 85)'
    return 'oklch(0.55 0.22 25)'
  }

  const getLabel = (pct: number) => {
    if (pct >= 70) return 'Alta Probabilidade'
    if (pct >= 40) return 'Média Probabilidade'
    return 'Baixa Probabilidade'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
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
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>
      <Badge
        className="px-4 py-1.5 text-sm font-medium"
        style={{ backgroundColor: getColor(percentage), color: 'white' }}
      >
        {getLabel(percentage)}
      </Badge>
    </div>
  )
}

interface CopyButtonProps {
  text: string
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8"
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
  data,
  isLoading,
  error,
}: PremonicaoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Lightbulb className="h-5 w-5 text-accent" weight="fill" />
            </div>
            <DialogTitle className="text-2xl font-semibold">
              Premonição Jurídica
            </DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground">Analisando processo...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <p className="text-destructive font-medium">Erro ao gerar premonição</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && data && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <ProbabilityMeter percentage={data.probabilidade || 0} />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Análise Geral</h3>
                  <p className="text-foreground/80">{data.analise || 'Nenhuma análise disponível.'}</p>
                </div>

                {data.fundamentacao && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Fundamentação</h3>
                    <p className="text-foreground/80">{data.fundamentacao}</p>
                  </div>
                )}

                {data.recomendacoes && data.recomendacoes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Recomendações</h3>
                    <ul className="list-disc list-inside space-y-2">
                      {data.recomendacoes.map((rec: string, idx: number) => (
                        <li key={idx} className="text-foreground/80">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
