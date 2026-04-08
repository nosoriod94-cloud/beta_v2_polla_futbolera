import { Shield, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminPollaCardProps {
  polla: { id: string; nombre: string; is_active: boolean; invite_code?: string | null }
  onClick: () => void
}

export default function AdminPollaCard({ polla, onClick }: AdminPollaCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl border-2 px-4 py-3.5 flex items-center gap-3 transition-all duration-200 group animate-fade-up',
        polla.is_active
          ? 'border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/8'
          : 'border-border/50 bg-card/60 hover:border-border',
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        polla.is_active ? 'bg-primary/15' : 'bg-muted/60',
      )}>
        <Shield className={cn('h-4 w-4', polla.is_active ? 'text-primary' : 'text-muted-foreground/50')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{polla.nombre}</span>
          {polla.is_active && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center gap-0.5">
              <Zap className="h-2 w-2" /> Activa
            </span>
          )}
        </div>
        {polla.invite_code && (
          <span className="text-[11px] text-muted-foreground font-mono mt-0.5 block">
            Código: <strong className="text-foreground/70">{polla.invite_code}</strong>
          </span>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
    </button>
  )
}
