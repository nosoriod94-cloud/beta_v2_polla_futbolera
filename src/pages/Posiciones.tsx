import { useParams } from 'react-router-dom'
import { useStandings } from '@/hooks/useStandings'
import { useMyParticipant } from '@/hooks/useParticipants'
import { cn } from '@/lib/utils'
import { Star, TrendingUp, Target, Zap } from 'lucide-react'
import StandingsSkeleton from '@/components/skeletons/StandingsSkeleton'

/* ─── Podium config ────────────────────────────────────────────────── */
const PODIUM = [
  {
    rank: 1,
    label: '1°',
    size: 'h-28',
    gradient: 'from-amber-400/25 via-yellow-300/10 to-transparent',
    border: 'border-amber-400/50',
    glow: '0 0 30px hsl(45 100% 60% / 0.3), 0 0 60px hsl(45 100% 60% / 0.1)',
    textColor: 'text-amber-300',
    ptColor: 'text-amber-200',
    crown: '👑',
    accent: 'hsl(45 100% 60%)',
  },
  {
    rank: 2,
    label: '2°',
    size: 'h-20',
    gradient: 'from-slate-400/20 via-slate-300/8 to-transparent',
    border: 'border-slate-400/40',
    glow: '0 0 20px hsl(220 15% 70% / 0.2)',
    textColor: 'text-slate-300',
    ptColor: 'text-slate-200',
    crown: '🥈',
    accent: 'hsl(220 15% 70%)',
  },
  {
    rank: 3,
    label: '3°',
    size: 'h-16',
    gradient: 'from-orange-400/20 via-amber-600/8 to-transparent',
    border: 'border-orange-500/40',
    glow: '0 0 20px hsl(25 80% 55% / 0.2)',
    textColor: 'text-orange-300',
    ptColor: 'text-orange-200',
    crown: '🥉',
    accent: 'hsl(25 80% 55%)',
  },
]

/* ─── Accuracy bar ─────────────────────────────────────────────────── */
function AccuracyBar({ aciertos, total, color }: { aciertos: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((aciertos / total) * 100) : 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 w-7 text-right">{pct}%</span>
    </div>
  )
}

/* ─── Points bar (relative to leader) ─────────────────────────────── */
function PointsBar({ pts, maxPts, color }: { pts: number; maxPts: number; color: string }) {
  const pct = maxPts > 0 ? Math.max(4, Math.round((pts / maxPts) * 100)) : 4
  return (
    <div className="h-1 rounded-full bg-muted/50 overflow-hidden mt-1">
      <div
        className="h-full rounded-full animate-bar-fill"
        style={{
          '--bar-width': `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}99)`,
          boxShadow: `0 0 8px ${color}50`,
        } as React.CSSProperties}
      />
    </div>
  )
}

/* ─── Podium card ──────────────────────────────────────────────────── */
function PodiumCard({
  row, cfg, isMe, maxPts, delay,
}: {
  row: ReturnType<typeof useStandings>['data'][0]
  cfg: typeof PODIUM[0]
  isMe: boolean
  maxPts: number
  delay: number
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border-2 p-4 overflow-hidden',
        'animate-podium-rise',
        cfg.border,
        isMe && 'ring-2 ring-sky-400 ring-offset-2 ring-offset-background',
      )}
      style={{
        background: `linear-gradient(160deg, ${cfg.gradient.replace('from-', '').split(' ')[0].replace('from-', '')} 0%, transparent 70%), hsl(224 22% 13%)`,
        boxShadow: isMe ? `${cfg.glow}, 0 0 0 2px hsl(199 89% 52% / 0.4)` : cfg.glow,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Crown/medal */}
      <div className="text-2xl mb-1 leading-none">{cfg.crown}</div>

      {/* Apodo */}
      <div className="flex items-center gap-1 mb-0.5">
        <span className={cn('font-bold text-sm truncate', cfg.textColor)}>{row.apodo}</span>
        {isMe && (
          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center gap-0.5">
            <Star className="h-2 w-2 fill-sky-400" /> Tú
          </span>
        )}
      </div>

      {/* Points */}
      <div className="flex items-baseline gap-1 mb-2">
        <span
          className={cn('font-display text-3xl leading-none', cfg.ptColor)}
          style={{ fontFamily: "'Bebas Neue', sans-serif", textShadow: `0 0 16px ${cfg.accent}80` }}
        >
          {row.puntos_totales}
        </span>
        <span className="text-xs text-muted-foreground">pts</span>
      </div>

      {/* Points bar */}
      <PointsBar pts={row.puntos_totales} maxPts={maxPts} color={cfg.accent} />

      {/* Stats */}
      <div className="flex items-center gap-2 mt-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Target className="h-2.5 w-2.5" />
          {row.aciertos}/{row.total_predicciones}
        </span>
      </div>
    </div>
  )
}

