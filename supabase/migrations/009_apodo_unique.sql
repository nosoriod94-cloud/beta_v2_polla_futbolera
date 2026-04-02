-- ============================================================
-- Migración 009: Unicidad de apodo por polla
-- ============================================================
-- Garantiza que cada alias sea único dentro de una polla.
-- Usa índice único case-insensitive para cubrir variaciones
-- como "ElProfe" y "elprofe".
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Normalizar apodos existentes (trim de espacios)
-- ─────────────────────────────────────────────
update polla_participants
  set apodo = trim(apodo)
  where apodo != trim(apodo);

-- ─────────────────────────────────────────────
-- 2. Resolver duplicados existentes antes de crear el índice
--    En caso de duplicados, agrega un número al final
--    (ej: "ElProfe" y "ElProfe" → "ElProfe" y "ElProfe_2")
-- ─────────────────────────────────────────────
do $$
declare
  dup record;
  counter int;
begin
  for dup in
    select polla_id, lower(apodo) as apodo_lower
    from polla_participants
    group by polla_id, lower(apodo)
    having count(*) > 1
  loop
    counter := 2;
    update polla_participants
    set apodo = apodo || '_' || counter
    where id in (
      select id from polla_participants
      where polla_id = dup.polla_id
        and lower(apodo) = dup.apodo_lower
      order by created_at desc
      limit (
        select count(*) - 1
        from polla_participants
        where polla_id = dup.polla_id
          and lower(apodo) = dup.apodo_lower
      )
    );
  end loop;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. Índice único case-insensitive en (polla_id, apodo)
-- ─────────────────────────────────────────────
create unique index if not exists polla_participants_apodo_unique
  on polla_participants (polla_id, lower(apodo));

-- ─────────────────────────────────────────────
-- 4. Nueva función: check_apodo_available
--    Verifica si un apodo está disponible en una polla.
--    Accesible por usuarios autenticados antes de unirse.
--    Ignora participantes bloqueados.
-- ─────────────────────────────────────────────
create or replace function check_apodo_available(p_polla_id uuid, p_apodo text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from polla_participants
    where polla_id = p_polla_id
      and lower(apodo) = lower(trim(p_apodo))
      and status != 'blocked'
  );
$$;

grant execute on function check_apodo_available(uuid, text) to authenticated;
