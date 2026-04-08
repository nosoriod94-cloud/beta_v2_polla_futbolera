import { useState } from 'react'
import { useJornadas, useCreateJornada, useUpdateJornada } from '@/hooks/useMatches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { Plus, Pencil, Check, X } from 'lucide-react'

interface JornadasTabProps {
  pollaId: string
}

export default function JornadasTab({ pollaId }: JornadasTabProps) {
  const { toast } = useToast()
  const { data: jornadas = [] } = useJornadas(pollaId)
  const createJornada = useCreateJornada()
  const updateJornada = useUpdateJornada()

  const [jornadaOpen, setJornadaOpen] = useState(false)
  const [jornadaNombre, setJornadaNombre] = useState('')
  const [jornadaPuntos, setJornadaPuntos] = useState(3)

  const [editingJornadaId, setEditingJornadaId] = useState<string | null>(null)
  const [editingJornadaPuntos, setEditingJornadaPuntos] = useState(3)

  async function handleCreateJornada(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createJornada.mutateAsync({
        pollaId,
        nombre: jornadaNombre,
        orden: jornadas.length + 1,
        puntosPorAcierto: jornadaPuntos,
      })
      toast({ title: 'Jornada creada' })
      setJornadaOpen(false)
      setJornadaNombre('')
      setJornadaPuntos(3)
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function handleSaveJornadaPuntos(jornadaId: string) {
    try {
      await updateJornada.mutateAsync({ jornadaId, pollaId, puntosPorAcierto: editingJornadaPuntos })
      toast({ title: 'Puntos actualizados' })
      setEditingJornadaId(null)
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <Dialog open={jornadaOpen} onOpenChange={setJornadaOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Nueva jornada
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear jornada</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateJornada} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                placeholder="Jornada 1, Octavos de final..."
                value={jornadaNombre}
                onChange={e => setJornadaNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Puntos por acierto</Label>
              <Input
                type="number" min={1} max={50}
                value={jornadaPuntos}
                onChange={e => setJornadaPuntos(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Puntos que gana un participante por cada predicción correcta en esta fase.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={createJornada.isPending}>
              Crear jornada
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {jornadas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No hay jornadas todavía. Crea la primera para empezar.
          </CardContent>
        </Card>
      ) : (
        jornadas.map(jornada => {
          const isEditingThis = editingJornadaId === jornada.id
          return (
            <Card key={jornada.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm flex-1">{jornada.nombre}</p>
                  {isEditingThis ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min={1} max={50}
                        value={editingJornadaPuntos}
                        onChange={e => setEditingJornadaPuntos(Number(e.target.value))}
                        className="h-6 w-16 text-xs px-1.5"
                      />
                      <span className="text-xs text-muted-foreground">pts</span>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 text-green-600 hover:text-green-700"
                        onClick={() => handleSaveJornadaPuntos(jornada.id)}
                        disabled={updateJornada.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={() => setEditingJornadaId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-1 group"
                      onClick={() => { setEditingJornadaId(jornada.id); setEditingJornadaPuntos(jornada.puntos_por_acierto) }}
                      title="Editar puntos por acierto"
                    >
                      <Badge variant="secondary" className="text-xs">
                        {jornada.puntos_por_acierto} pts/acierto
                      </Badge>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
