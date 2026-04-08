import { useNavigate } from 'react-router-dom'
import { useParticipants } from '@/hooks/useParticipants'
import { useJornadas, useMatches } from '@/hooks/useMatches'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Copy, Users, Calendar, FileDown } from 'lucide-react'

interface AdminHeaderProps {
  polla: { nombre: string; invite_code: string | null } | null | undefined
  pollaId: string
}

export default function AdminHeader({ polla, pollaId }: AdminHeaderProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: participants = [] } = useParticipants(pollaId)
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)

  const authorizedCount = participants.filter(p => p.status === 'authorized').length

  function copyPollaId() {
    const code = polla?.invite_code ?? pollaId
    navigator.clipboard.writeText(code)
    toast({ title: '¡Código copiado!', description: 'Compártelo con los participantes para que se unan.' })
  }

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{polla?.nombre}</h1>
          <p className="text-xs text-muted-foreground">Panel de administración</p>
        </div>
      </div>

      {/* Invite code card */}
      <Card className="bg-emerald-950/40 border-emerald-800/50">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-emerald-400 font-medium mb-2">Código de invitación para participantes</p>
          <div className="flex items-center gap-2">
            <code className="text-2xl font-mono font-bold tracking-widest text-white flex-1 text-center bg-slate-900 rounded px-3 py-1.5">
              {polla?.invite_code ?? '—'}
            </code>
            <Button size="sm" onClick={copyPollaId} className="shrink-0 bg-emerald-700 hover:bg-emerald-600 text-white">
              <Copy className="h-3 w-3 mr-1" /> Copiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Participantes', value: authorizedCount, icon: Users, color: 'text-sky-400' },
          { label: 'Partidos', value: matches.length, icon: Calendar, color: 'text-primary' },
          { label: 'Jornadas', value: jornadas.length, icon: FileDown, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border/50 bg-card/60 px-3 py-2.5 text-center">
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className="font-display text-xl leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{value}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
