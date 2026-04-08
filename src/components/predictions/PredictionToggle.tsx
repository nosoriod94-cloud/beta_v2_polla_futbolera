import { useState, useCallback } from 'react'
import { useUpsertPrediction } from '@/hooks/usePredictions'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pick } from '@/lib/database.types'

export interface PredictionToggleProps {
  matchId: string
  pollaId: string
  participantId: string
  currentPick: Pick | undefined
  resultado: Pick | null | undefined
  equipoA: string
  equipoB: string
  disabled: boolean
  puntosPorAcierto: number
}

const PICK_CONFIG = {
  A_wins: {
    activeBg: 'bg-emerald-500',
    activeBorder: 'border-emerald-400',
    activeShadow: 'shadow-emerald-500/40',
    inactiveBorder: 'border-border',
    hoverBorder: 'hover:border-emerald-500/60',
    hoverBg: 'hover:bg-emerald-500/8',
    glow: '0 0 20px hsl(142 76% 50% / 0.45)',
  },
  draw: {
    activeBg: 'bg-amber-500',
    activeBorder: 'border-amber-400',
    activeShadow: 'shadow-amber-500/40',
    inactiveBorder: 'border-border',
    hoverBorder: 'hover:border-amber-500/60',
    hoverBg: 'hover:bg-amber-500/8',
    glow: '0 0 20px hsl(38 92% 55% / 0.45)',
  },
  B_wins: {
    activeBg: 'bg-sky-500',
    activeBorder: 'border-sky-400',
    activeShadow: 'shadow-sky-500/40',
    inactiveBorder: 'border-border',
    hoverBorder: 'hover:border-sky-500/60',
    hoverBg: 'hover:bg-sky-500/8',
    glow: '0 0 20px hsl(199 89% 52% / 0.45)',
  },
} as const

export default function PredictionToggle({
  matchId, pollaId, participantId, currentPick, resultado,
  equipoA, equipoB, disabled, puntosPorAcierto,
}: PredictionToggleProps) {
  const upsert = useUpsertPrediction()
  const { toast } = useToast()
  const [justPicked, setJustPicked] = useState<Pick | null>(null)

  const pick = useCallback(async (p: Pick) => {
    if (disabled || upsert.isPending || currentPick === p) return
    setJustPicked(p)
    try {
      await upsert.mutateAsync({ pollaId, matchId, participantId, pick: p })
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    } finally {
      setTimeout(() => setJustPicked(null), 400)
    }
  }, [disabled, upsert, currentPick, pollaId, matchId, participantId, toast])

  const isCorrect = (p: Pick) => resultado && p === resultado
  const isWrong   = (p: Pick) => resultado && currentPick === p && p !== resultado

  const options: { value: Pick; label: string }[] = [
    { value: 'A_wins', label: equipoA },
    { value: 'draw',   label: 'Empate' },
    { value: 'B_wins', label: equipoB },
  ]

  return (
    <div className={cn('flex gap-2 mt-3', disabled && upsert.isPending && 'opacity-70')}>
      {options.map(opt => {
        const cfg      = PICK_CONFIG[opt.value]
        const isActive = currentPick === opt.value
        const isAnim   = justPicked === opt.value
        const correct  = isCorrect(opt.value)
        const wrong    = isWrong(opt.value)

        return (
          <div key={opt.value} className="flex-1 relative">
            {correct && isActive && (
              <span
                key="pts"
                className="animate-pts-float absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-display text-emerald-300 pointer-events-none whitespace-nowrap z-10"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px' }}
              >
                +{puntosPorAcierto} PTS
              </span>
            )}

            <button
              type="button"
              onClick={() => pick(opt.value)}
              disabled={disabled || upsert.isPending}
              className={cn(
                'w-full py-3 px-1 rounded-xl text-xs font-bold border-2 transition-all duration-200',
                'text-center cursor-pointer select-none relative overflow-hidden',
                isAnim && 'animate-pick-pop',
                isActive && !disabled && [cfg.activeBg, cfg.activeBorder, 'text-white shadow-lg', cfg.activeShadow],
                correct && isActive && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-background',
                wrong && 'opacity-50 saturate-50',
                !isActive && !disabled && [
                  'bg-muted/50', cfg.inactiveBorder, cfg.hoverBorder, cfg.hoverBg,
                  'text-muted-foreground hover:text-foreground',
                ],
                disabled && isActive && 'opacity-90',
                disabled && !isActive && 'opacity-40 cursor-not-allowed',
              )}
              style={isActive && !disabled ? { boxShadow: cfg.glow } : undefined}
            >
              {correct && isActive && (
                <CheckCircle2 className="absolute top-1 right-1 h-3 w-3 text-white/80" />
              )}
              <span className="block truncate leading-tight">{opt.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
