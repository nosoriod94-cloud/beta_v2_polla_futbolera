import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

function getSecondsLeft(fechaHora: string): number {
  return Math.floor((new Date(fechaHora).getTime() - Date.now()) / 1000)
}

function formatCountdown(secs: number): string {
  if (secs <= 0) return 'Cerrado'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
  return `${s}s`
}

interface Props {
  fechaHora: string
}

export default function CountdownTimer({ fechaHora }: Props) {
  const [secs, setSecs] = useState(() => getSecondsLeft(fechaHora))

  useEffect(() => {
    // No arrancar el intervalo si ya cerró
    if (secs <= 0) return
    const id = setInterval(() => {
      setSecs(getSecondsLeft(fechaHora))
    }, 1000)
    return () => clearInterval(id)
  }, [fechaHora, secs <= 0])

  if (secs <= 0) return null

  const isRed    = secs < 5 * 60          // < 5 min
  const isAmber  = secs < 60 * 60         // < 1 h
  const isBlink  = secs < 60              // < 1 min → parpadeo

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums',
        isRed   ? 'text-red-400'   :
        isAmber ? 'text-amber-400' :
                  'text-primary',
        isBlink && 'animate-pulse',
      )}
    >
      <Clock className="h-2.5 w-2.5 shrink-0" />
      {formatCountdown(secs)}
    </span>
  )
}
