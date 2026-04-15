import { useState } from 'react'
import { NavLink, useMatch } from 'react-router-dom'
import { Home, Trophy, Star, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadCount } from '@/hooks/useNotifications'
import NotificationDrawer from './NotificationDrawer'

export default function BottomNav() {
  const pollaMatch = useMatch('/polla/:pollaId/*')
  const pollaId = pollaMatch?.params.pollaId ?? null
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = useUnreadCount()

  const links = pollaId
    ? [
        { to: '/',                                   label: 'Inicio',    icon: Home,   exact: true  },
        { to: `/polla/${pollaId}/predicciones`,       label: 'Predecir',  icon: Star,   exact: false },
        { to: `/polla/${pollaId}/posiciones`,         label: 'Posiciones',icon: Trophy, exact: false },
        { to: '/perfil',                             label: 'Mi perfil', icon: User,   exact: false },
      ]
    : [
        { to: '/',       label: 'Inicio',    icon: Home, exact: true  },
        { to: '/perfil', label: 'Mi perfil', icon: User, exact: false },
      ]

  return (
    <>
      <NotificationDrawer open={notifOpen} onOpenChange={setNotifOpen} />
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="max-w-lg mx-auto flex h-16">
          {links.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={label}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-all duration-200 relative',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator pill */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                      style={{ boxShadow: '0 0 8px hsl(154 100% 45% / 0.8)' }}
                    />
                  )}
                  <span className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200',
                    isActive && 'bg-primary/10'
                  )}>
                    <Icon className={cn('h-5 w-5 transition-all', isActive && 'text-primary drop-shadow-[0_0_6px_hsl(154_100%_45%/0.6)]')} />
                  </span>
                  <span className={cn('text-[10px] leading-none', isActive && 'text-primary font-semibold')}>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Notification bell */}
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200 relative"
            aria-label="Notificaciones"
          >
            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200">
              <Bell className="h-5 w-5 transition-all" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-0.5 leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
            <span className="text-[10px] leading-none">Avisos</span>
          </button>
        </div>
      </nav>
    </>
  )
}
