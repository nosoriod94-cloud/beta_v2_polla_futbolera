import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useStandings } from '@/hooks/useStandings'
import { Trophy, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  pollaId: string
  pollaNombre: string
}

const MEDALS = ['🥇', '🥈', '🥉']

const RANK_COLORS = [
  'text-amber-300',
  'text-slate-300',
  'text-orange-300',
]

export default function PollaStandingsSheet({ open, onOpenChange, pollaId, pollaNombre }: Props) {
  const { data: standings = [], isLoading } = useStandings(pollaId)

  const maxPts = standings[0]?.puntos_totales ?? 1

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] flex flex-col p-0 bg-slate-950 border-slate-800"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-sm font-bold text-white">
              <Trophy className="h-4 w-4 text-amber-400" />
              Tabla de posiciones — {pollaNombre}
            </SheetTitle>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Zap className="h-3 w-3 text-emerald-500" />
              Tiempo real
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-slate-800/50 animate-pulse"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          ) : standings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
              <div className="text-4xl">🏆</div>
              <p className="text-sm">Aún no hay puntos registrados.</p>
              <p className="text-xs text-slate-600 text-center">
                Las posiciones aparecerán cuando se ingresen resultados de partidos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {standings.map((row, idx) => {
                const rank = idx + 1
                const isTop3 = rank <= 3
                const pct = maxPts > 0 ? Math.max(4, Math.round((row.puntos_totales / maxPts) * 100)) : 4
                const aciertoPct = row.total_predicciones > 0
                  ? Math.round((row.aciertos / row.total_predicciones) * 100)
                  : 0

                return (
                  <div
                    key={row.participant_id}
                    className={cn(
                      'rounded-xl border px-4 py-3 flex items-center gap-3',
                      isTop3
                        ? rank === 1
                          ? 'border-amber-500/40 bg-amber-500/8'
                          : rank === 2
                            ? 'border-slate-500/40 bg-slate-500/8'
                            : 'border-orange-500/40 bg-orange-500/8'
                        : 'border-slate-800 bg-slate-900',
                    )}
                  >
                    {/* Rank / Medal */}
                    <div className="w-8 shrink-0 text-center">
                      {isTop3 ? (
                        <span className="text-xl leading-none">{MEDALS[idx]}</span>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">#{rank}</span>
                      )}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-semibold text-sm truncate',
                        isTop3 ? RANK_COLORS[idx] : 'text-white',
                      )}>
                        {row.apodo}
                      </p>
                      {/* Points bar */}
                      <div className="mt-1.5 h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: rank === 1
                              ? 'hsl(45 100% 60%)'
                              : rank === 2
                                ? 'hsl(220 15% 70%)'
                                : rank === 3
                                  ? 'hsl(25 80% 55%)'
                                  : 'hsl(154 100% 45% / 0.6)',
                          }}
                        />
                      </div>
                      {/* Aciertos */}
                      <p className="text-[10px] text-slate-500 mt-1">
                        {row.aciertos}/{row.total_predicciones} aciertos · {aciertoPct}%
                      </p>
                    </div>

                    {/* Points */}
                    <div className="shrink-0 text-right">
                      <p className={cn(
                        'text-2xl font-bold leading-none',
                        rank === 1 ? 'text-amber-300' :
                        rank === 2 ? 'text-slate-300' :
                        rank === 3 ? 'text-orange-300' :
                        'text-emerald-400',
                      )}
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                      >
                        {row.puntos_totales}
                      </p>
                      <p className="text-[10px] text-slate-600">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
