import { useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Trophy, Unlock, CheckCircle2, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useNotifications, useMarkNotificationsRead } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'match_unlocked': return <Unlock className="h-4 w-4 text-primary" />
    case 'result_entered':  return <Trophy className="h-4 w-4 text-amber-400" />
    case 'approved':        return <CheckCircle2 className="h-4 w-4 text-sky-400" />
    default:                return <Bell className="h-4 w-4 text-muted-foreground" />
  }
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export default function NotificationDrawer({ open, onOpenChange }: Props) {
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationsRead()

  // Marcar como leídas al abrir el drawer
  useEffect(() => {
    if (!open) return
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      markRead.mutate(unreadIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col bg-[#0F1219] border-[#1B2133]">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-[#1B2133]">
          <SheetTitle className="flex items-center gap-2 text-sm font-bold text-white">
            <Bell className="h-4 w-4 text-primary" />
            Notificaciones
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1B2133]">
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3.5 transition-colors',
                    !n.is_read && 'bg-primary/5',
                  )}
                >
                  <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center">
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold leading-tight', !n.is_read ? 'text-white' : 'text-foreground/80')}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {format(parseISO(n.created_at), "d MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="mt-2 shrink-0 w-2 h-2 rounded-full bg-primary" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
