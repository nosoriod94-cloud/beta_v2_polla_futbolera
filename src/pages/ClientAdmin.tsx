import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  useMyLicenses, useSetLicenseNombre,
  useMyParticipatingPollas, usePollaByInviteCode, type MyLicense, type ParticipatingPolla,
} from '@/hooks/usePollas'
import { useJoinPolla, useApodoAvailable } from '@/hooks/useParticipants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import {
  Plus, Users, Clock, LogOut, Briefcase,
  ArrowLeft, Star, Trophy, ChevronRight,
} from 'lucide-react'
import LicenseCard from '@/components/client-admin/LicenseCard'
import LicenseWorkspace from '@/components/client-admin/LicenseWorkspace'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente de aprobación', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  authorized: { label: 'Autorizado',              color: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  blocked:    { label: 'Bloqueado',               color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ClientAdmin() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: licenses = [], isLoading: loadingLicenses } = useMyLicenses()
  const { data: participatingPollas = [], isLoading: loadingPart } = useMyParticipatingPollas()
  const setLicenseNombre = useSetLicenseNombre()
  const joinPolla = useJoinPolla()

  const [selectedLicense, setSelectedLicense] = useState<MyLicense | null>(null)
  const [selectedPolla, setSelectedPolla] = useState<ParticipatingPolla | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinApodo, setJoinApodo] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)

  const { data: pollaEncontrada } = usePollaByInviteCode(joinCode)
  const { data: apodoDisponible, isLoading: checkingApodo } = useApodoAvailable(pollaEncontrada?.id, joinApodo)

  if (!loadingLicenses && licenses.length === 0) {
    navigate('/', { replace: true })
    return null
  }

  async function handleRename(licenseId: string, nombre: string) {
    try {
      await setLicenseNombre.mutateAsync({ licenseId, nombre })
    } catch (err: unknown) {
      toast({ title: 'Error al renombrar', description: getReadableError(err), variant: 'destructive' })
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

  // ── Determine which view to show ─────────────────────────────────────────
  const showLicenseWorkspace = !!selectedLicense && !selectedPolla
  const showPollaView        = !!selectedPolla    && !selectedLicense

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            Panel Cliente Admin
          </h1>
          <p className="text-xs text-slate-400 truncate max-w-[200px]">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { signOut(); navigate('/client-admin/login') }}
          className="text-slate-400 hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-1" /> Salir
        </Button>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto pb-10">

        {/* ── Vista: Workspace de licencia ── */}
        {showLicenseWorkspace && (
          <LicenseWorkspace
            license={selectedLicense}
            onBack={() => setSelectedLicense(null)}
          />
        )}

        {/* ── Vista: Detalle de polla participante ── */}
        {showPollaView && (
          <div className="space-y-5">
            {/* Back + title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" size="sm"
                onClick={() => setSelectedPolla(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-bold text-white text-base leading-tight">
                  {selectedPolla.polla_nombre}
                </h2>
                <p className="text-xs text-slate-400">
                  Apodo: <strong className="text-slate-300">{selectedPolla.apodo}</strong>
                </p>
              </div>
            </div>

            {/* Action cards */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate(`/polla/${selectedPolla.polla_id}/predicciones`)}
                className="w-full flex items-center gap-4 bg-slate-900 border border-slate-700 hover:border-emerald-600 hover:bg-emerald-950/30 rounded-2xl px-5 py-4 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                  <Star className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">Mis predicciones</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ver y editar mis resultados antes de cada partido</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/polla/${selectedPolla.polla_id}/posiciones`)}
                className="w-full flex items-center gap-4 bg-slate-900 border border-slate-700 hover:border-amber-600 hover:bg-amber-950/30 rounded-2xl px-5 py-4 transition-all group text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:bg-amber-500/25 transition-colors">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">Tabla de posiciones</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ver el ranking de todos los participantes</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ── Vista: Inicio (licencias + pollas participante) ── */}
        {!showLicenseWorkspace && !showPollaView && (
          <>
            {/* Mis licencias */}
            <section>
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-400" /> Mis licencias
              </h2>
              {loadingLicenses ? (
                <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>
              ) : (
                <div className="space-y-3">
                  {licenses.map(lic => (
                    <LicenseCard
                      key={lic.id}
                      license={lic}
                      onEnter={() => setSelectedLicense(lic)}
                      onRename={nombre => handleRename(lic.id, nombre)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Pollas donde participo */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" /> Pollas donde participo
                </h2>
                <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Unirme
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">Unirme a una polla</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleJoinPolla} className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Código de invitación</Label>
                        <Input
                          placeholder="OSORIO26"
                          value={joinCode}
                          onChange={e => setJoinCode(e.target.value.toUpperCase())}
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono tracking-widest text-center text-lg"
                          maxLength={8}
                        />
                        {joinCode.length >= 4 && (
                          <div className={`text-xs rounded-lg px-3 py-2 ${pollaEncontrada ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {pollaEncontrada
                              ? `✓ Polla encontrada: "${pollaEncontrada.nombre}"`
                              : '✗ No se encontró ninguna polla con ese código'}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Tu alias en esta polla</Label>
                        <Input
                          placeholder="ElProfe, TioChucho, CR7Fan..."
                          value={joinApodo}
                          onChange={e => setJoinApodo(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          disabled={!pollaEncontrada}
                        />
                        <p className="text-xs text-slate-500">
                          Así aparecerás en la tabla de posiciones. Elige un alias único.
                        </p>
                        {pollaEncontrada && joinApodo.trim().length >= 2 && (
                          <p className={`text-xs font-medium ${checkingApodo ? 'text-slate-400' : apodoDisponible ? 'text-emerald-400' : 'text-red-400'}`}>
                            {checkingApodo ? '⏳ Verificando...' : apodoDisponible ? '✓ Alias disponible' : '✗ Este alias ya está en uso en esta polla'}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-600"
                        disabled={!pollaEncontrada || !joinApodo.trim() || joinPolla.isPending || apodoDisponible === false}
                      >
                        {joinPolla.isPending ? 'Enviando solicitud...' : 'Solicitar unirme'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingPart ? (
                <p className="text-sm text-slate-400 py-4 text-center">Cargando...</p>
              ) : participatingPollas.length === 0 ? (
                <Card className="border-dashed border-slate-700 bg-transparent">
                  <CardContent className="py-6 text-center text-slate-500">
                    <Users className="h-7 w-7 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No estás participando en ninguna polla.</p>
                    <p className="text-xs mt-1">Pide el código de invitación al admin.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(participatingPollas as ParticipatingPolla[]).map(pp => {
                    const statusInfo = statusLabels[pp.status] ?? statusLabels.pending
                    const canEnter = pp.status === 'authorized'
                    return (
                      <Card
                        key={pp.polla_id}
                        className={`bg-slate-900 border-slate-800 transition-colors ${canEnter ? 'cursor-pointer hover:border-blue-700' : 'opacity-70'}`}
                        onClick={() => canEnter && setSelectedPolla(pp)}
                      >
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base text-white truncate">{pp.polla_nombre}</CardTitle>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Apodo: <strong className="text-slate-300">{pp.apodo}</strong>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium border ${statusInfo.color}`}>
                                {pp.status === 'pending' && <Clock className="inline h-3 w-3 mr-1" />}
                                {statusInfo.label}
                              </span>
                              {canEnter && (
                                <ChevronRight className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </div>
                          {pp.status === 'pending' && (
                            <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-1">
                              Tu solicitud está pendiente. El admin debe aprobarte.
                            </p>
                          )}
                        </CardHeader>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
