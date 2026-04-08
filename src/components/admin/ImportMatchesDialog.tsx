import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { CsvRow } from '@/lib/adminUtils'

interface ImportMatchesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  csvRows: CsvRow[]
  importing: boolean
  onImport: () => void
}

export default function ImportMatchesDialog({
  open,
  onOpenChange,
  csvRows,
  importing,
  onImport,
}: ImportMatchesDialogProps) {
  const validCount = csvRows.filter(r => !r.error).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista previa — Importar partidos</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {csvRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se encontraron filas válidas en el archivo.
            </p>
          ) : (
            csvRows.map((row, i) => (
              <div
                key={i}
                className={`text-xs rounded-lg px-3 py-2 border ${
                  row.error
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-muted border-border'
                }`}
              >
                {row.error ? (
                  <span>
                    <strong>Fila {i + 1} — Error:</strong> {row.error} &nbsp;|&nbsp;{' '}
                    {row.jornada} | {row.equipo_a} vs {row.equipo_b} | {row.fecha} {row.hora}
                  </span>
                ) : (
                  <span>
                    <strong className="text-green-400">✓</strong> &nbsp;
                    <strong>{row.jornada}</strong> — {row.equipo_a} vs {row.equipo_b} — {row.fecha}{' '}
                    {row.hora} Col{row.estadio ? ` — ${row.estadio}` : ''}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="pt-4 border-t space-y-2">
          {validCount > 0 && csvRows.some(r => r.error) && (
            <p className="text-xs text-yellow-500">
              {csvRows.filter(r => r.error).length} fila(s) con errores serán ignoradas.
            </p>
          )}
          <Button
            className="w-full"
            onClick={onImport}
            disabled={validCount === 0 || importing}
          >
            {importing ? 'Importando...' : `Importar ${validCount} partido(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
