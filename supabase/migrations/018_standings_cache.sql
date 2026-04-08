-- ============================================================
-- Migración 018: Materializar standings_view como standings_cache
-- ============================================================
-- standings_view ejecuta JOINs de 4 tablas en cada consulta.
-- standings_cache guarda el resultado precalculado y se actualiza
-- automáticamente via trigger cuando el admin ingresa un resultado.
-- ============================================================

-- ── 1. Tabla standings_cache ─────────────────────────────────────────────
create table if not exists standings_cache (
  polla_id              uuid not null references pollas(id) on delete cascade,
  participant_id        uuid not null references polla_participants(id) on delete cascade,
  apodo                 text not null,
  puntos_totales        integer not null default 0,
  total_predicciones    integer not null default 0,
  aciertos              integer not null default 0,
  predicciones_default  integer not null default 0,
  updated_at            timestamptz not null default now(),
  primary key (polla_id, participant_id)
);

alter table standings_cache enable row level security;

-- Lectura: admin de la polla o participante autorizado
create policy "standings_cache: select" on standings_cache
  for select using (
    exists (
      select 1 from pollas where id = polla_id and admin_user_id = auth.uid()
    )
    or is_authorized_participant(polla_id)
  );

-- ── 2. Función refresh_standings ────────────────────────────────────────
create or replace function refresh_standings(p_polla_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into standings_cache (
    polla_id, participant_id, apodo,
    puntos_totales, total_predicciones, aciertos, predicciones_default,
    updated_at
  )
  select
    pp.polla_id,
    pp.id,
    pp.apodo,
    coalesce(sum(
      case when pred.pick::text = m.resultado::text then j.puntos_por_acierto else 0 end
    ), 0),
    count(pred.id),
    count(case when pred.pick::text = m.resultado::text then 1 end),
    count(case when pred.is_default = true then 1 end),
    now()
  from polla_participants pp
  left join predictions pred  on pred.participant_id = pp.id
  left join matches m         on m.id = pred.match_id and m.resultado is not null
  left join jornadas j        on j.id = m.jornada_id
  where pp.status = 'authorized'
    and pp.polla_id = p_polla_id
  group by pp.polla_id, pp.id, pp.apodo
  on conflict (polla_id, participant_id)
  do update set
    apodo                = excluded.apodo,
    puntos_totales       = excluded.puntos_totales,
    total_predicciones   = excluded.total_predicciones,
    aciertos             = excluded.aciertos,
    predicciones_default = excluded.predicciones_default,
    updated_at           = now();
end;
$$;

grant execute on function refresh_standings(uuid) to authenticated;

-- ── 3. Trigger: actualizar cache cuando se ingresa un resultado ──────────
create or replace function trigger_refresh_standings()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Solo se activa cuando cambia el resultado del partido
  if old.resultado is distinct from new.resultado then
    perform refresh_standings(new.polla_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_refresh_standings on matches;

create trigger trg_refresh_standings
  after update of resultado on matches
  for each row
  execute function trigger_refresh_standings();

-- ── 4. Poblar cache inicial con los datos existentes ────────────────────
-- Ejecutar para todas las pollas existentes al aplicar la migración
do $$
declare
  r record;
begin
  for r in select distinct polla_id from polla_participants where status = 'authorized' loop
    perform refresh_standings(r.polla_id);
  end loop;
end;
$$;
