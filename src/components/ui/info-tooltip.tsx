import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from '@phosphor-icons/react'

interface InfoTooltipProps {
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function InfoTooltip({ content, side = 'top', className = '' }: InfoTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info size={16} className={`text-muted-foreground cursor-help inline-block ${className}`} />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface LabelWithTooltipProps {
  label: string
  tooltip: string
  required?: boolean
}

export function LabelWithTooltip({ label, tooltip, required = false }: LabelWithTooltipProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      <InfoTooltip content={tooltip} />
    </div>
  )
}
