-- ============================================================
-- Migración 007: Códigos de licencia + nombre de referencia
-- ============================================================
-- 1. Agrega license_code (código único compartible con el cliente)
-- 2. Agrega cliente_nombre (referencia opcional para el SuperAdmin)
-- 3. Actualiza grant_license para devolver el código
-- 4. Actualiza get_all_licenses para incluir los nuevos campos
-- 5. Nueva función pública lookup_license_code para el registro
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Nuevas columnas en licenses
-- ─────────────────────────────────────────────
alter table licenses
  add column if not exists license_code  text unique,
  add column if not exists cliente_nombre text;

-- Rellenar las filas existentes con códigos únicos
update licenses
  set license_code = upper(left(replace(gen_random_uuid()::text, '-', ''), 10))
  where license_code is null;

-- Ahora hacerla obligatoria con default para futuras inserciones
alter table licenses
  alter column license_code set not null,
  alter column license_code set default upper(left(replace(gen_random_uuid()::text, '-', ''), 10));

-- ─────────────────────────────────────────────
-- 2. Actualizar grant_license
--    Ahora devuelve text (el license_code generado)
--    Lanza error si el correo ya tiene licencia
-- ─────────────────────────────────────────────
drop function if exists grant_license(uuid, text, text);
drop function if exists grant_license(uuid, text);
create or replace function grant_license(
  p_superadmin_id  uuid,
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
  -- Validar que quien llama es el superadmin
  if auth.uid() != p_superadmin_id then
    raise exception 'No autorizado';
  end if;
  if not exists (
    select 1 from auth.users
    where id = p_superadmin_id and email = 'hola@pollafutbolera.online'
  ) then
    raise exception 'No autorizado';
  end if;

  -- Verificar que el correo no tenga ya una licencia
  if exists (
    select 1 from licenses where email_autorizado = lower(trim(p_email))
  ) then
    raise exception 'Este correo ya tiene una licencia asignada.';
  end if;

  -- Insertar la licencia y devolver el código generado
  insert into licenses (email_autorizado, otorgada_por, cliente_nombre)
    values (lower(trim(p_email)), p_superadmin_id, p_cliente_nombre)
    returning license_code into v_code;

  return v_code;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. Actualizar get_all_licenses para incluir nuevos campos
-- ─────────────────────────────────────────────
drop function if exists get_all_licenses();
create or replace function get_all_licenses()
returns table (
  id               uuid,
  email_autorizado text,
  pollas_limit     int,
  pollas_created   int,
  is_active        boolean,
  otorgada_por     uuid,
  created_at       timestamptz,
  license_code     text,
  cliente_nombre   text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from auth.users
    where id = auth.uid() and email = 'hola@pollafutbolera.online'
  ) then
    raise exception 'No autorizado';
  end if;

  return query
    select
      l.id, l.email_autorizado, l.pollas_limit, l.pollas_created,
      l.is_active, l.otorgada_por, l.created_at,
      l.license_code, l.cliente_nombre
    from licenses l
    order by l.created_at desc;
end;
$$;

-- ─────────────────────────────────────────────
-- 4. Nueva función pública: lookup_license_code
--    Permite a usuarios no autenticados verificar un código
--    antes de registrarse como Cliente Admin.
-- ─────────────────────────────────────────────
create or replace function lookup_license_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email  text;
  v_nombre text;
begin
  select email_autorizado, cliente_nombre
    into v_email, v_nombre
  from licenses
  where license_code = upper(trim(p_code))
    and is_active = true;

  if not found then
    raise exception 'Código inválido o licencia inactiva. Verifica el código con tu administrador.';
  end if;

  return json_build_object('email', v_email, 'cliente_nombre', v_nombre);
end;
$$;

-- Permitir llamadas desde usuarios no autenticados (anon) y autenticados
grant execute on function lookup_license_code(text) to anon;
grant execute on function lookup_license_code(text) to authenticated;
