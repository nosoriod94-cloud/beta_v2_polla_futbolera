import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Forzar detección de sesión desde URL actual (tokens en hash o code en query params)
    supabase.auth.getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/', { replace: true })
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'hsl(222 22% 5%)' }}
    >
      <p className="text-muted-foreground">Verificando acceso...</p>
    </div>
  )
}
