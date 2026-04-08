import { useState } from 'react'
import { useJoinPolla, useApodoAvailable } from '@/hooks/useParticipants'
import { usePollaByInviteCode } from '@/hooks/usePollas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { cn } from '@/lib/utils'

interface JoinPollaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function JoinPollaDialog({ open, onOpenChange }: JoinPollaDialogProps) {
  const { toast } = useToast()
  const joinPolla = useJoinPolla()

  const [joinCode, setJoinCode] = useState('')
  const [joinApodo, setJoinApodo] = useState('')

  const { data: pollaEncontrada } = usePollaByInviteCode(joinCode)
  const { data: apodoDisponible, isLoading: checkingApodo } = useApodoAvailable(pollaEncontrada?.id, joinApodo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pollaEncontrada || !joinApodo.trim()) return
    try {
      await joinPolla.mutateAsync({ inviteCode: joinCode.trim(), apodo: joinApodo.trim() })
      toast({ title: 'Solicitud enviada', description: 'El admin debe aprobarte para participar.' })
      onOpenChange(false)
      setJoinCode('')
      setJoinApodo('')
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirme a una polla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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
  )
}
