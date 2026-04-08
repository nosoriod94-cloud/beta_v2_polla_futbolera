import { useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useJornadas, useMatches } from '@/hooks/useMatches'
import { useMyParticipant } from '@/hooks/useParticipants'
import { useMyPredictions, useUpsertPrediction } from '@/hooks/usePredictions'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { Lock, Clock, CheckCircle2, Zap, ChevronDown } from 'lucide-react'
import { format, isPast, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Pick } from '@/lib/database.types'
import { useState, useCallback } from 'react'

interface PredictionToggleProps {
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
    color: 'emerald',
    activeBg: 'bg-emerald-500',
    activeBorder: 'border-emerald-400',
    activeShadow: 'shadow-emerald-500/40',
    inactiveBorder: 'border-border',
    hoverBorder: 'hover:border-emerald-500/60',
    hoverBg: 'hover:bg-emerald-500/8',
    glow: '0 0 20px hsl(142 76% 50% / 0.45)',
    ring: 'hsl(142 76% 50%)',
  },
  draw: {
    color: 'amber',
    activeBg: 'bg-amber-500',
    activeBorder: 'border-amber-400',
    activeShadow: 'shadow-amber-500/40',
    inactiveBorder: 'border-border',
    hoverBorder: 'hover:border-amber-500/60',
    hoverBg: 'hover:bg-amber-500/8',
    glow: '0 0 20px hsl(38 92% 55% / 0.45)',
    ring: 'hsl(38 92% 55%)',
  },
  B_wins: {
    color: 'sky',
    activeBg: 'bg-sky-500',
    activeBorder: 'border-sky-400',
    activeShadow: 'shadow-sky-500/40',
    inactiveBorder: 'border-border',
    hoverBorder: 'hover:border-sky-500/60',
    hoverBg: 'hover:bg-sky-500/8',
    glow: '0 0 20px hsl(199 89% 52% / 0.45)',
    ring: 'hsl(199 89% 52%)',
  },
} as const

