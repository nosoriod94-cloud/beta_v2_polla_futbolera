-- ============================================================
-- Migración 019: Campo defaults_assigned en matches
-- ============================================================
-- Hace idempotente la asignación de predicciones por defecto.
-- El Edge Function marca este campo true después de asignar,
-- lo que previene duplicados si el cron falla y se re-ejecuta.
-- ============================================================

alter table matches
  add column if not exists defaults_assigned boolean not null default false;

-- Retrocompatibilidad: los partidos con fecha pasada que ya tenían predicciones
-- default se marcan como asignados para que el Edge Function no los reprocese.
update matches m
set defaults_assigned = true
where fecha_hora <= now() - interval '1 minute'
  and is_unlocked = true
  and exists (
    select 1 from predictions p
    where p.match_id = m.id and p.is_default = true
  );
