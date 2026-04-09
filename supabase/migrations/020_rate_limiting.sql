-- ============================================================
-- Migración 020: Rate limiting para RPCs sensibles
-- Protege join_polla_by_invite_code y get_polla_by_invite_code
-- contra brute force de códigos de invitación.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla de rate limiting (sliding window por usuario+acción)
-- ─────────────────────────────────────────────────────────────
create table if not exists rate_limits (
  id         bigserial   primary key,
  key        text        not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_key_created
  on rate_limits(key, created_at);

-- Deshabilitar RLS — acceso solo via security definer functions
alter table rate_limits enable row level security;
-- Sin policies de acceso directo; solo las funciones security definer llegan aquí.

-- ─────────────────────────────────────────────────────────────
-- 2. Función check_rate_limit
--    Devuelve true si la request está permitida; false si excede el límite.
--    p_key           : clave única por usuario+acción, ej: 'join:user-uuid'
--    p_max_requests  : máximo de requests permitidos en la ventana
--    p_window_minutes: duración de la ventana en minutos
-- ─────────────────────────────────────────────────────────────
create or replace function check_rate_limit(
  p_key            text,
  p_max_requests   integer,
  p_window_minutes integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_cutoff timestamptz;
begin
  v_cutoff := now() - (p_window_minutes || ' minutes')::interval;

  -- Limpiar entradas antiguas de este key (evita acumulación indefinida)
  delete from rate_limits
  where key = p_key
    and created_at < v_cutoff;

  -- Contar requests en la ventana actual
  select count(*) into v_count
  from rate_limits
  where key = p_key
    and created_at >= v_cutoff;

  if v_count >= p_max_requests then
    return false;  -- Rate limitado
  end if;

  -- Registrar este request
  insert into rate_limits (key) values (p_key);

  return true;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Actualizar join_polla_by_invite_code con rate limiting
--    Límite: 10 intentos por usuario en 5 minutos
-- ─────────────────────────────────────────────────────────────
create or replace function join_polla_by_invite_code(
  p_invite_code text,
  p_apodo       text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_polla_id uuid;
  v_user_id  uuid;
  v_result   json;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  -- Rate limiting: máximo 10 intentos en 5 minutos por usuario
  if not check_rate_limit('join:' || v_user_id::text, 10, 5) then
    raise exception 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
  end if;

  -- Buscar polla activa por invite_code (bypassa RLS)
  select id into v_polla_id
  from pollas
  where upper(invite_code) = upper(p_invite_code)
    and is_active = true
  limit 1;

  if v_polla_id is null then
    raise exception 'Código de invitación inválido o polla inactiva';
  end if;

  -- Validar apodo
  if length(trim(p_apodo)) < 2 then
    raise exception 'El apodo debe tener al menos 2 caracteres';
  end if;

  -- Verificar que el apodo no esté tomado en esta polla
  if exists (
    select 1 from polla_participants
    where polla_id = v_polla_id
      and lower(apodo) = lower(trim(p_apodo))
  ) then
    raise exception 'El apodo ya está en uso en esta polla';
  end if;

  -- Verificar que el usuario no esté ya registrado
  if exists (
    select 1 from polla_participants
    where polla_id = v_polla_id
      and user_id = v_user_id
  ) then
    raise exception 'Ya estás registrado en esta polla';
  end if;

  -- Insertar participante como pending
  insert into polla_participants (polla_id, user_id, apodo, status)
  values (v_polla_id, v_user_id, trim(p_apodo), 'pending')
  returning to_json(polla_participants.*) into v_result;

  return v_result;
end;
$$;

grant execute on function join_polla_by_invite_code(text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Actualizar get_polla_by_invite_code con rate limiting
--    Cambiar de sql a plpgsql para poder llamar check_rate_limit.
--    Límite: 20 búsquedas por usuario en 5 minutos
-- ─────────────────────────────────────────────────────────────
create or replace function get_polla_by_invite_code(p_invite_code text)
returns table (id uuid, nombre text, is_active boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  -- Rate limiting: máximo 20 búsquedas en 5 minutos por usuario
  if not check_rate_limit('lookup:' || v_user_id::text, 20, 5) then
    raise exception 'Demasiadas búsquedas. Espera unos minutos.';
  end if;

  return query
    select p.id, p.nombre, p.is_active
    from pollas p
    where upper(p.invite_code) = upper(p_invite_code)
      and p.is_active = true
    limit 1;
end;
$$;

grant execute on function get_polla_by_invite_code(text) to authenticated;
