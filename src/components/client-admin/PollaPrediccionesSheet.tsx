import { useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { usePredictions } from '@/hooks/usePredictions'
import { useParticipantsSafe } from '@/hooks/useParticipants'
import { useJornadas, useMatches } from '@/hooks/useMatches'
import { cn } from '@/lib/utils'
import { Users, Eye } from 'lucide-react'
import type { Pick } from '@/lib/database.types'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  pollaId: string
  pollaNombre: string
}

const pickLabel: Record<Pick, string> = {
  A_wins: 'Gana A',
  draw:   'Empate',
  B_wins: 'Gana B',
}

const pickColor: Record<Pick, string> = {
  A_wins: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  draw:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
  B_wins: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
}

export default function PollaPrediccionesSheet({ open, onOpenChange, pollaId, pollaNombre }: Props) {
  const { data: predictions = [] } = usePredictions(pollaId)
  const { data: participants = [] } = useParticipantsSafe(pollaId)
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null)

  // Set first participant when data arrives
  const firstParticipantId = participants[0]?.id ?? null
  const activeId = selectedParticipantId ?? firstParticipantId

  // Index predictions: participantId -> matchId -> prediction
  const predMap = useMemo(() => {
    const m: Record<string, Record<string, { pick: Pick; is_default: boolean }>> = {}
    for (const p of predictions) {
      const pid = (p.polla_participants as { apodo: string; user_id: string } | null)
      if (!pid) continue
      // We index by participant_id which comes from the prediction itself
      const partId = p.participant_id
      if (!m[partId]) m[partId] = {}
      m[partId][p.match_id] = { pick: p.pick as Pick, is_default: p.is_default }
    }
    return m
  }, [predictions])

  // Count how many predictions each participant has manually set
  const predCounts = useMemo(() => {
    const out: Record<string, { manual: number; total: number }> = {}
    for (const part of participants) {
      const map = predMap[part.id] ?? {}
      const total = Object.keys(map).length
      const manual = Object.values(map).filter(p => !p.is_default).length
      out[part.id] = { manual, total }
    }
    return out
  }, [participants, predMap])

  const activePart = participants.find(p => p.id === activeId)
  const activeMap = activeId ? (predMap[activeId] ?? {}) : {}

  const sortedJornadas = [...jornadas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] flex flex-col p-0 bg-slate-950 border-slate-800"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-slate-800 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold text-white">
            <Eye className="h-4 w-4 text-blue-400" />
            Predicciones — {pollaNombre}
          </SheetTitle>
        </SheetHeader>

        {participants.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Users className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sin participantes autorizados aún.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Participant selector */}
            <div className="px-4 py-3 border-b border-slate-800 shrink-0">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Participante</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {participants.map(part => {
                  const counts = predCounts[part.id]
                  const isActive = part.id === activeId
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => setSelectedParticipantId(part.id)}
                      className={cn(
                        'shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                        isActive
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500',
                      )}
                    >
                      <span className="font-bold">{part.apodo}</span>
                      <span className={cn('text-[10px] mt-0.5', isActive ? 'text-blue-200' : 'text-slate-500')}>
                        {counts?.manual ?? 0} ingresadas
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Predictions list for selected participant */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {activePart && sortedJornadas.map(jornada => {
                const jornadaMatches = matches
                  .filter(m => m.jornada_id === jornada.id)
                  .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
                if (jornadaMatches.length === 0) return null

                return (
                  <div key={jornada.id}>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                      {jornada.nombre}
                    </p>
                    <div className="space-y-2">
                      {jornadaMatches.map(match => {
                        const pred = activeMap[match.id]
                        const isLocked = new Date(match.fecha_hora) <= new Date(Date.now() + 60_000)

                        return (
                          <div
                            key={match.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 flex items-center gap-3"
                          >
                            {/* Teams */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white leading-tight truncate">
                                {match.equipo_a}
                                <span className="text-slate-500 mx-1.5 font-normal">vs</span>
                                {match.equipo_b}
                              </p>
                              {match.resultado && (
                                <p className="text-[10px] text-emerald-400 mt-0.5">
                                  Resultado: {match.resultado === 'A_wins' ? `Ganó ${match.equipo_a}` : match.resultado === 'B_wins' ? `Ganó ${match.equipo_b}` : 'Empate'}
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
                                  <span className="text-[9px] text-slate-500">por defecto</span>
                                )}
                              </div>
                            ) : (
                              <span className="shrink-0 text-[11px] text-slate-600 italic">
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
                <p className="text-center text-sm text-slate-500 py-8">
                  Esta polla no tiene partidos configurados aún.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
