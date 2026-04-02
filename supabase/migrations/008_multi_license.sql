-- ============================================================
-- Migración 008: Multi-licencia por usuario
-- ============================================================
-- Permite que un mismo correo tenga múltiples licencias.
-- Cada licencia puede tener un nombre propio asignado por el cliente.
-- Las pollas quedan asociadas a una licencia específica (license_id).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Eliminar restricción UNIQUE en email_autorizado
--    (ahora un correo puede tener varias licencias)
-- ─────────────────────────────────────────────
alter table licenses drop constraint if exists licenses_email_autorizado_key;

-- ─────────────────────────────────────────────
-- 2. Agregar nombre_licencia a licenses
--    (el Cliente Admin puede nombrar cada licencia)
-- ─────────────────────────────────────────────
alter table licenses
  add column if not exists nombre_licencia text;

-- ─────────────────────────────────────────────
-- 3. Agregar license_id a pollas
--    Cada polla pertenece a una licencia específica
-- ─────────────────────────────────────────────
alter table pollas
  add column if not exists license_id uuid references licenses(id) on delete set null;

-- Rellenar pollas existentes: asociarlas a la primera licencia del admin
update pollas p
set license_id = (
  select l.id
  from licenses l
  join auth.users u on lower(u.email) = l.email_autorizado
  where u.id = p.admin_user_id
  order by l.created_at asc
  limit 1
)
where p.license_id is null;

-- ─────────────────────────────────────────────
-- 4. Actualizar grant_license
--    Ya no lanza error si el correo ya tiene licencia
--    (se permiten múltiples licencias por correo)
-- ─────────────────────────────────────────────
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
  if auth.uid() != p_superadmin_id then
    raise exception 'No autorizado';
  end if;
  if not exists (
    select 1 from auth.users
    where id = p_superadmin_id and email = 'hola@pollafutbolera.online'
  ) then
    raise exception 'No autorizado';
  end if;

  -- Insertar nueva licencia (sin restricción de unicidad por email)
  insert into licenses (email_autorizado, otorgada_por, cliente_nombre)
    values (lower(trim(p_email)), p_superadmin_id, p_cliente_nombre)
    returning license_code into v_code;

  return v_code;
end;
$$;

-- ─────────────────────────────────────────────
-- 5. Actualizar use_license
--    Ahora lee license_id directamente de la polla
--    para incrementar el contador de la licencia correcta
-- ─────────────────────────────────────────────
create or replace function use_license(p_polla_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_license   licenses;
  v_license_id uuid;
  v_email     text;
begin
  -- Obtener license_id de la polla
  select license_id into v_license_id
    from pollas where id = p_polla_id;

  if v_license_id is not null then
    -- Modo nuevo: buscar licencia por license_id
    select * into v_license
      from licenses
      where id = v_license_id
      for update;
  else
    -- Fallback (pollas sin license_id): buscar por email del usuario
    select email into v_email
      from auth.users where id = auth.uid();

    select * into v_license
      from licenses
      where email_autorizado = lower(v_email)
        and is_active = true
        and pollas_created < pollas_limit
      order by created_at asc
      limit 1
      for update;
  end if;

  if not found then
    raise exception 'No se encontró una licencia válida para esta polla. Contacta hola@pollafutbolera.online';
  end if;

  if not v_license.is_active then
    raise exception 'Esta licencia está suspendida. Contacta hola@pollafutbolera.online';
  end if;

  if v_license.pollas_created >= v_license.pollas_limit then
    raise exception 'Esta licencia ya alcanzó el límite de % pollas', v_license.pollas_limit;
  end if;

  update licenses
    set pollas_created = pollas_created + 1
    where id = v_license.id;
end;
$$;

-- ─────────────────────────────────────────────
-- 6. Nueva función: get_my_licenses
--    Retorna todas las licencias del usuario actual
-- ─────────────────────────────────────────────
create or replace function get_my_licenses()
returns table (
  id              uuid,
  license_code    text,
  nombre_licencia text,
  cliente_nombre  text,
  pollas_limit    int,
  pollas_created  int,
  is_active       boolean,
  created_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      l.id, l.license_code, l.nombre_licencia, l.cliente_nombre,
      l.pollas_limit, l.pollas_created, l.is_active, l.created_at
    from licenses l
    join auth.users u on lower(u.email) = l.email_autorizado
    where u.id = auth.uid()
    order by l.created_at asc;
end;
$$;

grant execute on function get_my_licenses() to authenticated;

-- ─────────────────────────────────────────────
-- 7. Nueva función: set_license_nombre
--    El Cliente Admin puede nombrar/renombrar su licencia
-- ─────────────────────────────────────────────
create or replace function set_license_nombre(p_license_id uuid, p_nombre text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email
    from auth.users where id = auth.uid();

  update licenses
    set nombre_licencia = trim(p_nombre)
    where id = p_license_id
      and email_autorizado = lower(v_email);

  if not found then
    raise exception 'Licencia no encontrada o no autorizado';
  end if;
end;
$$;

grant execute on function set_license_nombre(uuid, text) to authenticated;

-- ─────────────────────────────────────────────
-- 8. Actualizar RLS de licenses
--    Con múltiples licencias por email, la política existente
--    ya devuelve todas las filas del usuario (no necesita cambios).
--    Verificar que sigue siendo correcta:
-- ─────────────────────────────────────────────
-- La política "ver propia licencia" usa:
--   email_autorizado = lower((select email from auth.users where id = auth.uid()))
-- Esto devuelve TODAS las licencias del usuario → correcto para multi-licencia.
