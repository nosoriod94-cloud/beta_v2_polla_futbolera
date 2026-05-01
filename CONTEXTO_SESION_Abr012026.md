# Contexto de Sesión — 1 de Abril 2026

## Resumen de lo que se hizo hoy

---

## 1. Subida del proyecto a GitHub

- Se conectó el repositorio local al nuevo repo de GitHub:
  `https://github.com/nosoriod94-cloud/polla-futbolera-v2.0-beta.git`
- Se hizo el primer push exitoso con autenticación via GitHub CLI (`gh auth login`)

---

## 2. Security Review completo — Top 10 fixes implementados

Se hizo un escaneo completo de la app y se implementaron los siguientes cambios:

### Fix 1 — Dependencias con CVEs activos
- `npm audit fix` + `npm install vite@^7`
- Se eliminaron vulnerabilidades: React Router XSS, flatted DoS, minimatch ReDoS, rollup arbitrary file write
- Resultado: **0 vulnerabilidades**

### Fix 2 — Edge Function sin autenticación
- **Archivo:** `supabase/functions/assign-default-predictions/index.ts`
- Se agregó validación de Bearer token con `CRON_SECRET`
- Cualquier POST sin el token ahora recibe 401

### Fix 3 & 5 — VITE_SUPERADMIN_USER_ID eliminado del bundle
- Se eliminó `VITE_SUPERADMIN_USER_ID` de todos los archivos
- Reemplazado por `VITE_SUPERADMIN_EMAIL` en `SuperAdmin.tsx` y `SuperAdminLogin.tsx`
- Los hooks (`usePollas.ts`, `useParticipants.ts`) ahora usan `user.id` del contexto de auth en lugar del env var
- El email del superadmin ya no se renderiza hardcodeado en el DOM — usa `user.email`
- **Archivos modificados:** `src/pages/SuperAdmin.tsx`, `src/pages/SuperAdminLogin.tsx`, `src/hooks/usePollas.ts`, `src/hooks/useParticipants.ts`, `.env.example`

### Fix 4 — Security headers HTTP en Vercel
- **Archivo:** `vercel.json`
- Se agregaron: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`

### Fix 6 — Validación Zod en mutaciones críticas
- **Archivos:** `src/hooks/useMatches.ts`, `src/hooks/useParticipants.ts`, `src/hooks/usePollas.ts`
- Schemas agregados:
  - `JornadaSchema`: nombre, orden, puntosPorAcierto
  - `MatchSchema`: equipoA, equipoB, fechaHora
  - `ResultadoSchema`: enum estricto `['A_wins', 'draw', 'B_wins']`
  - `ApodoSchema`: min 2, max 50, charset permitido
  - `PollaNombreSchema`: min 3, max 100

### Fix 7 & 8 — Política de contraseñas mejorada
- **Archivo:** `src/pages/Auth.tsx`
- Mínimo 8 caracteres (era 6)
- Requiere al menos 1 mayúscula y 1 número
- Validación en frontend con mensajes claros

### Fix 9 — Tabla audit_log con triggers
- **Archivo:** `supabase/migrations/005_audit_log.sql`
- Nueva tabla `audit_log` con RLS (solo acceso via RPC)
- Trigger `trg_log_match_result`: registra cambios de resultado de partidos
- Trigger `trg_log_participant_status`: registra cambios de estado de participantes
- Función `get_audit_log()` para que el superadmin consulte

### Fix 10 — Loop de invite codes con límite
- **Archivo:** `supabase/migrations/006_fix_invite_code_loop.sql`
- Función `generate_invite_code()` reemplazada con máximo 10 intentos
- Lanza excepción si no puede generar un código único

---

## 3. Configuración del .env

Archivo `.env` creado con las siguientes secciones:
```
VITE_SUPABASE_URL=https://snucdscyvtuxyfwkefac.supabase.co
VITE_SUPABASE_ANON_KEY=[key configurada]
VITE_SUPERADMIN_EMAIL=hola@pollafutbolera.online
CRON_SECRET=[valor configurado]
```

---

## 4. Deploy en Vercel

- Repo conectado: `nosoriod94-cloud/polla-futbolera-v2.0-beta`
- Variables de entorno agregadas en Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPERADMIN_EMAIL`
- Primer deploy falló por conflicto vite@8 vs `@vitejs/plugin-react-swc` (soporta hasta v7)
- **Fix:** downgrade a `vite@^7` → deploy exitoso

---

## 5. Migraciones SQL corridas en Supabase

Las migraciones 001 y 002 ya existían de una sesión anterior.
Se corrieron en orden:
- ~~001~~ — ya existía ✓
- ~~002~~ — ya existía ✓
- **003** — corrida hoy ✓ (licencias por email)
- ~~004~~ — ya existía ✓ (business rules)
- **005** — corrida hoy ✓ (audit log)
- **006** — corrida hoy ✓ (fix invite code loop)

---

## 6. Branding actualizado

- **Archivo:** `index.html`
- Título cambiado de "Lovable App" → "Polla Futbolera"
- Todos los meta tags actualizados (og, twitter, description)
- Eliminadas todas las referencias a Lovable
- `lang` cambiado de `en` → `es`
- **Nuevo favicon:** `public/favicon.svg` — balón de fútbol SVG negro y blanco

---

## 7. Configuración de Supabase

Configuraciones realizadas en el dashboard:
- Auth → Rate Limits ajustados (sign ins: 10/hora, sign ups: 5/hora, password reset: 2/hora)
- Auth → Security → Leaked Password Protection activado
- Edge Functions → Manage Secrets → `CRON_SECRET` configurado

---

## 8. Análisis de notificaciones por email (pendiente de decisión)

### Contexto
Hoy el Cliente Admin no recibe ninguna notificación cuando se le otorga una licencia. Debe ser avisado manualmente por el SuperAdmin.

### Recomendaciones definidas

| Notificación | Decisión | Razón |
|---|---|---|
| Email al Cliente Admin al otorgar licencia | ✅ Pendiente implementar | Elimina coordinación manual, bajo volumen |
| Email al participante al registrarse | ❌ No por ahora | Alto volumen, baja necesidad |
| Email al participante al ser aprobado | ❌ No por ahora | La app puede comunicarlo en pantalla |
| Badge pendientes en panel Admin | ✅ Pendiente implementar | Rápido, sin dependencias externas |

### Stack para email (si se implementa)
- **Resend** (resend.com) — gratuito hasta 3.000 emails/mes
- Requiere verificar dominio `pollafutbolera.online` (registros DNS)
- Nueva Edge Function `notify-license-granted`
- Webhook en Supabase → tabla `licenses` → INSERT

---

## Estado actual del proyecto

- ✅ App deployada en Vercel
- ✅ Supabase configurado y migraciones corridas
- ✅ Security hardening completo
- ✅ Branding: "Polla Futbolera" con favicon de balón
- ⏳ Email automático al otorgar licencia — pendiente decisión final
- ⏳ Badge de participantes pendientes en panel Admin — pendiente implementar

---

## Commits del día

1. `af948e5` — Initial commit (sesión anterior)
2. `05a6443` — Security hardening before deploy
3. `bee0736` — Fix: downgrade vite to v7 for plugin-react-swc compatibility
4. `63af21d` — Branding: rename app to Polla Futbolera with soccer ball favicon
