import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/hooks/useNotifications'

interface Props {
  onClick: () => void
}

export default function NotificationBell({ onClick }: Props) {
  const unread = useUnreadCount()

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted/60 transition-colors"
      aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1 leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
