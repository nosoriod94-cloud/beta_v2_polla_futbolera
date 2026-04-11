import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useStandings(pollaId: string | undefined) {
  const qc = useQueryClient()
  const channelId = useRef(`standings:${pollaId}:${Math.random().toString(36).slice(2)}`)

  // Suscripción Realtime: invalida el cache cuando cambia predictions o matches
  useEffect(() => {
    if (!pollaId) return

    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predictions',
          filter: `polla_id=eq.${pollaId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['standings', pollaId] })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `polla_id=eq.${pollaId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['standings', pollaId] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pollaId, qc])

  return useQuery({
    queryKey: ['standings', pollaId],
    enabled: !!pollaId,
    staleTime: 60_000, // 1 minuto — las actualizaciones llegan via Realtime
    queryFn: async () => {
      // standings_cache: SELECT simple sin JOINs, se actualiza via trigger en matches.resultado
      const { data, error } = await supabase
        .from('standings_cache')
        .select('*')
        .eq('polla_id', pollaId!)
        .order('puntos_totales', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
