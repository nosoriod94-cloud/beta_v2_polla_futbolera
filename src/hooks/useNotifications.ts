import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export type Notification = {
  id: string
  user_id: string
  polla_id: string
  type: 'match_unlocked' | 'result_entered' | 'approved'
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()

  // Suscripción realtime para nuevas notificaciones
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications:' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['notifications', user.id] })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, qc])

  return useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as Notification[]
    },
  })
}

export function useUnreadCount() {
  const { data = [] } = useNotifications()
  return data.filter(n => !n.is_read).length
}

export function useMarkNotificationsRead() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return
      const { error } = await supabase.rpc('mark_notifications_read', { p_ids: ids })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', user?.id] })
    },
  })
}
