-- Seguridad: restringir SELECT en pollas a solo las pollas donde el usuario
-- es admin o participante autorizado. Antes, cualquier usuario autenticado
-- podía ver TODAS las pollas del sistema.

drop policy if exists "pollas: select authenticated" on pollas;

create policy "pollas: select" on pollas
  for select using (
    admin_user_id = auth.uid()
    or exists (
      select 1 from polla_participants pp
      where pp.polla_id = id
        and pp.user_id = auth.uid()
        and pp.status = 'authorized'
    )
  );
