import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { CheckCircle2, Save } from 'lucide-react'
import { formatBogota } from '@/lib/adminUtils'
import { cn } from '@/lib/utils'
import type { MatchResult } from '@/lib/database.types'

interface Match {
  id: string
  equipo_a: string
  equipo_b: string
  fecha_hora: string
  resultado: string | null
}

interface BatchResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matches: Match[]   // partidos pasados sin resultado
  pollaId: string
  jornadaNombre: string
}

const RESULT_LABELS: Record<MatchResult, string> = {
  A_wins: 'Gana A',
  draw:   'Empate',
  B_wins: 'Gana B',
}

const OPTIONS: MatchResult[] = ['A_wins', 'draw', 'B_wins']

export default function BatchResultsDialog({
  open,
  onOpenChange,
  matches,
  pollaId,
  jornadaNombre,
}: BatchResultsDialogProps) {
  const { toast } = useToast()
  const qc = useQueryClient()

  // Estado local: resultado seleccionado por partido
  const [pending, setPending] = useState<Record<string, MatchResult>>({})
  const [saving, setSaving] = useState(false)

  function toggle(matchId: string, result: MatchResult) {
    setPending(prev =>
      prev[matchId] === result
        ? { ...prev, [matchId]: result }  // no-deselect; selección fija al clic
        : { ...prev, [matchId]: result }
    )
  }

  const filled = Object.keys(pending).length
  const total  = matches.length

  async function handleSave() {
    const entries = Object.entries(pending)
    if (entries.length === 0) return
    if (!confirm(`¿Guardar ${entries.length} resultado(s) para ${jornadaNombre}?`)) return

    setSaving(true)
    let failed = 0

    for (const [matchId, resultado] of entries) {
      const { error } = await supabase
        .from('matches')
        .update({ resultado })
        .eq('id', matchId)
        .eq('polla_id', pollaId)
      if (error) failed++
    }

    setSaving(false)

    await qc.invalidateQueries({ queryKey: ['matches', pollaId] })

    if (failed > 0) {
      toast({ title: `${entries.length - failed} guardados, ${failed} con error`, variant: 'destructive' })
    } else {
      toast({ title: `${entries.length} resultado(s) guardados` })
      setPending({})
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setPending({}); onOpenChange(v) }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resultados — {jornadaNombre}</DialogTitle>
        </DialogHeader>

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay partidos pasados sin resultado en esta jornada.
          </p>
        ) : (
          <div className="space-y-3 mt-1">
            {matches.map(match => {
              const selected = pending[match.id]
              return (
                <div
                  key={match.id}
                  className={cn(
                    'rounded-xl border p-3 space-y-2 transition-colors',
                    selected ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border/60',
                  )}
                >
                  {/* Match header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {match.equipo_a}
                        <span className="text-muted-foreground/60 font-normal mx-1 text-xs">vs</span>
                        {match.equipo_b}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatBogota(match.fecha_hora)}</p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </div>

                  {/* Result buttons */}
                  <div className="flex gap-1.5">
                    {OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(match.id, opt)}
                        className={cn(
                          'flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors',
                          selected === opt
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'border-border/60 text-muted-foreground hover:border-emerald-400/60 hover:text-foreground',
                        )}
                      >
                        {opt === 'A_wins' ? match.equipo_a
                          : opt === 'B_wins' ? match.equipo_b
                          : RESULT_LABELS[opt]}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Save bar */}
            <div className="sticky bottom-0 pt-2 pb-1 bg-background">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={filled === 0 || saving}
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving
                  ? 'Guardando…'
                  : `Guardar ${filled > 0 ? `${filled} de ${total}` : 'resultados'}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
