import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParticipants } from '@/hooks/useParticipants'
import { useJornadas, useMatches } from '@/hooks/useMatches'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, Users, Calendar, FileDown, Pencil, Check, X } from 'lucide-react'
import WhatsAppIcon from '@/components/icons/WhatsAppIcon'
import { shareViaWhatsApp } from '@/lib/shareWhatsApp'

interface AdminHeaderProps {
  polla: { nombre: string; invite_code: string | null } | null | undefined
  pollaId: string
}

// Código de invitación: 4-8 chars, solo A-Z y 0-9
const CODE_REGEX = /^[A-Z0-9]{4,8}$/

export default function AdminHeader({ polla, pollaId }: AdminHeaderProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data: participants = [] } = useParticipants(pollaId)
  const { data: jornadas = [] } = useJornadas(pollaId)
  const { data: matches = [] } = useMatches(pollaId)

  // Inline edit state
  const [editing, setEditing] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [codeError, setCodeError] = useState('')

  const authorizedCount = participants.filter(p => p.status === 'authorized').length

  function copyPollaId() {
    const code = polla?.invite_code ?? pollaId
    navigator.clipboard.writeText(code)
    toast({ title: '¡Código copiado!', description: 'Compártelo con los participantes para que se unan.' })
  }

  function startEdit() {
    setNewCode(polla?.invite_code ?? '')
    setCodeError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setCodeError('')
  }

  function handleCodeInput(val: string) {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setNewCode(upper)
    if (upper && !CODE_REGEX.test(upper)) {
      setCodeError('4–8 caracteres, solo letras y números')
    } else {
      setCodeError('')
    }
  }

  async function handleSaveCode() {
    const code = newCode.trim()
    if (!CODE_REGEX.test(code)) {
      setCodeError('4–8 caracteres, solo letras y números')
      return
    }
    if (code === polla?.invite_code) { cancelEdit(); return }

    setSaving(true)
    try {
      // Verificar disponibilidad del código (excluir la polla actual)
      const { data: taken } = await supabase
        .from('pollas')
        .select('id')
        .eq('invite_code', code)
        .neq('id', pollaId)
        .maybeSingle()

      if (taken) {
        setCodeError('Este código ya está en uso por otra polla')
        return
      }

      const { error } = await supabase
        .from('pollas')
        .update({ invite_code: code })
        .eq('id', pollaId)

      if (error) throw error

      // Actualizar cache de usePolla
      qc.invalidateQueries({ queryKey: ['polla', pollaId] })
      toast({ title: 'Código actualizado', description: `Nuevo código: ${code}` })
      setEditing(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setCodeError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Title row */}
      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{polla?.nombre}</h1>
          <p className="text-xs text-muted-foreground">Panel de administración</p>
        </div>
      </div>

      {/* Invite code card */}
      <Card className="bg-emerald-950/40 border-emerald-800/50">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-emerald-400 font-medium mb-2">Código de invitación para participantes</p>
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={newCode}
                  onChange={e => handleCodeInput(e.target.value)}
                  className="font-mono font-bold text-xl tracking-widest text-center h-10 bg-slate-900 border-emerald-600"
                  placeholder="CÓDIGO"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveCode(); if (e.key === 'Escape') cancelEdit() }}
                />
                <Button
                  size="icon" variant="ghost"
                  className="h-9 w-9 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/40 shrink-0"
                  onClick={handleSaveCode}
                  disabled={saving || !CODE_REGEX.test(newCode)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon" variant="ghost"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {codeError && (
                <p className="text-xs text-red-400">{codeError}</p>
              )}
              <p className="text-xs text-muted-foreground">4–8 caracteres · solo letras y números</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold tracking-widest text-white flex-1 text-center bg-slate-900 rounded px-3 py-1.5">
                {polla?.invite_code ?? '—'}
              </code>
              <Button
                size="icon" variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-emerald-400 shrink-0"
                onClick={startEdit}
                title="Editar código"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={copyPollaId} className="shrink-0 bg-emerald-700 hover:bg-emerald-600 text-white">
                <Copy className="h-3 w-3 mr-1" /> Copiar
              </Button>
              {polla?.invite_code && (
                <Button
                  size="sm"
                  onClick={() => shareViaWhatsApp(polla.invite_code!)}
                  className="shrink-0 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-2.5"
                  title="Compartir por WhatsApp"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Participantes', value: authorizedCount, icon: Users, color: 'text-sky-400' },
          { label: 'Partidos', value: matches.length, icon: Calendar, color: 'text-primary' },
          { label: 'Jornadas', value: jornadas.length, icon: FileDown, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border/50 bg-card/60 px-3 py-2.5 text-center">
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className="font-display text-xl leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{value}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
