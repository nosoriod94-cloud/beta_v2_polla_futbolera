-- ============================================================
-- Migración 022: Función is_superadmin() server-side
-- Elimina la necesidad de comparar contra emails hardcodeados
-- en el frontend. La validación queda completamente en el servidor.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla superadmin_list
--    Contiene los user_id de los superadmins del sistema.
--    Sin policies directas — acceso solo via security definer.
-- ─────────────────────────────────────────────────────────────
create table if not exists superadmin_list (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table superadmin_list enable row level security;
-- Sin policies: ningún usuario puede leer/escribir directamente.

-- ─────────────────────────────────────────────────────────────
-- 2. Poblar con el superadmin actual
--    Busca por email en auth.users e inserta si existe.
--    Usa DO block para no fallar si el email no existe aún.
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_uid uuid;
begin
  select id into v_uid
  from auth.users
  where email = 'hola@pollafutbolera.online'
  limit 1;

  if v_uid is not null then
    insert into superadmin_list (user_id)
    values (v_uid)
    on conflict (user_id) do nothing;
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Función is_superadmin()
--    Devuelve true si el usuario autenticado actual es superadmin.
--    Usable desde el frontend via supabase.rpc('is_superadmin').
-- ─────────────────────────────────────────────────────────────
create or replace function is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from superadmin_list
    where user_id = auth.uid()
  );
$$;

grant execute on function is_superadmin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Actualizar grant_license y toggle_license_active
--    para usar is_superadmin() en vez del parámetro p_superadmin_id.
--    Esto hace la validación más robusta (no depende del cliente).
-- ─────────────────────────────────────────────────────────────

-- Actualizar grant_license (eliminar p_superadmin_id, usar is_superadmin())
drop function if exists grant_license(uuid, text, text);

create or replace function grant_license(
  p_email          text,
  p_cliente_nombre text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  -- Validar que quien llama es el superadmin (server-side)
  if not is_superadmin() then
    raise exception 'No autorizado';
  end if;

  -- Verificar que el correo no tenga ya una licencia activa
  if exists (
    select 1 from licenses
    where email_autorizado = lower(trim(p_email))
      and is_active = true
  ) then
    raise exception 'Este correo ya tiene una licencia activa';
  end if;

  -- Insertar la nueva licencia
  insert into licenses (email_autorizado, cliente_nombre)
  values (lower(trim(p_email)), p_cliente_nombre)
  returning license_code into v_code;

  return v_code;
end;
$$;

grant execute on function grant_license(text, text) to authenticated;

-- Actualizar toggle_license_active
drop function if exists toggle_license_active(uuid, text, boolean);

create or replace function toggle_license_active(
  p_email  text,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_superadmin() then
    raise exception 'No autorizado';
  end if;

  update licenses
  set is_active = p_active
  where email_autorizado = lower(trim(p_email));

  if not found then
    raise exception 'Licencia no encontrada para ese email';
  end if;
end;
$$;

grant execute on function toggle_license_active(text, boolean) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 5. Actualizar resolve_limit_request (quitar p_superadmin_id)
-- ─────────────────────────────────────────────────────────────
drop function if exists resolve_limit_request(uuid, uuid, text, text);

create or replace function resolve_limit_request(
  p_request_id uuid,
  p_status     text,   -- 'approved' | 'rejected'
  p_notes      text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_superadmin() then
    raise exception 'No autorizado';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'Estado inválido: debe ser approved o rejected';
  end if;

  update limit_requests
  set status = p_status,
      notes  = p_notes,
      resolved_at = now()
  where id = p_request_id;

  -- Si aprobado, aumentar pollas_limit en la licencia correspondiente
  if p_status = 'approved' then
    update licenses l
    set pollas_limit = pollas_limit + 1
    from limit_requests lr
    where lr.id = p_request_id
      and l.id = lr.license_id;
  end if;
end;
$$;

grant execute on function resolve_limit_request(uuid, text, text) to authenticated;
