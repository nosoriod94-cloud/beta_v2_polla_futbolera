import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePolla } from '@/hooks/usePollas'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Calendar, FileDown, List } from 'lucide-react'
import AdminHeader from '@/components/admin/AdminHeader'
import ParticipantsTab from '@/components/admin/ParticipantsTab'
import JornadasTab from '@/components/admin/JornadasTab'
import MatchesTab from '@/components/admin/MatchesTab'
import ExportPredictionsButton from '@/components/admin/ExportPredictionsButton'

export default function Admin() {
  const { pollaId } = useParams<{ pollaId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: polla, isLoading: loadingPolla } = usePolla(pollaId)

  if (!loadingPolla && polla && polla.admin_user_id !== user?.id) {
    navigate('/')
    return null
  }

  if (loadingPolla) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3 pt-4">
          <div className="w-9 h-9 rounded-xl bg-muted/40 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="h-5 w-40 rounded-lg bg-muted/40 animate-pulse" />
            <div className="h-3 w-24 rounded-lg bg-muted/30 animate-pulse" />
          </div>
        </div>
        <div className="h-16 rounded-2xl bg-muted/30 animate-pulse" />
        <div className="h-10 rounded-xl bg-muted/30 animate-pulse" />
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-xl bg-muted/20 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <AdminHeader polla={polla} pollaId={pollaId!} />

      <Tabs defaultValue="participantes">
        <TabsList className="w-full">
          <TabsTrigger value="participantes" className="flex-1 text-xs flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Participantes
          </TabsTrigger>
          <TabsTrigger value="jornadas" className="flex-1 text-xs flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" /> Jornadas
          </TabsTrigger>
          <TabsTrigger value="partidos" className="flex-1 text-xs flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Partidos
          </TabsTrigger>
          <TabsTrigger value="exportar" className="flex-1 text-xs flex items-center gap-1.5">
            <FileDown className="h-3.5 w-3.5" /> Exportar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participantes">
          <ParticipantsTab pollaId={pollaId!} />
        </TabsContent>

        <TabsContent value="jornadas">
          <JornadasTab pollaId={pollaId!} />
        </TabsContent>

        <TabsContent value="partidos">
          <MatchesTab pollaId={pollaId!} />
        </TabsContent>

        <TabsContent value="exportar">
          <ExportPredictionsButton pollaId={pollaId!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
