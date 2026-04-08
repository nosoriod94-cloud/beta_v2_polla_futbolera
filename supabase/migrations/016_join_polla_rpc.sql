-- ============================================================
-- Migración 016: RPC para buscar polla e inscribirse via invite_code
-- ============================================================
-- Problema: la política SELECT en 'pollas' (migración 014) solo permite
-- ver pollas si el usuario ya es admin o participante autorizado.
-- Un usuario nuevo no puede buscar la polla por invite_code con un
-- SELECT directo → el INSERT en polla_participants falla con RLS.
--
-- Solución: funciones security definer que bypassan RLS del dueño.
-- Patrón ya usado en: is_authorized_participant, check_apodo_available, etc.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. get_polla_by_invite_code
--    Busca una polla activa por su código de invitación.
--    Bypassa RLS para permitir el lookup sin ser participante.
-- ─────────────────────────────────────────────────────────────
create or replace function get_polla_by_invite_code(p_invite_code text)
returns table (id uuid, nombre text, is_active boolean)
language sql
security definer
stable
set search_path = public
as $$
  select id, nombre, is_active
  from pollas
  where upper(invite_code) = upper(p_invite_code)
    and is_active = true
  limit 1;
$$;

grant execute on function get_polla_by_invite_code(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. join_polla_by_invite_code
--    Operación atómica: busca la polla, valida el apodo,
--    verifica que el usuario no esté ya inscrito, e inserta
--    el participante como 'pending'.
--    Retorna la fila insertada como JSON.
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
