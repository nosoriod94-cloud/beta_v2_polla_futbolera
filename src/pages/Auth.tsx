import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { Logo } from '@/components/Logo'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(loginEmail, loginPassword)
    setLoading(false)
    if (error) {
      toast({ title: 'Error al ingresar', description: getReadableError(error), variant: 'destructive' })
    } else {
      navigate('/')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (regNombre.trim().length < 2) {
      toast({ title: 'Ingresa tu nombre completo', variant: 'destructive' })
      return
    }
    if (regPassword.length < 8) {
      toast({ title: 'Contraseña muy corta', description: 'Debe tener al menos 8 caracteres.', variant: 'destructive' })
      return
    }
    if (!/(?=.*[A-Z])/.test(regPassword) || !/(?=.*[0-9])/.test(regPassword)) {
      toast({ title: 'Contraseña débil', description: 'Debe incluir al menos una mayúscula y un número.', variant: 'destructive' })
      return
    }
    if (regPassword !== regPasswordConfirm) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }
    setLoading(true)
    const { error } = await signUp(regEmail, regPassword, regNombre.trim())
    setLoading(false)
    if (error) {
      toast({ title: 'Error al registrarse', description: getReadableError(error), variant: 'destructive' })
    } else {
      toast({ title: 'Cuenta creada', description: 'Revisa tu correo para confirmar tu cuenta.' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(154 100% 45% / 0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, hsl(199 90% 52% / 0.08) 0%, transparent 60%), hsl(222 22% 5%)' }}
    >
      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(hsl(154 100% 45%) 1px, transparent 1px), linear-gradient(90deg, hsl(154 100% 45%) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-up">
          <Logo size="lg" variant="full" className="justify-center mb-3" />
          <p className="text-muted-foreground text-sm tracking-widest uppercase" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.15em' }}>
            FIFA 2026 · Predice · Compite · Gana
          </p>
        </div>

        <Card className="shadow-2xl">
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Ingresar</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Registrarse</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Correo electrónico</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nombre">Nombre completo</Label>
                    <Input
                      id="reg-nombre"
                      type="text"
                      placeholder="Juan Pérez"
                      value={regNombre}
                      onChange={e => setRegNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Correo electrónico</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="tu@correo.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Contraseña</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password-confirm">Confirmar contraseña</Label>
                    <Input
                      id="reg-password-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={regPasswordConfirm}
                      onChange={e => setRegPasswordConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
