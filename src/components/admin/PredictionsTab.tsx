import { useState, useMemo } from 'react'
import { usePredictions } from '@/hooks/usePredictions'
import { useParticipantsSafe } from '@/hooks/useParticipants'
import { useJornadas, useMatches } from '@/hooks/useMatches'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'
import type { Pick } from '@/lib/database.types'
import ExportPredictionsButton from './ExportPredictionsButton'

interface Props {
  pollaId: string
}

const pickColor: Record<Pick, string> = {
  A_wins: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  draw:   'bg-slate-500/15 text-slate-300 border-slate-500/25',
  B_wins: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
}

export default function PredictionsTab({ pollaId }: Props) {
  const { data: predictions = [], isLoading: loadingPred } = usePredictions(pollaId)
  const { data: participants = [], isLoading: loadingPart } = useParticipantsSafe(pollaId)
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId = selectedId ?? participants[0]?.id ?? null

  // Index: participantId → matchId → {pick, is_default}
  const predMap = useMemo(() => {
    const m: Record<string, Record<string, { pick: Pick; is_default: boolean }>> = {}
    for (const p of predictions) {
      const partId = p.participant_id
      if (!m[partId]) m[partId] = {}
      m[partId][p.match_id] = { pick: p.pick as Pick, is_default: p.is_default }
    }
    return m
  }, [predictions])

  // Count manual predictions per participant
  const predCounts = useMemo(() => {
    const out: Record<string, { manual: number; total: number }> = {}
    for (const part of participants) {
      const map = predMap[part.id] ?? {}
      out[part.id] = {
        total:  Object.keys(map).length,
        manual: Object.values(map).filter(p => !p.is_default).length,
      }
    }
    return out
  }, [participants, predMap])

  const activeMap = activeId ? (predMap[activeId] ?? {}) : {}
  const sortedJornadas = [...jornadas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  const isLoading = loadingPred || loadingPart

  if (isLoading) {
    return (
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Export button at top */}
      <ExportPredictionsButton pollaId={pollaId} />

      {participants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Users className="h-8 w-8 opacity-30" />
          <p className="text-sm">Sin participantes autorizados aún.</p>
        </div>
      ) : (
        <>
          {/* Participant selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Participante
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {participants.map(part => {
                const counts = predCounts[part.id]
                const isActive = part.id === activeId
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => setSelectedId(part.id)}
                    className={cn(
                      'shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary border-primary/60 text-primary-foreground'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    <span className="font-bold">{part.apodo}</span>
                    <span className={cn('text-[10px] mt-0.5', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60')}>
                      {counts?.manual ?? 0}/{matches.length} ingresadas
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Predictions for selected participant */}
          <div className="space-y-5">
            {sortedJornadas.map(jornada => {
              const jornadaMatches = matches
                .filter(m => m.jornada_id === jornada.id)
                .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
              if (jornadaMatches.length === 0) return null

              return (
                <div key={jornada.id}>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    {jornada.nombre}
                  </p>
                  <div className="space-y-2">
                    {jornadaMatches.map(match => {
                      const pred = activeMap[match.id]
                      const isLocked = new Date(match.fecha_hora) <= new Date(Date.now() + 60_000)

                      return (
                        <div
                          key={match.id}
                          className="bg-card border border-border/60 rounded-xl px-3 py-2.5 flex items-center gap-3"
                        >
                          {/* Teams + result */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">
                              {match.equipo_a}
                              <span className="text-muted-foreground mx-1.5 font-normal text-xs">vs</span>
                              {match.equipo_b}
                            </p>
                            {match.resultado && (
                              <p className="text-[10px] text-primary mt-0.5">
                                Resultado: {
                                  match.resultado === 'A_wins' ? `Ganó ${match.equipo_a}` :
                                  match.resultado === 'B_wins' ? `Ganó ${match.equipo_b}` :
                                  'Empate'
                                }
                              </p>
                            )}
                          </div>

                          {/* Pick badge */}
                          {pred ? (
                            <div className="shrink-0 flex flex-col items-end gap-0.5">
                              <span className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded-lg border',
                                pickColor[pred.pick],
                              )}>
                                {pred.pick === 'A_wins' ? match.equipo_a :
                                 pred.pick === 'B_wins' ? match.equipo_b :
                                 'Empate'}
                              </span>
                              {pred.is_default && !isLocked && (
                                <span className="text-[9px] text-muted-foreground/50">por defecto</span>
                              )}
                            </div>
                          ) : (
                            <span className="shrink-0 text-[11px] text-muted-foreground/40 italic">
                              Sin predicción
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {sortedJornadas.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Esta polla no tiene partidos configurados aún.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
