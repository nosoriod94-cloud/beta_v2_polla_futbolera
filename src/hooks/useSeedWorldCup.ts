import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { WORLDCUP2026 } from '@/data/worldcup2026'

export function useSeedWorldCup() {
  const qc = useQueryClient()
  const [seeding, setSeeding] = useState(false)
  const [progress, setProgress] = useState(0)  // grupos completados (0-12)

  const total = WORLDCUP2026.length  // 12

  async function seed(pollaId: string) {
    setSeeding(true)
    setProgress(0)

    try {
      for (const grupo of WORLDCUP2026) {
        // 1. Crear la jornada para este grupo
        const { data: jornada, error: jErr } = await supabase
          .from('jornadas')
          .insert({
            polla_id:           pollaId,
            nombre:             grupo.nombre,
            orden:              grupo.orden,
            puntos_por_acierto: grupo.puntosPorAcierto,
          })
          .select('id')
          .single()

        if (jErr) throw new Error(`Error creando ${grupo.nombre}: ${jErr.message}`)

        // 2. Insertar los 6 partidos del grupo en un solo batch
        const matchRows = grupo.partidos.map(p => ({
          polla_id:   pollaId,
          jornada_id: jornada.id,
          equipo_a:   p.equipoA,
          equipo_b:   p.equipoB,
          fecha_hora: p.fechaHoraUTC,
          estadio:    p.estadio,
          is_unlocked: true,
        }))

        const { error: mErr } = await supabase.from('matches').insert(matchRows)
        if (mErr) throw new Error(`Error creando partidos de ${grupo.nombre}: ${mErr.message}`)

        setProgress(p => p + 1)
      }

      // Refrescar caches al finalizar
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['jornadas', pollaId] }),
        qc.invalidateQueries({ queryKey: ['matches', pollaId] }),
      ])
    } finally {
      setSeeding(false)
    }
  }

  return { seed, seeding, progress, total }
}
