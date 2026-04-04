import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLookupLicenseCode } from '@/hooks/usePollas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getReadableError } from '@/lib/errorMessages'
import { KeyRound, ArrowRight, User } from 'lucide-react'

export default function ClientAdminRegister() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const lookupCode = useLookupLicenseCode()

  // Step 1: code verification
  const [code, setCode] = useState('')

  // Step 2: account creation
  const [step, setStep] = useState<1 | 2>(1)
  const [licenseEmail, setLicenseEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    try {
      const result = await lookupCode.mutateAsync(code.trim())
      setLicenseEmail(result.email)
      setStep(2)
    } catch (err: unknown) {
      toast({ title: 'Código inválido', description: getReadableError(err), variant: 'destructive' })
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (nombre.trim().length < 2) {
      toast({ title: 'Ingresa tu nombre completo', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Contraseña muy corta', description: 'Debe tener al menos 8 caracteres.', variant: 'destructive' })
      return
    }
    if (!/(?=.*[A-Z])/.test(password) || !/(?=.*[0-9])/.test(password)) {
      toast({ title: 'Contraseña débil', description: 'Debe incluir al menos una mayúscula y un número.', variant: 'destructive' })
      return
    }
    if (password !== passwordConfirm) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: licenseEmail,
      password,
      options: {
        data: { nombre_completo: nombre.trim() },
      },
    })
    setLoading(false)

    if (error) {
      toast({ title: 'Error al crear la cuenta', description: getReadableError(error), variant: 'destructive' })
    } else {
      toast({
        title: '¡Cuenta creada!',
        description: 'Revisa tu correo para confirmar tu cuenta y luego inicia sesión.',
      })
      navigate('/client-admin/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-900 to-emerald-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-white">Registro Cliente Admin</h1>
          <p className="text-slate-400 mt-1 text-sm">Polla Futbolera</p>
        </div>

        <Card className="shadow-2xl bg-slate-900 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              {step === 1
                ? <><KeyRound className="h-4 w-4 text-purple-400" /> Verificar código de licencia</>
                : <><User className="h-4 w-4 text-green-400" /> Crear tu cuenta</>
              }
            </CardTitle>
            {step === 2 && (
              <p className="text-xs text-slate-400 mt-1">
                Tu cuenta quedará asociada a: <span className="text-white font-medium">{licenseEmail}</span>
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-2">
            {step === 1 ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Código de licencia</Label>
                  <Input
                    type="text"
                    placeholder="Ej: ABC1234567"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono tracking-widest text-center text-lg"
                    maxLength={10}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-slate-500">
                    Ingresa el código que te compartió el administrador del sistema.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-600"
                  disabled={lookupCode.isPending}
                >
                  {lookupCode.isPending ? 'Verificando...' : <><ArrowRight className="h-4 w-4 mr-2" /> Verificar código</>}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/client-admin/login')}
                    className="text-purple-400 hover:underline"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Correo electrónico</Label>
                  <Input
                    type="email"
                    value={licenseEmail}
                    readOnly
                    className="bg-slate-800/50 border-slate-700 text-slate-300 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Nombre completo</Label>
                  <Input
                    type="text"
                    placeholder="Juan Pérez"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Contraseña</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Confirmar contraseña</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => setStep(1)}
                  >
                    Atrás
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-700 hover:bg-green-600"
                    disabled={loading}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
