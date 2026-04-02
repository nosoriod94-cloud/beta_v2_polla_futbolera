import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  useMyLicenses, useSetLicenseNombre, useMyPollas, useCreatePolla,
  useMyParticipatingPollas, usePollaByInviteCode, type MyLicense,
} from '@/hooks/usePollas'
import { useJoinPolla } from '@/hooks/useParticipants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Shield, Users, Clock, Lock, AlertTriangle,
  LogOut, Briefcase, ChevronRight, ArrowLeft, Pencil, Check, X,
  Copy, Share2, Settings2,
} from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente de aprobación', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  authorized: { label: 'Autorizado',              color: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  blocked:    { label: 'Bloqueado',               color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
}

// ─── Subcomponente: workspace de una licencia ────────────────────────────────
function LicenseWorkspace({
  license,
  onBack,
}: {
  license: MyLicense
  onBack: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: adminPollas = [], isLoading: loadingAdmin } = useMyPollas(license.id)
  const createPolla = useCreatePolla()

  const [newPollaName, setNewPollaName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const canCreate = license.is_active && license.pollas_created < license.pollas_limit

  function handleCopyCode(pollaId: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(pollaId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleShare(pollaNombre: string, code: string) {
    const text = `Únete a "${pollaNombre}" en Polla Futbolera.\nCódigo de invitación: ${code}\n🔗 app.pollafutbolera.online/auth`
    if (navigator.share) {
      await navigator.share({ title: 'Polla Futbolera', text })
    } else {
      navigator.clipboard.writeText(text)
      toast({ title: 'Texto copiado', description: 'Pégalo donde quieras compartirlo.' })
    }
  }

  async function handleCreatePolla(e: React.FormEvent) {
    e.preventDefault()
    if (!newPollaName.trim()) return
    try {
      const polla = await createPolla.mutateAsync({ nombre: newPollaName.trim(), licenseId: license.id })
      toast({ title: 'Polla creada', description: `"${polla.nombre}" está lista para configurar.` })
      setCreateOpen(false)
      setNewPollaName('')
      navigate(`/admin/${polla.id}`)
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Encabezado de la licencia */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-white p-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold text-white text-base">
            {license.nombre_licencia || license.cliente_nombre || `Licencia ${license.license_code}`}
          </h2>
          <p className="text-xs text-slate-400">
            {license.pollas_created}/{license.pollas_limit} pollas usadas ·{' '}
            <span className={license.is_active ? 'text-emerald-400' : 'text-red-400'}>
              {license.is_active ? 'Activa' : 'Suspendida'}
            </span>
          </p>
        </div>
      </div>

      {/* Banner suspendida */}
      {!license.is_active && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">
            Esta licencia está suspendida. Contacta <strong>hola@pollafutbolera.online</strong>.
          </p>
        </div>
      )}

      {/* Pollas de esta licencia */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" /> Pollas de esta licencia
        </h3>
        {canCreate && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-600 h-8 text-xs">
                <Plus className="h-3 w-3 mr-1" /> Nueva
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Crear nueva polla</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePolla} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre de la polla</Label>
                  <Input
                    placeholder="Polla del trabajo, familia Osorio..."
                    value={newPollaName}
                    onChange={e => setNewPollaName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-600"
                  disabled={createPolla.isPending}
                >
                  {createPolla.isPending ? 'Creando...' : 'Crear polla'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loadingAdmin ? (
        <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>
      ) : adminPollas.length === 0 ? (
        <Card className="border-dashed border-slate-700 bg-transparent">
          <CardContent className="py-8 text-center text-slate-500">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
            {canCreate ? (
              <>
                <p className="text-sm">No hay pollas en esta licencia.</p>
                <p className="text-xs mt-1">Haz clic en "Nueva" para comenzar.</p>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 mx-auto mb-1 opacity-40" />
                <p className="text-sm font-medium text-slate-400">
                  {license.is_active ? 'Límite alcanzado' : 'Licencia suspendida'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {adminPollas.map(polla => {
            const inviteCode = (polla as { invite_code?: string }).invite_code
            const isCopied = copiedId === polla.id
            return (
              <Card key={polla.id} className="bg-slate-900 border-slate-800">
                <CardContent className="py-4 px-4 space-y-3">
                  {/* Nombre + estado */}
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">{polla.nombre}</CardTitle>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${polla.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {polla.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {/* Código de invitación */}
                  {inviteCode && (
                    <div className="bg-slate-800/80 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-400 mb-1.5">Código de invitación para participantes</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-center text-2xl font-mono font-bold tracking-widest text-white">
                          {inviteCode}
                        </code>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            className={`h-8 px-3 text-xs transition-colors ${isCopied ? 'bg-emerald-700 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                            onClick={() => handleCopyCode(polla.id, inviteCode)}
                          >
                            {isCopied
                              ? <><Check className="h-3.5 w-3.5 mr-1" /> Copiado</>
                              : <><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</>
                            }
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => handleShare(polla.nombre, inviteCode)}
                          >
                            <Share2 className="h-3.5 w-3.5 mr-1" /> Compartir
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón gestionar */}
                  <Button
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 h-8 text-xs"
                    onClick={() => navigate(`/admin/${polla.id}`)}
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Gestionar polla
                    <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
          {!canCreate && license.is_active && (
            <p className="text-xs text-center text-slate-500 py-2">
              Límite alcanzado ({license.pollas_created}/{license.pollas_limit}).
              Contacta hola@pollafutbolera.online para ampliar.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subcomponente: card de licencia en la lista ─────────────────────────────
function LicenseCard({
  license,
  onEnter,
  onRename,
}: {
  license: MyLicense
  onEnter: () => void
  onRename: (nombre: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(license.nombre_licencia || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!editValue.trim()) { setEditing(false); return }
    setSaving(true)
    await onRename(editValue.trim())
    setSaving(false)
    setEditing(false)
  }

  const displayName = license.nombre_licencia || license.cliente_nombre || `Licencia ${license.license_code}`

  return (
    <Card className={`bg-slate-900 ${license.is_active ? 'border-slate-800' : 'border-red-900/50'}`}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-7 text-sm px-2"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-emerald-400 hover:text-emerald-300 shrink-0"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-slate-400 hover:text-white shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <button
                  onClick={() => { setEditValue(license.nombre_licencia || ''); setEditing(true) }}
                  className="text-slate-500 hover:text-slate-300 shrink-0"
                  title="Renombrar licencia"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <p className="text-xs font-mono text-purple-400 mt-0.5">{license.license_code}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${license.is_active ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
            {license.is_active ? 'Activa' : 'Suspendida'}
          </span>
        </div>

        {/* Barra de progreso pollas */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Pollas usadas</span>
            <span>{license.pollas_created}/{license.pollas_limit}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (license.pollas_created / license.pollas_limit) * 100)}%` }}
            />
          </div>
        </div>

        <Button
          className="w-full bg-slate-800 hover:bg-slate-700 text-white h-8 text-xs"
          onClick={onEnter}
          disabled={!license.is_active}
        >
          {license.is_active
            ? <><Briefcase className="h-3.5 w-3.5 mr-1.5" /> Gestionar pollas</>
            : 'Licencia suspendida'
          }
        </Button>
      </CardContent>
    </Card>
  )
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
  const [joinCode, setJoinCode] = useState('')
  const [joinApodo, setJoinApodo] = useState('')
  const [joinOpen, setJoinOpen] = useState(false)

  const { data: pollaEncontrada } = usePollaByInviteCode(joinCode)

  // Si no tiene licencias y terminó de cargar, ir al home normal
  if (!loadingLicenses && licenses.length === 0) {
    navigate('/', { replace: true })
    return null
  }

  async function handleRename(licenseId: string, nombre: string) {
    try {
      await setLicenseNombre.mutateAsync({ licenseId, nombre })
    } catch (err: unknown) {
      toast({ title: 'Error al renombrar', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function handleJoinPolla(e: React.FormEvent) {
    e.preventDefault()
    if (!pollaEncontrada || !joinApodo.trim()) return
    try {
      await joinPolla.mutateAsync({ pollaId: pollaEncontrada.id, apodo: joinApodo.trim() })
      toast({ title: 'Solicitud enviada', description: 'El admin debe aprobarte para participar.' })
      setJoinOpen(false)
      setJoinCode('')
      setJoinApodo('')
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-emerald-400" />
            {selectedLicense ? 'Panel Cliente Admin' : 'Panel Cliente Admin'}
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

      <div className="p-4 space-y-6 max-w-lg mx-auto">

        {/* Workspace de licencia seleccionada */}
        {selectedLicense ? (
          <LicenseWorkspace
            license={selectedLicense}
            onBack={() => setSelectedLicense(null)}
          />
        ) : (
          <>
            {/* Lista de licencias */}
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
          </>
        )}

        {/* Pollas donde participo — siempre visible */}
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
                    {joinCode.length >= 6 && (
                      <div className={`text-xs rounded-lg px-3 py-2 ${pollaEncontrada ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {pollaEncontrada
                          ? `✓ Polla encontrada: "${pollaEncontrada.nombre}"`
                          : '✗ No se encontró ninguna polla con ese código'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Tu apodo en esta polla</Label>
                    <Input
                      placeholder="ElProfe, TioChucho..."
                      value={joinApodo}
                      onChange={e => setJoinApodo(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                      disabled={!pollaEncontrada}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-600"
                    disabled={!pollaEncontrada || !joinApodo.trim() || joinPolla.isPending}
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
              {participatingPollas.map(pp => {
                const polla = pp.pollas as unknown as { id: string; nombre: string } | null
                if (!polla) return null
                const statusInfo = statusLabels[pp.status] ?? statusLabels.pending
                return (
                  <Card
                    key={pp.polla_id}
                    className={`cursor-pointer bg-slate-900 border-slate-800 hover:border-blue-800 transition-colors ${pp.status !== 'authorized' ? 'opacity-75' : ''}`}
                    onClick={() => pp.status === 'authorized' && navigate(`/polla/${pp.polla_id}`)}
                  >
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-white">{polla.nombre}</CardTitle>
                          <p className="text-xs text-slate-400 mt-0.5">Apodo: <strong className="text-slate-300">{pp.apodo}</strong></p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusInfo.color}`}>
                          {pp.status === 'pending' && <Clock className="inline h-3 w-3 mr-1" />}
                          {statusInfo.label}
                        </span>
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
      </div>
    </div>
  )
}
