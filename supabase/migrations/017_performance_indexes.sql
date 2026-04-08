-- ============================================================
-- Migración 017: Índices de performance + Realtime para standings
-- ============================================================
-- Acelera las queries más frecuentes: standings_view, listado de
-- partidos por jornada, predicciones por polla, y búsqueda de licencias.
-- ============================================================

-- ── Tabla predictions ───────────────────────────────────────────────────
create index if not exists idx_predictions_participant_id on predictions(participant_id);
create index if not exists idx_predictions_match_id       on predictions(match_id);
create index if not exists idx_predictions_polla_id       on predictions(polla_id);

-- ── Tabla matches ────────────────────────────────────────────────────────
create index if not exists idx_matches_jornada_id      on matches(jornada_id);
create index if not exists idx_matches_polla_id_fecha  on matches(polla_id, fecha_hora);

-- ── Tabla polla_participants ─────────────────────────────────────────────
create index if not exists idx_polla_participants_polla_status on polla_participants(polla_id, status);
create index if not exists idx_polla_participants_user_id      on polla_participants(user_id);

-- ── Tabla jornadas ────────────────────────────────────────────────────────
create index if not exists idx_jornadas_polla_id on jornadas(polla_id);

-- ── Tabla licenses ────────────────────────────────────────────────────────
-- Nota: licenses usa email_autorizado como lookup principal (no user_id)
create index if not exists idx_licenses_email_autorizado on licenses(email_autorizado);

-- ── Tabla pollas ──────────────────────────────────────────────────────────
create index if not exists idx_pollas_admin_user_id on pollas(admin_user_id);

-- ── Habilitar Realtime para predicciones y partidos ───────────────────────
-- Necesario para que useStandings pueda invalidar el cache en tiempo real
-- cuando un admin ingresa un resultado o un participante hace una predicción.
-- Nota: polla_participants ya está en la publicación (migración 011).
do $$
begin
  alter publication supabase_realtime add table predictions;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table matches;
exception when duplicate_object then null;
end;
$$;
