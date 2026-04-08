import { useAllPredictionsForExport } from '@/hooks/usePredictions'
import { useJornadas } from '@/hooks/useMatches'
import { usePolla } from '@/hooks/usePollas'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { resultLabels } from '@/lib/adminUtils'

interface ExportPredictionsButtonProps {
  pollaId: string
}

export default function ExportPredictionsButton({ pollaId }: ExportPredictionsButtonProps) {
  const { data: polla } = usePolla(pollaId)
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: predictionsExport } = useAllPredictionsForExport(pollaId)

  function downloadCSV(jornadaId?: string) {
    if (!predictionsExport) return
    const rows = predictionsExport.filter(p => {
      if (!jornadaId) return true
      const m = p.matches as unknown as { jornadas: { id?: string } } | null
      return m?.jornadas
    })

    const headers = ['Jornada', 'Partido', 'Participante', 'Predicción', 'Resultado', 'Acertó', 'Es default', 'Fecha envío']
    const lines = rows.map(p => {
      const m = p.matches as unknown as {
        equipo_a: string; equipo_b: string; fecha_hora: string; resultado: string | null
        jornadas: { nombre: string }
      } | null
      const pp = p.polla_participants as unknown as { apodo: string } | null
      const acerto = m?.resultado && p.pick === m.resultado ? 'Sí' : (m?.resultado ? 'No' : '-')
      return [
        m?.jornadas?.nombre ?? '',
        m ? `${m.equipo_a} vs ${m.equipo_b}` : '',
        pp?.apodo ?? '',
        resultLabels[p.pick] ?? p.pick,
        m?.resultado ? (resultLabels[m.resultado] ?? m.resultado) : 'Sin resultado',
        acerto,
        p.is_default ? 'Sí' : 'No',
        p.submitted_at ? format(new Date(p.submitted_at), 'dd/MM/yyyy HH:mm') : '',
      ].join(',')
    })

    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `predicciones_${polla?.nombre ?? 'polla'}_${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descargar predicciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full" variant="outline"
            onClick={() => downloadCSV()}
            disabled={!predictionsExport || predictionsExport.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Todas las predicciones (CSV)
          </Button>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Por jornada:</p>
            {jornadas.map(j => (
              <Button key={j.id} className="w-full" variant="outline" size="sm" onClick={() => downloadCSV(j.id)}>
                <Download className="h-3.5 w-3.5 mr-2" />
                {j.nombre}
              </Button>
            ))}
            {jornadas.length === 0 && (
              <p className="text-xs text-muted-foreground">No hay jornadas creadas.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
