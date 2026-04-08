// Edge Function: assign-default-predictions
// Asigna predicción "draw" (Empate) a todos los participantes autorizados
// que no ingresaron predicción antes del cierre del partido.
//
// IDEMPOTENTE: usa el campo matches.defaults_assigned para no duplicar.
// La operación puede ejecutarse múltiples veces — la segunda vez reporta inserted: 0.
//
// Configurar pg_cron en Supabase SQL Editor:
//   select cron.schedule(
//     'assign-default-predictions',
//     '* * * * *',
//     $$select assign_default_predictions()$$
//   );
//
// O bien, invocar este Edge Function desde un cron externo (ej. Supabase Cron Jobs).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret) {
    return new Response('Server misconfiguration: CRON_SECRET not set', { status: 500 })
  }
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Ventana ampliada a 10 minutos: partidos cerrados que aún no tienen defaults
  // asignados (defaults_assigned = false). Idempotente: si el cron falla una o
  // varias veces consecutivas, el próximo ciclo los recupera sin duplicar.
  const now = new Date()
  const oneMinAgo = new Date(now.getTime() - 60_000).toISOString()
  const tenMinAgo = new Date(now.getTime() - 600_000).toISOString()

  const { data: closedMatches, error: matchErr } = await supabase
    .from('matches')
    .select('id, polla_id')
    .eq('is_unlocked', true)
    .eq('defaults_assigned', false)
    .lte('fecha_hora', oneMinAgo)
    .gte('fecha_hora', tenMinAgo)

  if (matchErr) {
    return new Response(JSON.stringify({ error: matchErr.message }), { status: 500 })
  }

  if (!closedMatches || closedMatches.length === 0) {
    return new Response(JSON.stringify({ processed: 0, inserted: 0 }), { status: 200 })
  }

  let inserted = 0
  let failed = 0

  for (const match of closedMatches) {
    // Participantes autorizados en esta polla
    const { data: participants, error: pErr } = await supabase
      .from('polla_participants')
      .select('id')
      .eq('polla_id', match.polla_id)
      .eq('status', 'authorized')

    if (pErr || !participants) { failed++; continue }

    // Predicciones ya existentes para este partido
    const { data: existingPreds } = await supabase
      .from('predictions')
      .select('participant_id')
      .eq('match_id', match.id)

    const predictedIds = new Set((existingPreds ?? []).map(p => p.participant_id))

    const defaults = participants
      .filter(p => !predictedIds.has(p.id))
      .map(p => ({
        polla_id:       match.polla_id,
        match_id:       match.id,
        participant_id: p.id,
        pick:           'draw' as const,
        is_default:     true,
      }))

    if (defaults.length > 0) {
      const { error: insertErr } = await supabase
        .from('predictions')
        .insert(defaults)

      if (insertErr) { failed++; continue }
      inserted += defaults.length
    }

    // Marcar partido como procesado para garantizar idempotencia
    await supabase
      .from('matches')
      .update({ defaults_assigned: true })
      .eq('id', match.id)
  }

  // Registro en audit_log para trazabilidad
  await supabase
    .from('audit_log')
    .insert({
      action:      'assign_defaults',
      entity_type: 'predictions',
      entity_id:   null,
      details:     JSON.stringify({
        processed: closedMatches.length,
        inserted,
        failed,
        run_at: now.toISOString(),
      }),
    })

  return new Response(
    JSON.stringify({ processed: closedMatches.length, inserted, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
