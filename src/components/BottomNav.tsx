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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-lg mx-auto flex h-16">
        {links.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={label}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
