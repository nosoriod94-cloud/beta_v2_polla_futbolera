import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useMyPollas, useCreatePolla, useMyParticipatingPollas, useLicense, type ParticipatingPolla } from '@/hooks/usePollas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { EmptyState } from '@/components/EmptyState'
import { Plus, Shield, Users, Lock, AlertTriangle, LogOut } from 'lucide-react'
import { Logo } from '@/components/Logo'
import AdminPollaCard from '@/components/home/AdminPollaCard'
import ParticipantPollaCard from '@/components/home/ParticipantPollaCard'
import JoinPollaDialog from '@/components/home/JoinPollaDialog'
import HomeSkeleton from '@/components/skeletons/HomeSkeleton'

export default function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: adminPollas = [], isLoading: loadingAdmin } = useMyPollas()
  const { data: participatingPollas = [], isLoading: loadingPart } = useMyParticipatingPollas()
  const { data: license } = useLicense()
  const createPolla = useCreatePolla()

  const [newPollaName, setNewPollaName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

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

  const isSuspended = license !== undefined && license !== null && !license.isActive

  if (loadingAdmin && loadingPart) return <HomeSkeleton />

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
            <div className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted/30 animate-pulse" style={{ animationDelay: '60ms' }} />
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
              license && !license.canCreate ? 'Contacta a hola@pollafutbolera.online para ampliar tu plan.' :
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
          <Button
            size="sm" variant="outline"
            className="h-8 text-xs font-bold px-3 gap-1 border-border/60"
            onClick={() => setJoinOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Unirme
          </Button>
        </div>

        {loadingPart ? (
          <div className="space-y-2">
            <div className="h-20 rounded-2xl bg-muted/30 animate-pulse" />
          </div>
        ) : participatingPollas.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No estás en ninguna polla"
            description="Pide el código de invitación al admin y toca «Unirme»."
          />
        ) : (
          <div className="space-y-2">
            {(participatingPollas as ParticipatingPolla[]).map((pp, i) => (
              <div key={pp.polla_id} style={{ animationDelay: `${i * 50}ms` }}>
                <ParticipantPollaCard
                  pp={pp}
                  polla={{ id: pp.polla_id, nombre: pp.polla_nombre }}
                  onClick={() => navigate(`/polla/${pp.polla_id}/predicciones`)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <JoinPollaDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  )
}
