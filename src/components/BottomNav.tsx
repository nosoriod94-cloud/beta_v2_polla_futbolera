import { useEffect } from 'react'
import { NavLink, useMatch } from 'react-router-dom'
import { Home, Trophy, Star, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const LAST_POLLA_KEY = 'lastPollaId'

export default function BottomNav() {
  const pollaMatch = useMatch('/polla/:pollaId/*')
  const pollaIdFromUrl = pollaMatch?.params.pollaId

  // Persist the last visited pollaId so buttons work from any page
  useEffect(() => {
    if (pollaIdFromUrl) {
      localStorage.setItem(LAST_POLLA_KEY, pollaIdFromUrl)
    }
  }, [pollaIdFromUrl])

  const pollaId = pollaIdFromUrl ?? localStorage.getItem(LAST_POLLA_KEY) ?? null

  const links = [
    { to: '/', label: 'Inicio', icon: Home, exact: true },
    { to: pollaId ? `/polla/${pollaId}/predicciones` : '/', label: 'Predecir', icon: Star, exact: false },
    { to: pollaId ? `/polla/${pollaId}/posiciones` : '/', label: 'Posiciones', icon: Trophy, exact: false },
    { to: '/perfil', label: 'Mi perfil', icon: User, exact: false },
  ]

  return (
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
      </div>
    </nav>
  )
}
