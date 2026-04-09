-- ============================================================
-- Migración 021: Validación server-side con CHECK constraints
-- Complementa la validación Zod del frontend con constraints
-- a nivel de base de datos, imposibles de bypassar desde el cliente.
--
-- Se usa NOT VALID para no bloquear con datos existentes;
-- nuevas filas quedan validadas desde el momento de la migración.
-- Ejecutar VALIDATE CONSTRAINT manualmente si se desea verificar
-- datos históricos (puede ser lento en tablas grandes).
-- ============================================================

-- ── pollas ───────────────────────────────────────────────────
alter table pollas
  add constraint chk_pollas_nombre
    check (char_length(nombre) between 2 and 100) not valid;

-- invite_code: 4-8 chars, solo A-Z y 0-9 (o NULL cuando aún no se ha generado)
alter table pollas
  add constraint chk_pollas_invite_code
    check (invite_code is null or invite_code ~ '^[A-Z0-9]{4,8}$') not valid;

-- ── polla_participants ────────────────────────────────────────
alter table polla_participants
  add constraint chk_participants_apodo
    check (char_length(trim(apodo)) between 2 and 50) not valid;

-- status solo puede ser uno de los tres valores conocidos
alter table polla_participants
  add constraint chk_participants_status
    check (status in ('pending', 'authorized', 'blocked')) not valid;

-- ── jornadas ─────────────────────────────────────────────────
alter table jornadas
  add constraint chk_jornadas_nombre
    check (char_length(nombre) between 1 and 100) not valid;

alter table jornadas
  add constraint chk_jornadas_puntos
    check (puntos_por_acierto between 1 and 50) not valid;

alter table jornadas
  add constraint chk_jornadas_orden
    check (orden between 1 and 100) not valid;

-- ── matches ──────────────────────────────────────────────────
alter table matches
  add constraint chk_matches_equipos
    check (
      char_length(trim(equipo_a)) >= 1 and
      char_length(trim(equipo_b)) >= 1
    ) not valid;

alter table matches
  add constraint chk_matches_resultado
    check (resultado is null or resultado in ('A_wins', 'draw', 'B_wins')) not valid;

-- ── licenses ─────────────────────────────────────────────────
alter table licenses
  add constraint chk_licenses_pollas_limit
    check (pollas_limit between 1 and 100) not valid;
