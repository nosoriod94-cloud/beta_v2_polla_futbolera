import { useState, useRef } from 'react'
import { useJornadas, useMatches, useCreateMatch, useUpdateMatch, useDeleteMatch, useUnlockJornada } from '@/hooks/useMatches'
import { useSeedWorldCup } from '@/hooks/useSeedWorldCup'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { Plus, Download, Upload, Lock, Unlock, Pencil, Trash2, Globe, ClipboardList } from 'lucide-react'
import type { MatchResult } from '@/lib/database.types'
import {
  bogotaInputToUTC, utcToBogotaInput, formatBogota,
  parseExcelBuffer, parseCSVText, validateAndEnrichRows, downloadTemplate,
  resultLabels, type CsvRow,
} from '@/lib/adminUtils'
import ImportMatchesDialog from './ImportMatchesDialog'
import BatchResultsDialog from './BatchResultsDialog'

interface MatchesTabProps {
  pollaId: string
}

export default function MatchesTab({ pollaId }: MatchesTabProps) {
  const { toast } = useToast()
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)
  const createMatch = useCreateMatch()
  const updateMatch = useUpdateMatch()
  const deleteMatch = useDeleteMatch()
  const { seed, seeding, progress, total } = useSeedWorldCup()
  const unlockJornada = useUnlockJornada()

  // Seed Mundial 2026 dialog
  const [seedOpen, setSeedOpen] = useState(false)

  // Batch results dialog
  const [batchJornada, setBatchJornada] = useState<{ id: string; nombre: string } | null>(null)

  // Create match form
  const [matchOpen, setMatchOpen] = useState(false)
  const [matchJornadaId, setMatchJornadaId] = useState('')
  const [matchEquipoA, setMatchEquipoA] = useState('')
  const [matchEquipoB, setMatchEquipoB] = useState('')
  const [matchFechaHora, setMatchFechaHora] = useState('')
  const [matchEstadio, setMatchEstadio] = useState('')

  // Edit match form
  const [editOpen, setEditOpen] = useState(false)
  const [editMatch, setEditMatch] = useState<typeof matches[0] | null>(null)
  const [editFechaHoraBogota, setEditFechaHoraBogota] = useState('')

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)

  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault()
    try {
      const fechaUTC = bogotaInputToUTC(matchFechaHora)
      await createMatch.mutateAsync({
        pollaId,
        jornadaId: matchJornadaId,
        equipoA: matchEquipoA,
        equipoB: matchEquipoB,
        fechaHora: fechaUTC,
        estadio: matchEstadio || undefined,
      })
      toast({ title: 'Partido creado' })
      setMatchOpen(false)
      setMatchEquipoA('')
      setMatchEquipoB('')
      setMatchFechaHora('')
      setMatchEstadio('')
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function handleUpdateMatch(e: React.FormEvent) {
    e.preventDefault()
    if (!editMatch) return
    try {
      const fechaUTC = bogotaInputToUTC(editFechaHoraBogota)
      await updateMatch.mutateAsync({
        matchId: editMatch.id,
        pollaId,
        updates: {
          equipo_a: editMatch.equipo_a,
          equipo_b: editMatch.equipo_b,
          fecha_hora: fechaUTC,
          estadio: editMatch.estadio ?? undefined,
          resultado: editMatch.resultado,
        },
      })
      toast({ title: 'Partido actualizado' })
      setEditOpen(false)
      setEditMatch(null)
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function saveResultado(match: typeof matches[0], resultado: MatchResult) {
    try {
      await updateMatch.mutateAsync({ matchId: match.id, pollaId, updates: { resultado } })
      toast({ title: 'Resultado guardado' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function toggleUnlock(match: typeof matches[0]) {
    try {
      await updateMatch.mutateAsync({ matchId: match.id, pollaId, updates: { is_unlocked: !match.is_unlocked } })
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function handleDeleteMatch(matchId: string) {
    if (!confirm('¿Eliminar este partido?')) return
    try {
      await deleteMatch.mutateAsync({ matchId, pollaId })
      toast({ title: 'Partido eliminado' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const jornadaNames = jornadas.map(j => j.nombre)
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)
    const reader = new FileReader()
    if (isExcel) {
      reader.onload = async (ev) => {
        const buffer = ev.target?.result as ArrayBuffer
        const parsed = await parseExcelBuffer(buffer)
        setCsvRows(validateAndEnrichRows(parsed, jornadaNames))
        setCsvOpen(true)
      }
      reader.readAsArrayBuffer(file)
    } else {
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        const parsed = parseCSVText(text)
        setCsvRows(validateAndEnrichRows(parsed, jornadaNames))
        setCsvOpen(true)
      }
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  async function handleCSVImport() {
    const validRows = csvRows.filter(r => !r.error && r.fechaUTC)
    if (validRows.length === 0) return
    setCsvImporting(true)
    let created = 0
    let failed = 0
    for (const row of validRows) {
      const jornada = jornadas.find(j => j.nombre === row.jornada)
      if (!jornada) { failed++; continue }
      try {
        await createMatch.mutateAsync({
          pollaId,
          jornadaId: jornada.id,
          equipoA: row.equipo_a,
          equipoB: row.equipo_b,
          fechaHora: row.fechaUTC!,
          estadio: row.estadio || undefined,
        })
        created++
      } catch {
        failed++
      }
    }
    setCsvImporting(false)
    setCsvOpen(false)
    setCsvRows([])
    toast({
      title: 'Importación completa',
      description: `${created} partido(s) creados${failed > 0 ? `, ${failed} con error` : ''}.`,
    })
  }

  async function handleSeedWorldCup() {
    setSeedOpen(false)
    try {
      await seed(pollaId)
      toast({
        title: '¡Listo! Mundial 2026 cargado',
        description: '12 grupos · 72 partidos creados. Ajusta los puntos por acierto de cada grupo según tu polla.',
      })
    } catch (err: unknown) {
      toast({ title: 'Error al cargar el Mundial', description: getReadableError(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Seed Mundial 2026 — solo visible cuando no hay jornadas ni partidos */}
      {jornadas.length === 0 && matches.length === 0 && (
        <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-5 px-4 flex flex-col items-center gap-3 text-center">
            <Globe className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">Cargar partidos del Mundial 2026</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crea automáticamente los 12 grupos y 72 partidos de la fase de grupos.
              </p>
            </div>
            {seeding ? (
              <div className="w-full space-y-1.5">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress / total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cargando Grupo {progress + 1} de {total}…
                </p>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setSeedOpen(true)}
              >
                <Globe className="h-4 w-4 mr-1.5" /> Cargar Mundial 2026
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialog for seed */}
      <Dialog open={seedOpen} onOpenChange={setSeedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cargar partidos del Mundial 2026?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Se crearán <strong className="text-foreground">12 grupos</strong> (Grupo A–L) y <strong className="text-foreground">72 partidos</strong> de la fase de grupos con:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Equipos, fechas y estadios oficiales</li>
              <li>Horarios en UTC (se muestran en hora Bogotá en la app)</li>
              <li>1 punto por acierto (puedes editar cada grupo después)</li>
            </ul>
            <p className="text-xs">Esta acción no se puede deshacer fácilmente. Solo disponible cuando la polla no tiene partidos.</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSeedOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSeedWorldCup}>
              Sí, cargar Mundial
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action bar */}
      <div className="flex gap-2 flex-wrap">
        <Dialog open={matchOpen} onOpenChange={setMatchOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex-1 bg-blue-700 hover:bg-blue-800" disabled={jornadas.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo partido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear partido</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateMatch} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Jornada</Label>
                <Select value={matchJornadaId} onValueChange={setMatchJornadaId} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona jornada" /></SelectTrigger>
                  <SelectContent>
                    {jornadas.map(j => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nombre} <span className="text-muted-foreground text-xs">({j.puntos_por_acierto} pts)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Equipo A</Label>
                  <Input placeholder="Colombia" value={matchEquipoA} onChange={e => setMatchEquipoA(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Equipo B</Label>
                  <Input placeholder="Brasil" value={matchEquipoB} onChange={e => setMatchEquipoB(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Fecha y hora{' '}
                  <span className="text-xs font-normal text-primary">(Hora Colombia — Bogotá, UTC-5)</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={matchFechaHora}
                  onChange={e => setMatchFechaHora(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Introduce la hora tal como aparece en la programación oficial del torneo en Colombia.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Estadio (opcional)</Label>
                <Input placeholder="MetLife Stadium" value={matchEstadio} onChange={e => setMatchEstadio(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={createMatch.isPending}>
                Crear partido
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Import toolbar */}
      <div className="flex gap-2">
        <Button
          size="sm" variant="ghost"
          className="text-xs text-muted-foreground"
          onClick={() => downloadTemplate(jornadas.map(j => j.nombre))}
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Descargar plantilla Excel
        </Button>
        <Button
          size="sm" variant="ghost"
          className="text-xs text-muted-foreground"
          disabled={jornadas.length === 0}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1" /> Importar Excel / CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {/* Match list grouped by jornada */}
      {jornadas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Crea primero una jornada para agregar partidos.
          </CardContent>
        </Card>
      ) : (
        jornadas.map(jornada => {
          const jornadaMatches = matches
            .filter(m => m.jornada_id === jornada.id)
            .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
          return (
            <div key={jornada.id} className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{jornada.nombre}</h3>
                <Badge variant="secondary" className="text-xs">
                  {jornada.puntos_por_acierto} pts/acierto
                </Badge>
                {/* Botones de acción de jornada — push to right */}
                <div className="flex items-center gap-1 ml-auto">
                  {/* Batch unlock: solo si hay partidos bloqueados no cerrados por tiempo */}
                  {jornadaMatches.some(m =>
                    !m.is_unlocked && new Date(m.fecha_hora) > new Date(Date.now() + 60_000)
                  ) && (
                    <Button
                      size="sm" variant="outline"
                      className="h-6 text-xs border-green-300 text-green-700 hover:bg-green-50 px-2"
                      disabled={unlockJornada.isPending}
                      onClick={async () => {
                        if (!confirm(`¿Abrir todos los partidos de ${jornada.nombre}?`)) return
                        try {
                          await unlockJornada.mutateAsync({ pollaId, jornadaId: jornada.id })
                          toast({ title: `${jornada.nombre} desbloqueada` })
                        } catch (err: unknown) {
                          toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
                        }
                      }}
                    >
                      <Unlock className="h-3 w-3 mr-1" /> Abrir todo
                    </Button>
                  )}
                  {/* Ingresar resultados en lote: visible cuando hay partidos pasados sin resultado */}
                  {jornadaMatches.some(m => new Date(m.fecha_hora) <= new Date() && !m.resultado) && (
                    <Button
                      size="sm" variant="outline"
                      className="h-6 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 px-2"
                      onClick={() => setBatchJornada({ id: jornada.id, nombre: jornada.nombre })}
                    >
                      <ClipboardList className="h-3 w-3 mr-1" /> Resultados
                    </Button>
                  )}
                </div>
              </div>
              {jornadaMatches.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2">Sin partidos en esta jornada.</p>
              ) : (
                jornadaMatches.map(match => {
                  const isTimeLocked = new Date(match.fecha_hora) <= new Date(Date.now() + 60_000)
                  const isPast = new Date(match.fecha_hora) <= new Date()
                  return (
                    <Card key={match.id} className="text-sm">
                      <CardContent className="py-3 px-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {match.equipo_a} <span className="text-muted-foreground">vs</span> {match.equipo_b}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => {
                                setEditMatch(match)
                                setEditFechaHoraBogota(utcToBogotaInput(match.fecha_hora))
                                setEditOpen(true)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteMatch(match.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatBogota(match.fecha_hora)}</span>
                          {match.estadio && <span>{match.estadio}</span>}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {isTimeLocked ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              <Lock className="h-3 w-3" />
                              {isPast ? 'Cerrado · partido jugado' : 'Cierre automático · 1 min'}
                            </span>
                          ) : match.is_unlocked ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                <Unlock className="h-3 w-3" />
                                Abierto · predicciones activas
                              </span>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 px-2"
                                onClick={() => toggleUnlock(match)}
                              >
                                <Lock className="h-3 w-3 mr-1" /> Bloquear
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                <Lock className="h-3 w-3" />
                                Bloqueado por el admin
                              </span>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 text-xs border-green-300 text-green-600 hover:bg-green-50 px-2"
                                onClick={() => toggleUnlock(match)}
                              >
                                <Unlock className="h-3 w-3 mr-1" /> Abrir
                              </Button>
                            </div>
                          )}

                          {match.resultado && (
                            <Badge variant="outline" className="text-xs">
                              Resultado: {resultLabels[match.resultado]}
                            </Badge>
                          )}
                          {isPast && !match.resultado && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-orange-600 mr-1">Resultado:</span>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
                                disabled={updateMatch.isPending}
                                onClick={() => saveResultado(match, 'A_wins')}
                              >
                                {match.equipo_a}
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 text-xs px-2"
                                disabled={updateMatch.isPending}
                                onClick={() => saveResultado(match, 'draw')}
                              >
                                Empate
                              </Button>
                              <Button
                                size="sm" variant="outline"
                                className="h-6 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
                                disabled={updateMatch.isPending}
                                onClick={() => saveResultado(match, 'B_wins')}
                              >
                                {match.equipo_b}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )
        })
      )}

      {/* Edit match dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar partido</DialogTitle></DialogHeader>
          {editMatch && (
            <form onSubmit={handleUpdateMatch} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Equipo A</Label>
                  <Input
                    value={editMatch.equipo_a}
                    onChange={e => setEditMatch({ ...editMatch, equipo_a: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Equipo B</Label>
                  <Input
                    value={editMatch.equipo_b}
                    onChange={e => setEditMatch({ ...editMatch, equipo_b: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Fecha y hora{' '}
                  <span className="text-xs font-normal text-primary">(Hora Colombia — Bogotá, UTC-5)</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={editFechaHoraBogota}
                  onChange={e => setEditFechaHoraBogota(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Estadio</Label>
                <Input
                  value={editMatch.estadio ?? ''}
                  onChange={e => setEditMatch({ ...editMatch, estadio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Resultado</Label>
                <Select
                  value={editMatch.resultado ?? 'sin_resultado'}
                  onValueChange={v =>
                    setEditMatch({ ...editMatch, resultado: (v === 'sin_resultado' ? null : v) as MatchResult })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Sin resultado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_resultado">Sin resultado</SelectItem>
                    <SelectItem value="A_wins">Gana {editMatch.equipo_a}</SelectItem>
                    <SelectItem value="draw">Empate</SelectItem>
                    <SelectItem value="B_wins">Gana {editMatch.equipo_b}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={updateMatch.isPending}>
                Guardar cambios
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Import preview dialog */}
      <ImportMatchesDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        csvRows={csvRows}
        importing={csvImporting}
        onImport={handleCSVImport}
      />

      {/* Batch results dialog */}
      {batchJornada && (
        <BatchResultsDialog
          open={!!batchJornada}
          onOpenChange={v => { if (!v) setBatchJornada(null) }}
          pollaId={pollaId}
          jornadaNombre={batchJornada.nombre}
          matches={matches.filter(m =>
            m.jornada_id === batchJornada.id &&
            new Date(m.fecha_hora) <= new Date() &&
            !m.resultado
          )}
        />
      )}
    </div>
  )
}
