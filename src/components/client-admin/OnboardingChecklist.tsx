import { CheckCircle2, Circle, Globe, Share2, UserCheck, Zap, Shield, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MyLicense } from '@/hooks/usePollas'

interface OnboardingChecklistProps {
  license: MyLicense
  onCreatePolla: () => void
}

interface Step {
  id: string
  label: string
  description: string
  icon: React.ElementType
  done: boolean
  action?: { label: string; onClick: () => void }
}

export default function OnboardingChecklist({ license, onCreatePolla }: OnboardingChecklistProps) {
  const steps: Step[] = [
    {
      id: 'license',
      label: 'Licencia activa',
      description: 'Tu acceso a la plataforma está confirmado.',
      icon: Shield,
      done: license.is_active,
    },
    {
      id: 'name',
      label: 'Nombre de licencia personalizado',
      description: 'Identifica fácilmente tu cuenta en el panel.',
      icon: Tag,
      done: !!license.nombre_licencia,
    },
    {
      id: 'polla',
      label: 'Crear tu primera polla',
      description: 'Dale un nombre a tu grupo: familia, trabajo, amigos…',
      icon: Zap,
      done: false,
      action: { label: 'Crear ahora', onClick: onCreatePolla },
    },
    {
      id: 'matches',
      label: 'Cargar los partidos',
      description: 'Usa "Cargar Mundial 2026" o importa tus propios partidos.',
      icon: Globe,
      done: false,
    },
    {
      id: 'invite',
      label: 'Compartir el código de invitación',
      description: 'Los participantes lo usan para unirse a tu polla.',
      icon: Share2,
      done: false,
    },
    {
      id: 'approve',
      label: 'Aprobar participantes',
      description: 'Autoriza a quienes quieras en el panel → Participantes.',
      icon: UserCheck,
      done: false,
    },
    {
      id: 'active',
      label: '¡Polla activa y prediciendo!',
      description: 'Los partidos abiertos ya permiten predicciones.',
      icon: Zap,
      done: false,
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  // Primera tarea pendiente
  const nextStep = steps.find(s => !s.done)

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
      {/* Header + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-400">Guía de inicio</span>
          <span className="text-muted-foreground">{doneCount}/{steps.length} completados</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            }}
          />
        </div>
      </div>

      {/* Steps list */}
      <ol className="space-y-2.5">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isNext = step.id === nextStep?.id
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                step.done
                  ? 'opacity-60'
                  : isNext
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'opacity-50',
              )}
            >
              {/* Icon/checkmark */}
              <div className="shrink-0 mt-0.5">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <div className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold',
                    isNext ? 'border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-600',
                  )}>
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    'text-xs font-semibold',
                    step.done ? 'line-through text-muted-foreground' : isNext ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                    {step.label}
                  </span>
                  {isNext && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                      Siguiente
                    </span>
                  )}
                </div>
                {!step.done && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                )}
                {step.action && !step.done && (
                  <Button
                    size="sm"
                    className="mt-2 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={step.action.onClick}
                  >
                    {step.action.label}
                  </Button>
                )}
              </div>

              {/* Step icon (decorative) */}
              {!step.done && (
                <Icon className={cn(
                  'h-4 w-4 shrink-0 mt-0.5',
                  isNext ? 'text-emerald-400' : 'text-slate-600',
                )} />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
