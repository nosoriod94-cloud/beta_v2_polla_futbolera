import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMyPollas, useCreatePolla, useMyParticipatingPollas, usePollaByInviteCode, useLicense } from '@/hooks/usePollas'
import { useJoinPolla, useApodoAvailable } from '@/hooks/useParticipants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { EmptyState } from '@/components/EmptyState'
import { Plus, Shield, Users, Clock, Lock, AlertTriangle, ChevronRight, Zap, Star, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'

/* ─── Skeleton ──────────────────────────────────────────────────────── */
function PollaCardSkeleton() {
  return (
    <div className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
  )
}

/* ─── Polla Card (admin) ─────────────────────────────────────────────── */
function AdminPollaCard({ polla, onClick }: { polla: { id: string; nombre: string; is_active: boolean; invite_code?: string | null }; onClick: () => void }) {
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

/* ─── Polla Card (participant) ───────────────────────────────────────── */
const statusCfg = {
  pending:    { label: 'Pendiente', icon: Clock,   cls: 'bg-amber-500/12 text-amber-400 border-amber-500/25' },
  authorized: { label: 'Activo',    icon: Star,    cls: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' },
  blocked:    { label: 'Bloqueado', icon: Lock,    cls: 'bg-red-500/12 text-red-400 border-red-500/25' },
} as const

function ParticipantPollaCard({
  pp,
  polla,
  onClick,
}: {
  pp: { polla_id: string; status: string; apodo: string }
  polla: { id: string; nombre: string }
  onClick: () => void
}) {
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

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: adminPollas = [], isLoading: loadingAdmin } = useMyPollas()
  const { data: participatingPollas = [], isLoading: loadingPart } = useMyParticipatingPollas()
  const { data: license } = useLicense()
  const createPolla = useCreatePolla()
  const joinPolla = useJoinPolla()

  const [newPollaName, setNewPollaName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinApodo, setJoinApodo] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)

  const { data: pollaEncontrada } = usePollaByInviteCode(joinCode)
  const { data: apodoDisponible, isLoading: checkingApodo } = useApodoAvailable(pollaEncontrada?.id, joinApodo)

  async function handleCreatePolla(e: React.FormEvent) {
    e.preventDefault()
    if (!newPollaName.trim() || !license?.id) return
    try {
      const polla = await createPolla.mutateAsync({ nombre: newPollaName.trim(), licenseId: license.id })
      toast({ title: 'Polla creada', description: `"${polla.nombre}" está lista para configurar.` })
      setCreateOpen(false)
      setNewPollaName('')
      navigate(`/admin/${polla.id}`)
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function handleJoinPolla(e: React.FormEvent) {
    e.preventDefault()
    if (!pollaEncontrada || !joinApodo.trim()) return
    try {
      await joinPolla.mutateAsync({ inviteCode: joinCode.trim(), apodo: joinApodo.trim() })
      toast({ title: 'Solicitud enviada', description: 'El admin debe aprobarte para participar.' })
      setJoinOpen(false)
      setJoinCode('')
      setJoinApodo('')
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  const isSuspended = license !== undefined && license !== null && !license.isActive

  return (
    <div className="p-4 space-y-6 pb-24">

      {/* Header */}
      <div className="pt-4 flex items-center justify-between animate-fade-up">
        <Logo size="md" variant="full" />
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-xl hover:bg-muted/60"
        >
          <LogOut className="h-3.5 w-3.5" />
          Salir
        </button>
      </div>

      {/* Suspended banner */}
      {isSuspended && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 animate-fade-up">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Cuenta suspendida</p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Contacta a <strong>hola@pollafutbolera.online</strong> para resolver la situación.
            </p>
          </div>
        </div>
      )}

      {/* ── Mis pollas (admin) ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Mis pollas (admin)
            </h2>
            {license && (
              <p className="text-xs text-muted-foreground/50 mt-0.5">
                {license.pollasCreated} de {license.pollasLimit} pollas usadas
              </p>
            )}
          </div>

          {license?.canCreate && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Nueva
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva polla</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreatePolla} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Nombre de la polla</Label>
                    <Input
                      placeholder="Polla del trabajo, familia Osorio..."
                      value={newPollaName}
                      onChange={e => setNewPollaName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createPolla.isPending}>
                    {createPolla.isPending ? 'Creando...' : 'Crear polla'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loadingAdmin ? (
          <div className="space-y-2">
            <PollaCardSkeleton />
            <PollaCardSkeleton />
          </div>
        ) : adminPollas.length === 0 ? (
          <EmptyState
            icon={isSuspended ? AlertTriangle : license?.canCreate ? Shield : Lock}
            title={
              isSuspended ? 'Cuenta suspendida' :
              license?.canCreate ? 'Sin pollas creadas' :
              license && !license.canCreate ? `Límite alcanzado (${license?.pollasLimit})` :
              'Sin licencia activa'
            }
            description={
              isSuspended ? undefined :
              license?.canCreate ? 'Toca "Nueva" para crear tu primera polla.' :
              license && !license.canCreate ? `Contacta a hola@pollafutbolera.online para ampliar tu plan.` :
              'Contacta a hola@pollafutbolera.online para adquirir una licencia.'
            }
          />
        ) : (
          <div className="space-y-2">
            {adminPollas.map((polla, i) => (
              <div key={polla.id} style={{ animationDelay: `${i * 50}ms` }}>
                <AdminPollaCard polla={polla} onClick={() => navigate(`/admin/${polla.id}`)} />
              </div>
            ))}
            {license && !license.canCreate && !isSuspended && (
              <p className="text-xs text-center text-muted-foreground/60 pt-1">
                Límite alcanzado · <strong>hola@pollafutbolera.online</strong>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/40">Participando</span>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      {/* ── Pollas donde participo ─── */}
      <section className="space-y-3 -mt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Pollas donde participo
          </h2>
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold px-3 gap-1 border-border/60">
                <Plus className="h-3.5 w-3.5" /> Unirme
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unirme a una polla</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoinPolla} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Código de invitación</Label>
                  <Input
                    placeholder="OSORIO26"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    className="font-mono tracking-widest text-center text-lg"
                    maxLength={8}
                  />
                  {joinCode.length >= 6 && (
                    <div className={cn(
                      'text-xs rounded-xl px-3 py-2 border',
                      pollaEncontrada
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20',
                    )}>
                      {pollaEncontrada
                        ? `✓ Polla encontrada: "${pollaEncontrada.nombre}"`
                        : '✗ No se encontró ninguna polla con ese código'}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tu alias en esta polla</Label>
                  <Input
                    placeholder="ElProfe, TioChucho, CR7Fan..."
                    value={joinApodo}
                    onChange={e => setJoinApodo(e.target.value)}
                    disabled={!pollaEncontrada}
                  />
                  <p className="text-xs text-muted-foreground">Así aparecerás en la tabla de posiciones.</p>
                  {pollaEncontrada && joinApodo.trim().length >= 2 && (
                    <p className={cn(
                      'text-xs font-medium',
                      checkingApodo ? 'text-muted-foreground' : apodoDisponible ? 'text-emerald-500' : 'text-red-500',
                    )}>
                      {checkingApodo ? '⏳ Verificando...' : apodoDisponible ? '✓ Alias disponible' : '✗ Este alias ya está en uso en esta polla'}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!pollaEncontrada || !joinApodo.trim() || joinPolla.isPending || apodoDisponible === false}
                >
                  {joinPolla.isPending ? 'Enviando solicitud...' : 'Solicitar unirme'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingPart ? (
          <div className="space-y-2">
            <PollaCardSkeleton />
          </div>
        ) : participatingPollas.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No estás en ninguna polla"
            description="Pide el código de invitación al admin y toca «Unirme»."
          />
        ) : (
          <div className="space-y-2">
            {participatingPollas.map((pp, i) => {
              const polla = pp.pollas as unknown as { id: string; nombre: string } | null
              if (!polla) return null
              return (
                <div key={pp.polla_id} style={{ animationDelay: `${i * 50}ms` }}>
                  <ParticipantPollaCard
                    pp={pp}
                    polla={polla}
                    onClick={() => navigate(`/polla/${pp.polla_id}/predicciones`)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
