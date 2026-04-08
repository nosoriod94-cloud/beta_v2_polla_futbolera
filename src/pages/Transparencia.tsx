import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useJornadas, useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { useParticipantsSafe } from '@/hooks/useParticipants'
import { EmptyState } from '@/components/EmptyState'
import { cn } from '@/lib/utils'
import { Eye, Lock, CheckCircle2, XCircle, Minus, Zap, ChevronDown } from 'lucide-react'
import { isPast, addMinutes, format } from 'date-fns'
import { es } from 'date-fns/locale'

const pickLabels: Record<string, string> = {
  A_wins: 'A',
  draw:   '=',
  B_wins: 'B',
}

const pickLong: Record<string, (a: string, b: string) => string> = {
  A_wins: (a) => a,
  draw:   () => 'Empate',
  B_wins: (_, b) => b,
}

/* ── Pick chip ──────────────────────────────────────────────────────── */
function PickChip({
  pick,
  resultado,
  isDefault,
}: {
  pick: string | undefined
  resultado: string | null | undefined
  isDefault: boolean
}) {
  if (!pick) {
    return <span className="text-muted-foreground/30 text-xs">—</span>
  }

  const isCorrect = resultado && pick === resultado
  const isWrong   = resultado && pick !== resultado

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold border',
        isCorrect && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        isWrong   && 'bg-red-500/12 text-red-400/80 border-red-500/20 opacity-60',
        !resultado && 'bg-sky-500/12 text-sky-400 border-sky-500/20',
        isDefault && 'opacity-60',
      )}
      title={isDefault ? 'Predicción por defecto' : undefined}
    >
      {pickLabels[pick] ?? pick}
    </span>
  )
}

