-- ============================================================
-- Migración 023: Notificaciones in-app para participantes
-- Genera notificaciones automáticas vía triggers cuando:
--   - Un partido se desbloquea (is_unlocked: false → true)
--   - Un resultado se ingresa en un partido
--   - Un participante es aprobado (status → 'authorized')
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla notifications
-- ─────────────────────────────────────────────────────────────
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  polla_id   uuid not null references pollas(id) on delete cascade,
  type       text not null,   -- 'match_unlocked' | 'result_entered' | 'approved'
  title      text not null,
  body       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on notifications(user_id, is_read) where is_read = false;

create index if not exists idx_notifications_user_polla
  on notifications(user_id, polla_id, created_at desc);

alter table notifications enable row level security;

create policy "notifications: select own"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications: update own"
  on notifications for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Trigger: partido desbloqueado → notificar participantes autorizados
-- ─────────────────────────────────────────────────────────────
create or replace function notify_match_unlocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_polla_nombre text;
  v_equipo_a text := new.equipo_a;
  v_equipo_b text := new.equipo_b;
begin
  -- Solo disparar cuando is_unlocked cambia de false a true
  if (old.is_unlocked = false and new.is_unlocked = true) then
    select nombre into v_polla_nombre from pollas where id = new.polla_id;

    insert into notifications (user_id, polla_id, type, title, body)
    select
      pp.user_id,
      new.polla_id,
      'match_unlocked',
      '¡Nuevo partido disponible!',
      v_equipo_a || ' vs ' || v_equipo_b || ' — ' || v_polla_nombre
    from polla_participants pp
    where pp.polla_id = new.polla_id
      and pp.status = 'authorized';
  end if;
  return new;
end;
$$;

create trigger trg_notify_match_unlocked
  after update of is_unlocked on matches
  for each row execute function notify_match_unlocked();

-- ─────────────────────────────────────────────────────────────
-- 3. Trigger: resultado ingresado → notificar participantes autorizados
-- ─────────────────────────────────────────────────────────────
create or replace function notify_result_entered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_polla_nombre text;
  v_resultado_label text;
begin
  -- Solo disparar cuando resultado cambia de NULL a un valor
  if (old.resultado is null and new.resultado is not null) then
    select nombre into v_polla_nombre from pollas where id = new.polla_id;

    v_resultado_label := case new.resultado
      when 'A_wins' then 'Ganó ' || new.equipo_a
      when 'B_wins' then 'Ganó ' || new.equipo_b
      when 'draw'   then 'Empate'
      else new.resultado
    end;

    insert into notifications (user_id, polla_id, type, title, body)
    select
      pp.user_id,
      new.polla_id,
      'result_entered',
      'Resultado ingresado',
      new.equipo_a || ' vs ' || new.equipo_b || ': ' || v_resultado_label || ' · ' || v_polla_nombre
    from polla_participants pp
    where pp.polla_id = new.polla_id
      and pp.status = 'authorized';
  end if;
  return new;
end;
$$;

create trigger trg_notify_result_entered
  after update of resultado on matches
  for each row execute function notify_result_entered();

-- ─────────────────────────────────────────────────────────────
-- 4. Trigger: participante aprobado → notificar al participante
-- ─────────────────────────────────────────────────────────────
create or replace function notify_participant_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_polla_nombre text;
begin
  if (old.status is distinct from new.status and new.status = 'authorized') then
    select nombre into v_polla_nombre from pollas where id = new.polla_id;

    insert into notifications (user_id, polla_id, type, title, body)
    values (
      new.user_id,
      new.polla_id,
      'approved',
      '¡Fuiste aprobado!',
      'Ya puedes hacer tus predicciones en ' || v_polla_nombre
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_participant_approved
  after update of status on polla_participants
  for each row execute function notify_participant_approved();

-- ─────────────────────────────────────────────────────────────
-- 5. RPC: marcar notificaciones como leídas (batch)
-- ─────────────────────────────────────────────────────────────
create or replace function mark_notifications_read(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update notifications
  set is_read = true
  where id = any(p_ids)
    and user_id = auth.uid();
end;
$$;

grant execute on function mark_notifications_read(uuid[]) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. Habilitar realtime en notifications
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table notifications;