function PredictionToggle({
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
    { value: 'B_wins', label: equipoB  },
  ]

  return (
    <div className={cn('flex gap-2 mt-3', disabled && upsert.isPending && 'opacity-70')}>
      {options.map(opt => {
        const cfg     = PICK_CONFIG[opt.value]
        const isActive = currentPick === opt.value
        const isAnim   = justPicked === opt.value
        const correct  = isCorrect(opt.value)
        const wrong    = isWrong(opt.value)

        return (
          <div key={opt.value} className="flex-1 relative">
            {/* Floating "+X pts" on correct pick */}
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
                // Active state
                isActive && !disabled && [
                  cfg.activeBg, cfg.activeBorder,
                  'text-white shadow-lg', cfg.activeShadow,
                ],
                // Correct result
                correct && isActive && 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-background',
                // Wrong result
                wrong && 'opacity-50 saturate-50',
                // Inactive (not locked)
                !isActive && !disabled && [
                  'bg-muted/50', cfg.inactiveBorder, cfg.hoverBorder, cfg.hoverBg,
                  'text-muted-foreground hover:text-foreground',
                ],
                // Locked state
                disabled && isActive && 'opacity-90',
                disabled && !isActive && 'opacity-40 cursor-not-allowed',
              )}
              style={isActive && !disabled ? { boxShadow: cfg.glow } : undefined}
            >
              {/* Result icon overlay */}
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

export default function Predicciones() {
  const { pollaId } = useParams<{ pollaId: string }>()
  const { user } = useAuth()
  const { toast } = useToast()

  const { data: participant } = useMyParticipant(pollaId)
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)
  const { data: myPredictions = {} } = useMyPredictions(pollaId, participant?.id)

  // IDs que el usuario ha toggleado manualmente respecto a su estado natural.
  // Estado natural: colapsado si todos los partidos ya se jugaron, expandido si no.
  const [toggledJornadas, setToggledJornadas] = useState<Set<string>>(new Set())

  const toggleJornada = (jornadaId: string) => {
    setToggledJornadas(prev => {
      const next = new Set(prev)
      next.has(jornadaId) ? next.delete(jornadaId) : next.add(jornadaId)
      return next
    })
  }

  if (!participant) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No estás registrado en esta polla.</p>
      </div>
    )
  }

  // Defensa: verificar que el participante pertenece al usuario autenticado
  if (participant.user_id !== user?.id) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No tienes permisos para ver esta página.</p>
      </div>
    )
  }

  if (participant.status === 'pending') {
    return (
      <div className="p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center">
          <Clock className="h-8 w-8 text-amber-400" />
        </div>
        <h2 className="font-bold text-lg">Solicitud pendiente</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          El admin debe aprobar tu solicitud antes de que puedas hacer predicciones.
        </p>
      </div>
    )
  }

  if (participant.status === 'blocked') {
    return (
      <div className="p-8 text-center text-destructive">
        <p className="font-semibold">Tu acceso a esta polla ha sido bloqueado.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="pt-4 flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            Mis predicciones
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Jugando como{' '}
            <span className="text-primary font-semibold" style={{ textShadow: '0 0 12px hsl(154 100% 45% / 0.4)' }}>
              {participant.apodo}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
          <Zap className="h-3 w-3 text-primary" />
          <span>Elige antes del cierre</span>
        </div>
      </div>

      {jornadas.length === 0 && (
        <Card className="border-dashed border-border">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            El admin no ha creado partidos todavía.
          </CardContent>
        </Card>
      )}

      {jornadas.map((jornada, jIdx) => {
        const jornadaMatches = matches.filter(m => m.jornada_id === jornada.id)
        const unlocked = jornadaMatches.filter(m => m.is_unlocked)
        if (unlocked.length === 0) return null

        // Estado natural: colapsado si todos los partidos ya se jugaron
        const allPast = unlocked.every(m => isPast(addMinutes(new Date(m.fecha_hora), -1)))
        const toggled = toggledJornadas.has(jornada.id)
        const isCollapsed = toggled ? !allPast : allPast

        const pendingPicks = unlocked.filter(m => {
          const isLocked = isPast(addMinutes(new Date(m.fecha_hora), -1))
          return !isLocked && !myPredictions[m.id]?.pick
        }).length

        return (
          <section key={jornada.id} className="space-y-3">
            {/* Jornada header — clickable para colapsar */}
            <button
              type="button"
              onClick={() => toggleJornada(jornada.id)}
              className="w-full flex items-center gap-2.5 px-1 group"
              style={{ animationDelay: `${jIdx * 60}ms` }}
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/60" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 group-hover:text-foreground transition-colors">
                {jornada.nombre}
              </h2>
              {pendingPicks > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  {pendingPicks} sin predecir
                </span>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {jornada.puntos_por_acierto} pts
              </span>
              <ChevronDown className={cn(
                'h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 shrink-0',
                isCollapsed && '-rotate-90'
              )} />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/60" />
            </button>

            {!isCollapsed && unlocked.map((match, mIdx) => {
              const kickoff  = new Date(match.fecha_hora)
              const cutoff   = addMinutes(kickoff, -1)
              const isLocked = isPast(cutoff)
              const myPick   = myPredictions[match.id]?.pick
              const isCorrect = myPick && match.resultado && myPick === match.resultado
              const isDefault = myPredictions[match.id]?.is_default

              return (
                <Card
                  key={match.id}
                  className={cn(
                    'border overflow-hidden transition-all duration-300 animate-fade-up',
                    isLocked
                      ? 'border-border/50'
                      : 'border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                    isCorrect && 'border-emerald-500/40 shadow-md shadow-emerald-500/10',
                  )}
                  style={{ animationDelay: `${(jIdx * 100) + (mIdx * 60)}ms` }}
                >
                  {/* Top accent stripe */}
                  <div className={cn(
                    'h-[3px]',
                    isLocked
                      ? 'bg-muted'
                      : isCorrect
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : 'bg-gradient-to-r from-primary via-secondary to-primary/60'
                  )} />

                  <CardContent className="py-3 px-4 space-y-3">
                    {/* Teams row */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Teams display */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-sm font-bold truncate">{match.equipo_a}</span>
                        <span className="text-[10px] font-bold text-muted-foreground/60 shrink-0 uppercase tracking-wider">vs</span>
                        <span className="text-sm font-bold truncate">{match.equipo_b}</span>
                      </div>

                      {/* Status badge */}
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-full shrink-0 border border-border/50">
                          <Lock className="h-2.5 w-2.5" /> Cerrado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold shrink-0 px-2 py-1 rounded-full border"
                          style={{ color: 'hsl(154 100% 45%)', background: 'hsl(154 100% 45% / 0.1)', borderColor: 'hsl(154 100% 45% / 0.3)', textShadow: '0 0 8px hsl(154 100% 45% / 0.4)' }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                          ABIERTO
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <p className="text-xs text-muted-foreground/70">
                      {format(kickoff, "d MMM · HH:mm", { locale: es })}
                      {match.estadio && <span className="ml-1.5 opacity-60">· {match.estadio}</span>}
                    </p>

                    {/* Prediction buttons */}
                    <PredictionToggle
                      matchId={match.id}
                      pollaId={pollaId!}
                      participantId={participant.id}
                      currentPick={myPick}
                      resultado={match.resultado}
                      equipoA={match.equipo_a}
                      equipoB={match.equipo_b}
                      disabled={isLocked}
                      puntosPorAcierto={jornada.puntos_por_acierto}
                    />

                    {/* Warnings */}
                    {isLocked && !myPick && (
                      <p className="text-xs text-amber-400/80 bg-amber-500/8 border border-amber-500/15 rounded-lg px-2.5 py-1.5">
                        Sin predicción — Empate asignado por defecto.
                      </p>
                    )}
                    {myPick && isDefault && !isLocked && (
                      <p className="text-xs text-amber-400/70">Empate asignado automáticamente.</p>
                    )}

                    {/* Result row */}
                    {match.resultado && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">Resultado final:</span>
                        <span className="text-xs font-bold text-foreground">
                          {match.resultado === 'A_wins' ? match.equipo_a :
                           match.resultado === 'B_wins' ? match.equipo_b : 'Empate'}
                        </span>
                        {myPick && (
                          <span className={cn(
                            'ml-auto flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border',
                            myPick === match.resultado
                              ? 'text-emerald-400 bg-emerald-500/12 border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                              : 'text-muted-foreground/60 bg-muted/40 border-border/40'
                          )}>
                            {myPick === match.resultado
                              ? <><CheckCircle2 className="h-3 w-3" /> +{jornada.puntos_por_acierto} pts</>
                              : '0 pts'}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
