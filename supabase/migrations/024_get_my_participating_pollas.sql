-- ============================================================
-- Migración 024: RPC get_my_participating_pollas
--
-- Retorna las pollas donde el usuario autenticado tiene una
-- entrada en polla_participants (cualquier status: pending,
-- authorized, blocked). Usa security definer para bypasear
-- la restricción de la política "pollas: select" que solo
-- permite ver pollas donde se es admin o participante autorizado.
-- ============================================================

create or replace function get_my_participating_pollas()
returns table (
  polla_id   uuid,
  polla_nombre text,
  status     text,
  apodo      text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    pp.polla_id,
    p.nombre  as polla_nombre,
    pp.status::text,
    pp.apodo,
    pp.created_at
  from polla_participants pp
  join pollas p on p.id = pp.polla_id
  where pp.user_id = auth.uid()
  order by pp.created_at desc;
$$;

grant execute on function get_my_participating_pollas() to authenticated;
