import { useState } from 'react'
import { useParticipants, useUpdateParticipantStatus, useLimitRequest, useRequestParticipantLimit } from '@/hooks/useParticipants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { CheckCircle, XCircle, Clock, Users, Plus, AlertTriangle, RefreshCw } from 'lucide-react'

interface ParticipantsTabProps {
  pollaId: string
}

export default function ParticipantsTab({ pollaId }: ParticipantsTabProps) {
  const { toast } = useToast()
  const { data: participants = [], isFetching, refetch } = useParticipants(pollaId)
  const { data: limitRequest } = useLimitRequest(pollaId)
  const updateStatus = useUpdateParticipantStatus()
  const requestLimit = useRequestParticipantLimit()

  const [limitOpen, setLimitOpen] = useState(false)

  const authorizedCount = participants.filter(p => p.status === 'authorized').length
  const approvedLimit = limitRequest?.status === 'approved' ? limitRequest.requested_limit : 50

  async function handleRequestLimit() {
    try {
      await requestLimit.mutateAsync({
        pollaId,
        currentLimit: approvedLimit,
        requestedLimit: approvedLimit + 25,
      })
      toast({ title: 'Solicitud enviada', description: 'El administrador del sistema revisará tu solicitud.' })
      setLimitOpen(false)
    } catch (err: unknown) {
      toast({ title: 'Error', description: getReadableError(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <Button
          size="sm" variant="ghost"
          className="text-xs text-muted-foreground -ml-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            <strong className={
              authorizedCount >= approvedLimit ? 'text-red-600' :
              authorizedCount >= approvedLimit - 2 ? 'text-orange-600' :
              'text-foreground'
            }>
              {authorizedCount}
            </strong>
            {' / '}{approvedLimit} participantes autorizados
          </span>
        </div>
        {authorizedCount >= approvedLimit && limitRequest?.status !== 'pending' && limitRequest?.status !== 'approved' && (
          <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50">
                <Plus className="h-3 w-3 mr-1" /> Más cupos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Solicitar más participantes</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  Tu polla ha alcanzado el límite de <strong>{approvedLimit} participantes</strong>.
                  Puedes solicitar ampliar el cupo en 25 participantes adicionales.
                </p>
                <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-800">
                  <p className="font-medium">Solicitud de expansión</p>
                  <p className="text-xs mt-1">
                    Límite actual: {approvedLimit} → Nuevo límite solicitado: {approvedLimit + 25}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  El administrador del sistema revisará tu solicitud.
                </p>
                <Button className="w-full" onClick={handleRequestLimit} disabled={requestLimit.isPending}>
                  {requestLimit.isPending ? 'Enviando...' : 'Enviar solicitud'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {limitRequest?.status === 'pending' && (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
            <Clock className="inline h-3 w-3 mr-1" />Solicitud pendiente
          </span>
        )}
        {limitRequest?.status === 'approved' && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            <CheckCircle className="inline h-3 w-3 mr-1" />Límite ampliado
          </span>
        )}
      </div>

      {authorizedCount >= approvedLimit - 2 && authorizedCount < approvedLimit && (
        <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700">Pronto llegarás al límite de {approvedLimit} participantes.</p>
        </div>
      )}

      {isFetching && participants.length === 0 ? (
        <div className="space-y-2">
          {[0,1,2].map(i => (
            <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : participants.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Nadie se ha unido todavía. Comparte el código de invitación.
          </CardContent>
        </Card>
      ) : (
        participants.map(p => (
          <Card key={p.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{p.apodo}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.status === 'pending' ? 'Solicitud pendiente' : p.status === 'blocked' ? 'Bloqueado' : 'Autorizado'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {p.status === 'pending' && (
                    <>
                      <Button
                        size="sm" variant="ghost"
                        className="text-green-700 hover:text-green-800 hover:bg-green-50 h-8 px-2"
                        onClick={() => updateStatus.mutate({ participantId: p.id, pollaId, status: 'authorized' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-red-700 hover:text-red-800 hover:bg-red-50 h-8 px-2"
                        onClick={() => updateStatus.mutate({ participantId: p.id, pollaId, status: 'blocked' })}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Rechazar
                      </Button>
                    </>
                  )}
                  {p.status === 'authorized' && (
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-700 hover:bg-red-50 h-8 px-2"
                      onClick={() => updateStatus.mutate({ participantId: p.id, pollaId, status: 'blocked' })}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Bloquear
                    </Button>
                  )}
                  {p.status === 'blocked' && (
                    <Button
                      size="sm" variant="ghost"
                      className="text-green-700 hover:bg-green-50 h-8 px-2"
                      onClick={() => updateStatus.mutate({ participantId: p.id, pollaId, status: 'authorized' })}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Autorizar
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      p.status === 'authorized' ? 'border-green-300 text-green-700' :
                      p.status === 'blocked' ? 'border-red-300 text-red-700' :
                      'border-yellow-300 text-yellow-700'
                    }
                  >
                    {p.status === 'pending' ? <Clock className="h-3 w-3" /> :
                     p.status === 'authorized' ? <CheckCircle className="h-3 w-3" /> :
                     <XCircle className="h-3 w-3" />}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