/* ─── Main component ───────────────────────────────────────────────── */
export default function Posiciones() {
  const { pollaId } = useParams<{ pollaId: string }>()
  const { data: standings = [], isLoading } = useStandings(pollaId)
  const { data: myParticipant } = useMyParticipant(pollaId)

  if (isLoading) return <StandingsSkeleton />

  const top3    = standings.slice(0, 3)
  const rest    = standings.slice(3)
  const maxPts  = standings[0]?.puntos_totales ?? 1
  const myIdx   = standings.findIndex(r => r.participant_id === myParticipant?.id)

  return (
    <div className="p-4 space-y-5 pb-24">

      {/* Header */}
      <div className="pt-4 flex items-center gap-3 animate-fade-up">
        <div>
          <h1
            className="leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.04em' }}
          >
            Tabla de posiciones
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Actualiza cada 30 s
          </p>
        </div>
        {myIdx >= 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Tu posición</p>
            <p className="font-display text-2xl text-sky-400 leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              #{myIdx + 1}
            </p>
          </div>
        )}
      </div>

      {standings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <p className="text-sm text-muted-foreground">Aún no hay puntos registrados.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Las posiciones aparecerán cuando cierren los partidos.</p>
        </div>
      ) : (
        <>
          {/* ── Podium top 3 ── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {top3.map((row, idx) => (
                <PodiumCard
                  key={row.participant_id}
                  row={row}
                  cfg={PODIUM[idx]}
                  isMe={row.participant_id === myParticipant?.id}
                  maxPts={maxPts}
                  delay={idx * 80}
                />
              ))}
            </div>
          )}

          {/* ── Rest of table ── */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {/* Section label */}
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Resto</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              {rest.map((row, idx) => {
                const rank  = idx + 4
                const isMe  = row.participant_id === myParticipant?.id
                const pct   = maxPts > 0 ? Math.max(4, Math.round((row.puntos_totales / maxPts) * 100)) : 4

                return (
                  <div
                    key={row.participant_id}
                    className={cn(
                      'rounded-xl border px-4 py-3 flex items-center gap-3 transition-all duration-200 animate-fade-up',
                      isMe
                        ? 'border-sky-400/50 bg-sky-500/8 shadow-sm shadow-sky-500/10'
                        : 'border-border/60 bg-card/50 hover:border-border',
                    )}
                    style={{ animationDelay: `${(idx + 3) * 50}ms` }}
                  >
                    {/* Rank */}
                    <span className="w-7 text-center text-sm font-bold text-muted-foreground/60 shrink-0">
                      #{rank}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{row.apodo}</span>
                        {isMe && (
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-400/25 flex items-center gap-0.5">
                            <Star className="h-2 w-2 fill-sky-400" /> Tú
                          </span>
                        )}
                      </div>
                      {/* Points bar */}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className="h-full rounded-full animate-bar-fill"
                            style={{
                              '--bar-width': `${pct}%`,
                              background: isMe ? 'hsl(199 89% 52%)' : 'hsl(154 100% 45% / 0.6)',
                            } as React.CSSProperties}
                          />
                        </div>
                        <AccuracyBar aciertos={row.aciertos} total={row.total_predicciones} color={isMe ? 'hsl(199 89% 52%)' : 'hsl(154 100% 45%)'} />
                      </div>
                    </div>

                    {/* Points */}
                    <div className="shrink-0 text-right">
                      <span
                        className={cn('leading-none', isMe ? 'text-sky-400' : 'text-primary')}
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.5rem', textShadow: isMe ? '0 0 12px hsl(199 89% 52% / 0.5)' : '0 0 12px hsl(154 100% 45% / 0.4)' }}
                      >
                        {row.puntos_totales}
                      </span>
                      <p className="text-[10px] text-muted-foreground/60">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── My position callout (if outside visible area) ── */}
          {myIdx > 6 && myParticipant && (() => {
            const me = standings[myIdx]
            return (
              <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40">
                <div className="rounded-xl border-2 border-sky-400/60 bg-background/95 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 shadow-lg shadow-sky-500/15">
                  <span className="text-xs font-bold text-sky-400">#{myIdx + 1}</span>
                  <span className="font-semibold text-sm flex-1 truncate">{me.apodo}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {me.aciertos}/{me.total_predicciones}
                  </span>
                  <span
                    className="text-sky-400 font-bold"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.2rem' }}
                  >
                    {me.puntos_totales} pts
                  </span>
                </div>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
