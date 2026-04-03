-- ============================================================
-- Migración 010: Fix infinite recursion en polla_participants
-- ============================================================
-- El SELECT policy original contiene una subconsulta que
-- referencia la misma tabla polla_participants, causando
-- recursión infinita cuando Postgres evalúa el policy.
--
-- Solución: función security definer que bypassa RLS para
-- verificar si el usuario es participante autorizado.
-- ============================================================

-- 1. Función helper: ¿es el usuario autenticado un participante
--    autorizado en esta polla? Usa security definer para evitar
--    que el check del policy se llame a sí mismo.
create or replace function is_authorized_participant(p_polla_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from polla_participants
    where polla_id = p_polla_id
      and user_id = auth.uid()
      and status = 'authorized'
  );
$$;

-- Solo usuarios autenticados necesitan invocarla (el policy la llama implícitamente)
grant execute on function is_authorized_participant(uuid) to authenticated;

-- 2. Reemplazar el policy SELECT con la versión sin auto-referencia
drop policy if exists "polla_participants: select" on polla_participants;

create policy "polla_participants: select" on polla_participants
  for select using (
    -- El propio participante siempre puede ver su fila
    auth.uid() = user_id
    -- El admin de la polla puede ver todos los participantes
    or exists (
      select 1 from pollas
      where id = polla_id
        and admin_user_id = auth.uid()
    )
    -- Participantes autorizados pueden ver la lista de su polla
    -- (usa función security definer para evitar recursión)
    or is_authorized_participant(polla_id)
  );
