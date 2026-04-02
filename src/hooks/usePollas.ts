import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { z } from 'zod'

const PollaNombreSchema = z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100)

export function useMyPollas(licenseId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['pollas', user?.id, licenseId],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('pollas')
        .select('*')
        .eq('admin_user_id', user!.id)
        .order('created_at', { ascending: false })
      if (licenseId) {
        query = query.eq('license_id', licenseId)
      }
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useMyParticipatingPollas() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['pollas_participando', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('polla_participants')
        .select('polla_id, status, apodo, pollas(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// Retorna la primera licencia activa con capacidad (o la primera activa).
// Soporta multi-licencia: si hay varias, prioriza la que tiene capacidad disponible.
export function useLicense() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['license', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('id, pollas_limit, pollas_created, is_active')
        .eq('email_autorizado', user!.email!.toLowerCase())
        .order('created_at', { ascending: true })
      if (error) throw error
      if (!data || data.length === 0) return null
      // Priorizar: activa con capacidad > activa sin capacidad > cualquiera
      const best = data.find(l => l.is_active && l.pollas_created < l.pollas_limit)
        ?? data.find(l => l.is_active)
        ?? data[0]
      return {
        id: best.id,
        canCreate: best.is_active && best.pollas_created < best.pollas_limit,
        pollasCreated: best.pollas_created,
        pollasLimit: best.pollas_limit,
        isActive: best.is_active,
      }
    },
  })
}

/** @deprecated usa useLicense() */
export function useHasLicense() {
  const license = useLicense()
  return {
    ...license,
    data: license.data?.canCreate ?? false,
  }
}

export function useCreatePolla() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ nombre, licenseId }: { nombre: string; licenseId: string }) => {
      PollaNombreSchema.parse(nombre)
      // 1. Crear la polla con license_id (invite_code se genera automáticamente via trigger)
      const { data: polla, error: pollaErr } = await supabase
        .from('pollas')
        .insert({ nombre, admin_user_id: user!.id, license_id: licenseId })
        .select()
        .single()
      if (pollaErr) throw pollaErr

      // 2. Marcar la licencia como usada e incrementar contador (via función security definer)
      const { error: useErr } = await supabase
        .rpc('use_license', { p_polla_id: polla.id })
      if (useErr) {
        // Revertir la polla si falla
        await supabase.from('pollas').delete().eq('id', polla.id)
        throw new Error(useErr.message)
      }

      return polla
    },
    onSuccess: (_data, { licenseId }) => {
      qc.invalidateQueries({ queryKey: ['pollas', user?.id] })
      qc.invalidateQueries({ queryKey: ['license', user?.email] })
      qc.invalidateQueries({ queryKey: ['my_licenses', user?.id] })
      qc.invalidateQueries({ queryKey: ['pollas', user?.id, licenseId] })
    },
  })
}

export function usePolla(pollaId: string | undefined) {
  return useQuery({
    queryKey: ['polla', pollaId],
    enabled: !!pollaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pollas')
        .select('*')
        .eq('id', pollaId!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function usePollaByInviteCode(inviteCode: string | undefined) {
  return useQuery({
    queryKey: ['polla_invite', inviteCode],
    enabled: !!inviteCode && inviteCode.length >= 6,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pollas')
        .select('id, nombre, is_active')
        .eq('invite_code', inviteCode!.trim().toUpperCase())
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

// ─────────────────────────────────────────────
// Hooks para Cliente Admin (multi-licencia)
// ─────────────────────────────────────────────

export type MyLicense = {
  id: string
  license_code: string
  nombre_licencia: string | null
  cliente_nombre: string | null
  pollas_limit: number
  pollas_created: number
  is_active: boolean
  created_at: string
}

// Retorna todas las licencias del usuario actual (puede ser más de una)
export function useMyLicenses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my_licenses', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_licenses')
      if (error) throw error
      return data as MyLicense[]
    },
  })
}

// Permite al Cliente Admin nombrar/renombrar una licencia
export function useSetLicenseNombre() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ licenseId, nombre }: { licenseId: string; nombre: string }) => {
      const { error } = await supabase.rpc('set_license_nombre', {
        p_license_id: licenseId,
        p_nombre: nombre,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_licenses', user?.id] })
    },
  })
}

// ─────────────────────────────────────────────
// Hooks exclusivos para SuperAdmin
// ─────────────────────────────────────────────

export function useAllPollas() {
  return useQuery({
    queryKey: ['all_pollas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pollas')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

// Obtiene todas las licencias vía RPC (sin SELECT directo a la tabla)
export function useAllLicenses() {
  return useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_licenses')
      if (error) throw error
      return data as Array<{
        id: string
        email_autorizado: string
        pollas_limit: number
        pollas_created: number
        is_active: boolean
        otorgada_por: string | null
        created_at: string
        license_code: string
        cliente_nombre: string | null
      }>
    },
  })
}

export function useGrantLicense() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ email, clienteNombre }: { email: string; clienteNombre?: string }) => {
      const { data, error } = await supabase.rpc('grant_license', {
        p_superadmin_id: user!.id,
        p_email: email,
        p_cliente_nombre: clienteNombre || null,
      })
      if (error) throw new Error(error.message)
      return data as string // license_code
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}

export function useLookupLicenseCode() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('lookup_license_code', { p_code: code })
      if (error) throw new Error(error.message)
      return data as { email: string; cliente_nombre: string | null }
    },
  })
}

export function useToggleLicenseActive() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ email, active }: { email: string; active: boolean }) => {
      const { error } = await supabase.rpc('toggle_license_active', {
        p_superadmin_id: user!.id,
        p_email: email,
        p_active: active,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licenses'] })
    },
  })
}
