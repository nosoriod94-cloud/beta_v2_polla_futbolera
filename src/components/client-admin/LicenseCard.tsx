import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Check, X, Briefcase, Lock } from 'lucide-react'
import type { MyLicense } from '@/hooks/usePollas'

interface LicenseCardProps {
  license: MyLicense
  onEnter: () => void
  onRename: (nombre: string) => Promise<void>
}

export default function LicenseCard({ license, onEnter, onRename }: LicenseCardProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(license.nombre_licencia || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!editValue.trim()) { setEditing(false); return }
    setSaving(true)
    await onRename(editValue.trim())
    setSaving(false)
    setEditing(false)
  }

  const displayName = license.nombre_licencia || license.cliente_nombre || `Licencia ${license.license_code}`

  return (
    <Card className={`bg-slate-900 ${license.is_active ? 'border-slate-800' : 'border-red-900/50'}`}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-7 text-sm px-2"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-emerald-400 hover:text-emerald-300 shrink-0"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-slate-400 hover:text-white shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <button
                  onClick={() => { setEditValue(license.nombre_licencia || ''); setEditing(true) }}
                  className="text-slate-500 hover:text-slate-300 shrink-0"
                  title="Renombrar licencia"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <p className="text-xs font-mono text-purple-400 mt-0.5">{license.license_code}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${license.is_active ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
            {license.is_active ? 'Activa' : 'Suspendida'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Pollas usadas</span>
            <span>{license.pollas_created}/{license.pollas_limit}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (license.pollas_created / license.pollas_limit) * 100)}%` }}
            />
          </div>
        </div>

        <Button
          className="w-full bg-slate-800 hover:bg-slate-700 text-white h-8 text-xs"
          onClick={onEnter}
          disabled={!license.is_active}
        >
          {license.is_active
            ? <><Briefcase className="h-3.5 w-3.5 mr-1.5" /> Gestionar pollas</>
            : <><Lock className="h-3.5 w-3.5 mr-1.5" /> Licencia suspendida</>
          }
        </Button>
      </CardContent>
    </Card>
  )
}
