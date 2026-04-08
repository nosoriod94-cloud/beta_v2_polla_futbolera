import { Users, Clock, Lock, Star, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusCfg = {
  pending:    { label: 'Pendiente', icon: Clock, cls: 'bg-amber-500/12 text-amber-400 border-amber-500/25' },
  authorized: { label: 'Activo',    icon: Star,  cls: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' },
  blocked:    { label: 'Bloqueado', icon: Lock,  cls: 'bg-red-500/12 text-red-400 border-red-500/25' },
} as const

interface ParticipantPollaCardProps {
  pp: { polla_id: string; status: string; apodo: string }
  polla: { id: string; nombre: string }
  onClick: () => void
}

export default function ParticipantPollaCard({ pp, polla, onClick }: ParticipantPollaCardProps) {
  const cfg = statusCfg[pp.status as keyof typeof statusCfg] ?? statusCfg.pending
  const StatusIcon = cfg.icon
  const canClick = pp.status === 'authorized'

  return (
    <button
      type="button"
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={cn(
        'w-full text-left rounded-2xl border-2 px-4 py-3.5 flex items-center gap-3 transition-all duration-200 group animate-fade-up',
        canClick
          ? 'border-border/50 bg-card/60 hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
          : 'border-border/40 bg-card/40 opacity-75 cursor-default',
      )}
    >
      <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
        <Users className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm truncate block">{polla.nombre}</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 block">
          Apodo: <strong className="text-foreground/70">{pp.apodo}</strong>
        </span>
      </div>
      <span className={cn('shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5', cfg.cls)}>
        <StatusIcon className="h-2 w-2" />
        {cfg.label}
      </span>
      {canClick && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
      )}
    </button>
  )
}