/* ── Match transparency card ─────────────────────────────────────────── */
function MatchCard({
  match,
  participants,
  matchPreds,
}: {
  match: {
    id: string
    equipo_a: string
    equipo_b: string
    fecha_hora: string
    resultado: string | null
  }
  participants: { id: string; apodo: string }[]
  matchPreds: Record<string, { pick: string; is_default: boolean }>
}) {
  const hits   = Object.values(matchPreds).filter(p => match.resultado && p.pick === match.resultado).length
  const total  = participants.length

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden animate-fade-up">
      {/* Top stripe */}
      <div className="h-[3px] bg-gradient-to-r from-purple-500/60 via-sky-500/40 to-transparent" />

      {/* Match header */}
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm">
            {match.equipo_a}
            <span className="text-muted-foreground/60 font-normal mx-1.5 text-xs">vs</span>
            {match.equipo_b}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {format(new Date(match.fecha_hora), "d MMM yyyy · HH:mm", { locale: es })}
          </p>
          {match.resultado && (
            <p className="text-xs font-bold mt-1" style={{ color: 'hsl(154 100% 45%)' }}>
              Resultado: {pickLong[match.resultado]?.(match.equipo_a, match.equipo_b) ?? match.resultado}
              {total > 0 && (
                <span className="ml-2 font-normal text-muted-foreground">
                  · {hits}/{total} acertaron
                </span>
              )}
            </p>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 shrink-0 pt-0.5">
          <Lock className="h-3 w-3" /> Cerrado
        </span>
      </div>

      {/* ── Desktop: table (≥640px) ── */}
      <div className="hidden sm:block px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-1.5 pr-3 font-medium text-muted-foreground/60">Participante</th>
                <th className="text-center py-1.5 px-2 font-medium text-muted-foreground/60">{match.equipo_a}</th>
                <th className="text-center py-1.5 px-2 font-medium text-muted-foreground/60">Emp</th>
                <th className="text-center py-1.5 px-2 font-medium text-muted-foreground/60">{match.equipo_b}</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(p => {
                const pred = matchPreds[p.id]
                const pick = pred?.pick
                const isDefault = pred?.is_default ?? false

                return (
                  <tr key={p.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2 pr-3 font-medium text-sm truncate max-w-[120px]">
                      {p.apodo}
                      {isDefault && <span className="text-amber-400/60 ml-1 text-[9px] font-normal">(def)</span>}
                    </td>
                    {(['A_wins', 'draw', 'B_wins'] as const).map(option => (
                      <td key={option} className="text-center px-2 py-1.5">
                        {pick === option ? (
                          <PickChip pick={pick} resultado={match.resultado} isDefault={isDefault} />
                        ) : (
                          <span className="inline-block w-7 h-7 text-center text-muted-foreground/20 text-lg leading-7">·</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile: card list (<640px) ── */}
      <div className="sm:hidden px-3 pb-3 space-y-1.5">
        {participants.map(p => {
          const pred      = matchPreds[p.id]
          const pick      = pred?.pick
          const isDefault = pred?.is_default ?? false
          const isCorrect = pick && match.resultado && pick === match.resultado
          const isWrong   = pick && match.resultado && pick !== match.resultado

          return (
            <div
              key={p.id}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2 border',
                isCorrect && 'bg-emerald-500/8 border-emerald-500/20',
                isWrong   && 'bg-muted/20 border-border/30',
                !match.resultado && pick && 'bg-sky-500/6 border-sky-500/15',
                !pick && 'bg-muted/10 border-border/20',
              )}
            >
              {/* Result icon */}
              <div className="shrink-0">
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isWrong ? (
                  <XCircle className="h-4 w-4 text-red-400/60" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground/30" />
                )}
              </div>

              {/* Name */}
              <span className="flex-1 text-sm font-medium truncate">
                {p.apodo}
                {isDefault && <span className="text-amber-400/60 ml-1 text-[9px] font-normal">(def)</span>}
              </span>

              {/* Pick badge */}
              {pick ? (
                <span className={cn(
                  'shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-lg border',
                  isCorrect && 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
                  isWrong   && 'bg-muted/40 text-muted-foreground/60 border-border/30 line-through',
                  !match.resultado && 'bg-sky-500/12 text-sky-400 border-sky-500/20',
                )}>
                  {pickLong[pick]?.(match.equipo_a, match.equipo_b) ?? pick}
                </span>
              ) : (
                <span className="shrink-0 text-[11px] text-muted-foreground/40 px-2">—</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function Transparencia() {
  const { pollaId } = useParams<{ pollaId: string }>()
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)
  const { data: participants = [] } = useParticipantsSafe(pollaId)

  // Jornadas que tienen al menos un partido cerrado
  const jornadasConCerrados = useMemo(
    () => jornadas.filter(j =>
      matches
        .filter(m => m.jornada_id === j.id)
        .some(m => isPast(addMinutes(new Date(m.fecha_hora), -1)))
    ),
    [jornadas, matches],
  )

  // Estado: jornada seleccionada (por defecto la primera con partidos cerrados)
  const [selectedJornadaId, setSelectedJornadaId] = useState<string | null>(null)
  const activeJornada = jornadasConCerrados.find(j => j.id === selectedJornadaId)
    ?? jornadasConCerrados[0]
    ?? null

  // Cargar predicciones solo de la jornada activa (evita traer todas las filas)
  const { data: predictions = [] } = usePredictions(pollaId, activeJornada?.id)

  // Build prediction lookup: matchId → participantId → { pick, is_default }
  const predMap = useMemo(() => {
    const map: Record<string, Record<string, { pick: string; is_default: boolean }>> = {}
    for (const pred of predictions) {
      if (!pred.matches) continue // filtrado por jornada — matches puede ser null
      if (!map[pred.match_id]) map[pred.match_id] = {}
      map[pred.match_id][pred.participant_id] = { pick: pred.pick, is_default: pred.is_default }
    }
    return map
  }, [predictions])

  const closedMatchesInJornada = activeJornada
    ? matches
        .filter(m => m.jornada_id === activeJornada.id)
        .filter(m => isPast(addMinutes(new Date(m.fecha_hora), -1)))
    : []

  return (
    <div className="p-4 space-y-6 pb-24">

      {/* Header */}
      <div className="pt-4 flex items-center gap-3 animate-fade-up">
        <div>
          <h1
            className="leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em' }}
          >
            Transparencia
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Eye className="h-3 w-3 text-purple-400" />
            Predicciones visibles al cierre del partido
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
          <Zap className="h-3 w-3 text-purple-400" />
          <span>En vivo</span>
        </div>
      </div>

      {jornadasConCerrados.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="Aún no hay partidos cerrados"
          description="Las predicciones aparecerán aquí cuando cada partido comience."
          size="lg"
        />
      ) : (
        <>
          {/* Selector de jornada */}
          {jornadasConCerrados.length > 1 && (
            <div className="relative">
              <select
                value={activeJornada?.id ?? ''}
                onChange={e => setSelectedJornadaId(e.target.value)}
                className="w-full appearance-none bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm font-medium pr-9 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {jornadasConCerrados.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Partidos de la jornada seleccionada */}
          {activeJornada && (
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/60" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                  {activeJornada.nombre}
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {activeJornada.puntos_por_acierto} pts
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/60" />
              </div>

              {closedMatchesInJornada.length === 0 ? (
                <EmptyState
                  icon={Lock}
                  title="Sin partidos cerrados en esta jornada"
                  description="Selecciona otra jornada."
                />
              ) : (
                closedMatchesInJornada.map((match, mIdx) => (
                  <div key={match.id} style={{ animationDelay: `${mIdx * 60}ms` }}>
                    <MatchCard
                      match={match}
                      participants={participants}
                      matchPreds={predMap[match.id] ?? {}}
                    />
                  </div>
                ))
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
