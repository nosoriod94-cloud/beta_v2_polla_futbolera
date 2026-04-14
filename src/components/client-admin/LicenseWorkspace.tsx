import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyPollas, useCreatePolla, type MyLicense } from '@/hooks/usePollas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import {
  Plus, Shield, Lock, AlertTriangle, ArrowLeft,
  Check, Copy, Share2, Settings2, ChevronRight, Eye,
} from 'lucide-react'
import OnboardingChecklist from './OnboardingChecklist'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { shareViaWhatsApp } from '@/lib/shareWhatsApp'
import PollaPrediccionesSheet from './PollaPrediccionesSheet'

interface LicenseWorkspaceProps {
  license: MyLicense
  onBack: () => void
}

export default function LicenseWorkspace({ license, onBack }: LicenseWorkspaceProps) {
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data: adminPollas = [], isLoading: loadingAdmin } = useMyPollas(license.id)
  const createPolla = useCreatePolla()

  const [newPollaName, setNewPollaName] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [predSheet, setPredSheet] = useState<{ id: string; nombre: string } | null>(null)

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
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-400 hover:text-white p-1">
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

      {/* Suspended banner */}
      {!license.is_active && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">
            Esta licencia está suspendida. Contacta <strong>hola@pollafutbolera.online</strong>.
          </p>
        </div>
      )}

      {/* Pollas section */}
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
        canCreate ? (
          <OnboardingChecklist
            license={license}
            onCreatePolla={() => setCreateOpen(true)}
          />
        ) : (
          <Card className="border-dashed border-slate-700 bg-transparent">
            <CardContent className="py-8 text-center text-slate-500">
              <Lock className="h-5 w-5 mx-auto mb-1 opacity-40" />
              <p className="text-sm font-medium text-slate-400">
                {license.is_active ? 'Límite alcanzado' : 'Licencia suspendida'}
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <div className="space-y-3">
          {adminPollas.map(polla => {
            const inviteCode = (polla as { invite_code?: string }).invite_code
            const isCopied = copiedId === polla.id
            return (
              <Card key={polla.id} className="bg-slate-900 border-slate-800">
                <CardContent className="py-4 px-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">{polla.nombre}</CardTitle>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${polla.is_active ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {polla.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

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
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs bg-[#25D366] hover:bg-[#1ebe5d] text-white border-0"
                            onClick={() => shareViaWhatsApp(inviteCode)}
                            title="Compartir por WhatsApp"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5 mr-1" /> WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 h-8 text-xs"
                      onClick={() => navigate(`/admin/${polla.id}`)}
                    >
                      <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Gestionar
                      <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                    </Button>
                    <Button
                      className="flex-1 bg-blue-900/60 hover:bg-blue-800/60 text-blue-300 border border-blue-700/40 h-8 text-xs"
                      onClick={() => setPredSheet({ id: polla.id, nombre: polla.nombre })}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver predicciones
                    </Button>
                  </div>
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

      {/* Predictions sheet */}
      {predSheet && (
        <PollaPrediccionesSheet
          open={!!predSheet}
          onOpenChange={v => { if (!v) setPredSheet(null) }}
          pollaId={predSheet.id}
          pollaNombre={predSheet.nombre}
        />
      )}
    </div>
  )
}
