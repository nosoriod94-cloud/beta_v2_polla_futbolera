import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, nombreCompleto: string) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isSigningOut = useRef(false)
  // Solo redirigir por SIGNED_OUT si el usuario ya tenía sesión activa.
  // Evita falsos positivos durante el carga inicial (sin sesión) o
  // durante el flujo de sign-in de Supabase (algunas versiones emiten
  // SIGNED_OUT antes de SIGNED_IN al autenticar por primera vez).
  const hadSession = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) hadSession.current = true
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        hadSession.current = true
      }
      if (event === 'SIGNED_OUT' && !isSigningOut.current && hadSession.current) {
        // Sesión expirada inesperadamente (no por signOut() del usuario)
        toast.error('Tu sesión expiró. Por favor inicia sesión de nuevo.')
        window.location.href = '/auth'
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email: string, password: string, nombreCompleto: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_completo: nombreCompleto } },
    })
    return { error }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error }
  }

  async function signOut() {
    isSigningOut.current = true
    await supabase.auth.signOut()
    isSigningOut.current = false
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
