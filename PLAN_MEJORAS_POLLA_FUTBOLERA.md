# Plan de Mejoras — Polla Futbolera beta_v2
## Documento de trabajo para Claude Code

**Proyecto:** Polla Futbolera (beta_v2_polla_futbolera)
**Repo:** github.com/nosoriod94-cloud/lovable-polla-mundial-osorio
**Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + Supabase
**Deploy:** Vercel
**Objetivo:** Preparar la app para escalar a muchos Cliente Admin y muchos participantes simultáneos antes del Mundial 2026.

---

## Instrucciones para Claude Code

Lee este documento completo antes de empezar. Cada fase tiene tareas numeradas. Ejecuta las fases en orden (1 → 2 → 3 → 4 → 5). Dentro de cada fase, ejecuta las tareas en orden. Después de cada tarea, verifica que la app compila sin errores (`npm run build`). No modifiques archivos que no estén mencionados en la tarea. Cuando una tarea requiera una migración SQL, créala en `supabase/migrations/` con el número consecutivo siguiente al último archivo existente en esa carpeta.

**Convenciones del proyecto:**
- Idioma de la UI: español
- Timezone de referencia: América/Bogotá (UTC-5, sin horario de verano)
- Tipografía display: Bebas Neue. Body: DM Sans
- Paleta: Negro Estadio `#09090F`, Panel Oscuro `#0F1219`, Verde Tech `#22C55E`, Azul Tech `#08B4F8`, Blanco Suave `#E4E9F0`, Gris Muted `#7788A8`, Borde Sutil `#1B2133`
- Componentes UI: shadcn/ui. Iconos: lucide-react
- Validación: Zod. Data fetching: React Query (@tanstack/react-query)
- Mobile-first (375px target)
- Todas las funciones SQL sensibles usan `security definer` con `set search_path = public`

---

## FASE 1: Refactorización de componentes (Frontend)

**Por qué primero:** Los archivos monolíticos actuales hacen imposible trabajar eficientemente en las fases siguientes. Cada cambio futuro será más rápido si los componentes están separados.

### Tarea 1.1 — Extraer sub-componentes de Admin.tsx

**Archivo actual:** `src/pages/Admin.tsx`
**Problema:** Este archivo maneja participantes, jornadas, partidos, resultados, export CSV, import Excel, y UI de solicitud de límite — todo en un solo componente con ~15 variables de estado locales.

**Acción:** Crear la carpeta `src/components/admin/` y extraer estos componentes:

| Nuevo componente | Responsabilidad | Estado que se lleva |
|---|---|---|
| `AdminHeader.tsx` | Botón atrás, nombre de polla, código de invitación con copy | polla, copyPollaId |
| `ParticipantsTab.tsx` | Lista de participantes, aprobar/rechazar/bloquear, solicitud de límite | participants, updateStatus, limitOpen, limitRequest |
| `JornadasTab.tsx` | Lista de jornadas, crear jornada, editar puntos inline | jornadas, jornadaOpen, jornadaNombre, jornadaPuntos, editingJornadaId |
| `MatchesTab.tsx` | Lista de partidos agrupados por jornada, crear/editar/eliminar partido, toggle unlock, ingresar resultado | matches, matchOpen, editMatch, todos los estados de formulario de partido |
| `ImportMatchesDialog.tsx` | Dialog de importación Excel con preview y validación | csvRows, csvFile, importOpen |
| `ExportPredictionsButton.tsx` | Botón de descarga CSV de predicciones | predictionsExport |

**Regla:** El componente padre `Admin.tsx` debe quedar como un shell con Tabs que renderiza los sub-componentes. Los hooks de datos (`useJornadas`, `useMatches`, etc.) pueden quedar en el padre y pasar data via props, o moverse a cada sub-componente — usa tu criterio sobre cuál produce menos re-renders.

**Verificación:** `npm run build` debe pasar. La funcionalidad de cada tab debe ser idéntica a la actual.

---

### Tarea 1.2 — Extraer sub-componentes de ClientAdmin.tsx

**Archivo actual:** `src/pages/ClientAdmin.tsx`
**Problema:** Contiene el componente `LicenseWorkspace` inline (~200 líneas) que maneja la creación de pollas, listing, y compartir código de invitación.

**Acción:** Crear `src/components/client-admin/` y extraer:

| Nuevo componente | Responsabilidad |
|---|---|
| `LicenseCard.tsx` | Card de una licencia con nombre, estado, acciones |
| `LicenseWorkspace.tsx` | Mover el componente inline a su propio archivo |
| `CreatePollaDialog.tsx` | Dialog para crear nueva polla |
| `PollaCard.tsx` | Card de polla creada con código, share, y navegación a admin |

**Verificación:** Misma funcionalidad, `npm run build` pasa.

---

### Tarea 1.3 — Extraer sub-componentes de Home.tsx

**Archivo actual:** `src/pages/Home.tsx`
**Problema:** Contiene componentes inline (`AdminPollaCard`, `ParticipantPollaCard`) y el formulario completo de "Unirme a polla" con lógica de búsqueda por invite_code y validación de apodo.

**Acción:** Crear `src/components/home/` y extraer:

| Nuevo componente | Responsabilidad |
|---|---|
| `AdminPollaCard.tsx` | Card de polla como admin |
| `ParticipantPollaCard.tsx` | Card de polla como participante |
| `JoinPollaDialog.tsx` | Dialog completo de unirse a polla (búsqueda por código, validación de apodo, submit) |

**Verificación:** Misma funcionalidad, `npm run build` pasa.

---

### Tarea 1.4 — Extraer componente PredictionToggle de Predicciones.tsx

**Archivo actual:** `src/pages/Predicciones.tsx`
**Problema:** Contiene el componente `PredictionToggle` inline (~120 líneas) con la configuración de colores `PICK_CONFIG` y toda la lógica de animación de selección.

**Acción:** Crear `src/components/predictions/PredictionToggle.tsx`. Mover `PICK_CONFIG` y el componente. Exportar el componente como default.

**Verificación:** Misma funcionalidad visual y de interacción, `npm run build` pasa.

---

### Tarea 1.5 — Lazy loading de rutas

**Archivo actual:** `src/App.tsx`
**Problema:** Todas las páginas se importan estáticamente. El bundle inicial carga todo aunque el usuario solo necesite la página de auth.

**Acción:**
1. Convertir todos los imports de páginas a `React.lazy()`:
```tsx
const Auth = lazy(() => import('./pages/Auth'))
const Home = lazy(() => import('./pages/Home'))
const Admin = lazy(() => import('./pages/Admin'))
// ... etc para todas las páginas
```
2. Envolver `<Routes>` en `<Suspense fallback={<LoadingScreen />}>` donde `LoadingScreen` es un componente simple con el logo de Polla Futbolera centrado y un spinner sutil (usar el verde tech `#22C55E`).
3. Crear `src/components/LoadingScreen.tsx` con diseño dark-theme coherente con la marca.

**Verificación:** La app debe cargar correctamente y mostrar el loading screen brevemente en navegación entre rutas. `npm run build` debe mostrar chunks separados en la salida.

---

### Tarea 1.6 — Error Boundary global

**Problema:** No hay manejo de errores a nivel de React. Si un componente falla, toda la app muestra pantalla blanca.

**Acción:**
1. Crear `src/components/ErrorBoundary.tsx` como class component que implemente `componentDidCatch`.
2. La UI del error debe mostrar:
   - Un icono de alerta (lucide `AlertTriangle`)
   - Mensaje: "Algo salió mal"
   - Submensaje: "Intenta recargar la página"
   - Botón "Recargar" que ejecute `window.location.reload()`
   - Fondo dark coherente con la marca
3. Envolver el `<BrowserRouter>` en App.tsx con este `<ErrorBoundary>`.
4. Adicionalmente, envolver cada ruta protegida individualmente con `<ErrorBoundary>` para que un error en una página no mate las otras.

**Verificación:** `npm run build` pasa. Si agregas temporalmente un `throw new Error('test')` en cualquier página, debe mostrarse el boundary en vez de pantalla blanca.

---

## FASE 2: Optimización de base de datos y performance (Backend)

**Por qué segundo:** Las queries lentas y el polling excesivo son los primeros cuellos de botella al escalar.

### Tarea 2.1 — Índices de performance

**Acción:** Crear una nueva migración SQL con estos índices:

```sql
-- Índices para acelerar standings_view (la query más pesada)
create index if not exists idx_predictions_participant_id on predictions(participant_id);
create index if not exists idx_predictions_match_id on predictions(match_id);
create index if not exists idx_predictions_polla_id on predictions(polla_id);
create index if not exists idx_matches_jornada_id on matches(jornada_id);
create index if not exists idx_matches_polla_id_fecha on matches(polla_id, fecha_hora);
create index if not exists idx_polla_participants_polla_status on polla_participants(polla_id, status);
create index if not exists idx_polla_participants_user_id on polla_participants(user_id);
create index if not exists idx_jornadas_polla_id on jornadas(polla_id);

-- Índices para búsquedas de licencia
create index if not exists idx_licenses_user_id on licenses(user_id);

-- Índice para pollas por admin
create index if not exists idx_pollas_admin_user_id on pollas(admin_user_id);
```

**Nota:** Verifica primero si alguno de estos índices ya existe en las migraciones actuales (001-016). Solo agrega los que falten. Algunos pueden existir implícitamente por constraints UNIQUE o FOREIGN KEY, pero esos no cubren las queries de JOIN de `standings_view`.

**Verificación:** La migración debe poder ejecutarse sin errores en Supabase SQL Editor. Los `if not exists` protegen contra duplicados.

---

### Tarea 2.2 — Reemplazar polling de standings con Supabase Realtime

**Archivo actual:** `src/hooks/useStandings.ts`
**Problema:** Usa `refetchInterval: 30_000` (polling cada 30 segundos). Con N pollas × M participantes, esto genera demasiadas queries repetitivas a `standings_view`.

**Acción:**
1. Mantener el `useQuery` para la carga inicial.
2. Agregar un `useEffect` que suscriba a cambios en la tabla `predictions` filtrado por `polla_id` usando `supabase.channel()`:
```tsx
useEffect(() => {
  if (!pollaId) return
  const channel = supabase
    .channel(`standings-${pollaId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'predictions',
      filter: `polla_id=eq.${pollaId}`,
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['standings', pollaId] })
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'matches',
      filter: `polla_id=eq.${pollaId}`,
    }, () => {
      queryClient.invalidateQueries({ queryKey: ['standings', pollaId] })
    })
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [pollaId])
```
3. Remover el `refetchInterval: 30_000`.
4. Dejar un `staleTime: 60_000` para que no refetch en cada re-mount.

**Importante:** Supabase Realtime requiere que las tablas tengan la replicación habilitada. Agregar al final de la migración de índices (tarea 2.1):
```sql
-- Habilitar realtime para las tablas que lo necesitan
alter publication supabase_realtime add table predictions;
alter publication supabase_realtime add table matches;
```

**Verificación:** Abrir la app en dos tabs. En una, ingresar un resultado como admin. En la otra (como participante), la tabla de posiciones debe actualizarse automáticamente sin refresh.

---

### Tarea 2.3 — Paginación en Transparencia

**Archivo actual:** `src/pages/Transparencia.tsx`
**Problema:** Carga TODAS las predicciones de TODOS los participantes de una vez. Con 50 participantes × 64 partidos = 3,200 filas renderizadas simultáneamente.

**Acción:**
1. Agregar un selector de jornada (dropdown o tabs) en la parte superior de Transparencia.
2. Por defecto, mostrar solo la jornada activa (la que tiene partidos próximos o en curso).
3. Filtrar las predicciones por `jornada_id` antes de renderizar.
4. En `usePredictions`, el parámetro `jornadaId` ya existe pero no se usa en Transparencia — activarlo.
5. Agregar un indicador de "jornada seleccionada" visual coherente con el diseño.

**Verificación:** La página debe cargar significativamente más rápido. Solo debe mostrar predicciones de la jornada seleccionada.

---

### Tarea 2.4 — Materializar standings_view como tabla cacheable

**Problema:** `standings_view` es una vista que ejecuta JOINs de 4 tablas con GROUP BY cada vez que se consulta. A escala, esto es lento.

**Acción:** Crear una migración que:
1. Cree una tabla `standings_cache`:
```sql
create table if not exists standings_cache (
  polla_id uuid not null references pollas(id) on delete cascade,
  participant_id uuid not null references polla_participants(id) on delete cascade,
  apodo text not null,
  puntos_totales integer not null default 0,
  total_predicciones integer not null default 0,
  aciertos integer not null default 0,
  predicciones_default integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (polla_id, participant_id)
);

alter table standings_cache enable row level security;

-- Mismas policies que standings_view: lectura para admin y participantes autorizados
create policy "standings_cache: select" on standings_cache
  for select using (
    exists (
      select 1 from pollas where id = polla_id and admin_user_id = auth.uid()
    )
    or is_authorized_participant(polla_id)
  );
```

2. Cree una función `refresh_standings(p_polla_id uuid)` que haga UPSERT desde la lógica de la vista actual:
```sql
create or replace function refresh_standings(p_polla_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into standings_cache (polla_id, participant_id, apodo, puntos_totales, total_predicciones, aciertos, predicciones_default, updated_at)
  select
    pp.polla_id,
    pp.id,
    pp.apodo,
    coalesce(sum(case when pred.pick::text = m.resultado::text then j.puntos_por_acierto else 0 end), 0),
    count(pred.id),
    count(case when pred.pick::text = m.resultado::text then 1 end),
    count(case when pred.is_default = true then 1 end),
    now()
  from polla_participants pp
  left join predictions pred on pred.participant_id = pp.id
  left join matches m on m.id = pred.match_id and m.resultado is not null
  left join jornadas j on j.id = m.jornada_id
  where pp.status = 'authorized' and pp.polla_id = p_polla_id
  group by pp.polla_id, pp.id, pp.apodo
  on conflict (polla_id, participant_id)
  do update set
    apodo = excluded.apodo,
    puntos_totales = excluded.puntos_totales,
    total_predicciones = excluded.total_predicciones,
    aciertos = excluded.aciertos,
    predicciones_default = excluded.predicciones_default,
    updated_at = now();
end;
$$;
```

3. Cree un trigger que llame `refresh_standings` cuando un admin ingresa un resultado:
```sql
create or replace function trigger_refresh_standings()
returns trigger language plpgsql security definer as $$
begin
  if old.resultado is distinct from new.resultado then
    perform refresh_standings(new.polla_id);
  end if;
  return new;
end;
$$;

create trigger trg_refresh_standings
  after update of resultado on matches
  for each row execute function trigger_refresh_standings();
```

4. Actualizar `useStandings.ts` para consultar `standings_cache` en vez de `standings_view`.

**Verificación:** Los standings deben cargarse correctamente y actualizarse cuando el admin ingresa un resultado. El query a `standings_cache` debe ser un simple SELECT sin JOINs.

---

### Tarea 2.5 — Robustez del Edge Function de predicciones default

**Archivo actual:** `supabase/functions/assign-default-predictions/index.ts`
**Problema:** La ventana de 1-2 minutos para detectar partidos cerrados es frágil. Si el cron falla una vez, se pierden predicciones default.

**Acción:**
1. Ampliar la ventana de detección de 2 minutos a 10 minutos.
2. Agregar un campo `defaults_assigned boolean default false` a la tabla `matches` (nueva migración).
3. Cambiar la lógica del Edge Function para:
   - Buscar partidos con `is_unlocked = true AND fecha_hora <= now() - interval '1 minute' AND defaults_assigned = false`
   - Después de asignar defaults, marcar `defaults_assigned = true` en el match
   - Esto hace la operación idempotente — puede ejecutarse múltiples veces sin duplicar
4. Agregar logging: al final, insertar en `audit_log` un registro con `action = 'assign_defaults'` y detalles del número de predicciones asignadas.

**Verificación:** Ejecutar la Edge Function manualmente dos veces seguidas — la segunda vez debe reportar `inserted: 0` porque los matches ya tienen `defaults_assigned = true`.

---

## FASE 3: Mejoras de UX para el Cliente Admin

**Por qué tercero:** El Cliente Admin (el que paga la licencia) es el usuario más importante del negocio. Su experiencia determina si recomienda el producto.

### Tarea 3.1 — Seed de partidos del Mundial 2026

**Problema:** Actualmente el admin debe crear cada partido manualmente o importar por Excel. Para el Mundial con 48 equipos y 72 partidos de fase de grupos, esto es tedioso y propenso a errores.

**Acción:**
1. Crear `src/data/worldcup2026.ts` con la data del Mundial FIFA 2026:
   - Los 48 equipos con nombre, código ISO, y emoji de bandera
   - Los 12 grupos (A-L) con sus 4 equipos
   - Los 72 partidos de fase de grupos con: equipos, fecha/hora UTC, estadio
   - Obtener fechas y sedes oficiales de la FIFA (buscar en web si es necesario, o usar placeholder razonables: 11 junio - 19 julio 2026, sedes en USA/México/Canadá)
2. Crear un botón en el panel Admin: **"Cargar partidos del Mundial 2026"** que:
   - Cree automáticamente las jornadas ("Grupo A - Jornada 1", "Grupo A - Jornada 2", etc.)
   - Cree todos los partidos con equipos, fecha/hora y estadio
   - Solo aparezca si la polla no tiene partidos creados aún
   - Muestre un dialog de confirmación: "Esto creará 72 partidos del Mundial 2026. ¿Continuar?"
   - Muestre progreso durante la carga
3. Crear la función como un RPC de Supabase (`seed_worldcup_2026(p_polla_id uuid)`) que reciba el polla_id y haga el insert masivo en una transacción.

**Verificación:** Crear una polla de prueba, presionar el botón, y verificar que las 3 jornadas de grupo y los 72 partidos aparezcan correctamente con banderas y fechas.

---

### Tarea 3.2 — Desbloqueo masivo de partidos

**Problema actual:** El admin debe desbloquear cada partido individualmente (toggle `is_unlocked`). Con 72 partidos, esto es 72 clicks.

**Acción:**
1. Agregar un botón "Desbloquear todos" en la sección de partidos del Admin, por jornada.
2. Agregar un botón "Desbloquear jornada completa" que desbloquee todos los partidos de esa jornada.
3. Implementar como una mutación batch:
```tsx
const { mutateAsync } = useMutation({
  mutationFn: async ({ pollaId, jornadaId }: { pollaId: string; jornadaId: string }) => {
    const { error } = await supabase
      .from('matches')
      .update({ is_unlocked: true })
      .eq('polla_id', pollaId)
      .eq('jornada_id', jornadaId)
    if (error) throw error
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches', pollaId] })
})
```
4. Agregar confirmación antes de ejecutar: "¿Desbloquear los X partidos de esta jornada?"

**Verificación:** Crear una jornada con 6 partidos bloqueados. Presionar "Desbloquear jornada". Los 6 deben quedar desbloqueados.

---

### Tarea 3.3 — Ingreso masivo de resultados

**Problema:** El admin ingresa resultados uno por uno con un dropdown por partido. Con muchos partidos en un mismo día del Mundial, esto es lento.

**Acción:**
1. Crear un componente `BatchResultsDialog.tsx` que muestre todos los partidos de una jornada que ya se jugaron (fecha_hora < now) y no tienen resultado.
2. UI: Lista de partidos con 3 botones por partido (Gana A / Empate / Gana B), similar al PredictionToggle pero para el admin.
3. Botón "Guardar todos los resultados" que haga updates en batch.
4. Mostrar confirmación antes de guardar: "Vas a ingresar resultados para X partidos. Esto actualizará automáticamente la tabla de posiciones."

**Verificación:** Crear 6 partidos con fecha pasada y sin resultado. Abrir el dialog, seleccionar resultados para los 6, guardar. Verificar que standings se actualizan.

---

### Tarea 3.4 — Personalización del invite code

**Problema:** El invite code se genera automáticamente. El admin no puede personalizarlo (ejemplo: "OSORIO26", "MIEMPRESA").

**Acción:**
1. Agregar un campo editable en el panel Admin para modificar el `invite_code` de la polla.
2. Validar: solo letras y números, longitud 4-8 caracteres, convertir a mayúsculas.
3. Verificar unicidad via RPC (crear `check_invite_code_available(p_code text)` en SQL).
4. UI: Mostrar el código actual con un icono de lápiz para editar inline.

**Verificación:** Cambiar el código a uno personalizado. Verificar que un participante puede unirse con el nuevo código.

---

### Tarea 3.5 — Onboarding del Cliente Admin

**Problema:** Cuando un Cliente Admin entra por primera vez, ve una pantalla vacía sin guía. No sabe qué hacer.

**Acción:**
1. Crear `src/components/client-admin/OnboardingChecklist.tsx`.
2. Mostrar un checklist visual cuando la licencia no tiene pollas creadas:
   - ✅ Cuenta creada
   - ⬜ Nombrar tu licencia (el campo que ya existe)
   - ⬜ Crear tu primera polla
   - ⬜ Personalizar el código de invitación
   - ⬜ Cargar los partidos (manual o Mundial 2026)
   - ⬜ Desbloquear partidos para predicciones
   - ⬜ Compartir el código con participantes
3. Cada paso completado se marca automáticamente basado en el estado real de la polla.
4. Diseño: Card tipo progress tracker con la paleta dark de la marca. Línea de progreso verde tech.
5. Ocultar el checklist cuando todos los pasos estén completos.

**Verificación:** Crear una licencia nueva. Verificar que el checklist aparece. Completar cada paso y verificar que se marca.

---

## FASE 4: Seguridad y estabilidad para producción

**Por qué cuarto:** Antes de ir a producción con múltiples clientes, hay gaps de seguridad y estabilidad que cerrar.

### Tarea 4.1 — Rate limiting en RPCs sensibles

**Problema:** Las funciones `join_polla_by_invite_code`, `check_apodo_available`, y `get_polla_by_invite_code` no tienen rate limiting. Un atacante podría hacer brute force de códigos de invitación.

**Acción:** Crear una migración con una función de rate limiting genérica:
```sql
-- Tabla de rate limiting
create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 1,
  primary key (key, window_start)
);

-- Función helper
create or replace function check_rate_limit(p_key text, p_max_requests integer, p_window_minutes integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  -- Limpiar ventanas viejas
  delete from rate_limits where window_start < now() - (p_window_minutes || ' minutes')::interval;
  
  -- Contar requests en la ventana actual
  select coalesce(sum(request_count), 0) into v_count
  from rate_limits
  where key = p_key
    and window_start > now() - (p_window_minutes || ' minutes')::interval;
  
  if v_count >= p_max_requests then
    return false; -- Rate limited
  end if;
  
  -- Registrar este request
  insert into rate_limits (key, request_count)
  values (p_key, 1)
  on conflict (key, window_start) do update set request_count = rate_limits.request_count + 1;
  
  return true;
end;
$$;
```

Luego modificar `join_polla_by_invite_code` para verificar:
```sql
if not check_rate_limit('join:' || auth.uid()::text, 10, 5) then
  raise exception 'Demasiados intentos. Espera unos minutos.';
end if;
```

Hacer lo mismo para `get_polla_by_invite_code` (límite: 20 requests por 5 minutos por usuario).

**Verificación:** Llamar a la función más de 10 veces rápidamente. Debe retornar error de rate limit.

---

### Tarea 4.2 — Validación de inputs en el servidor

**Problema:** La validación con Zod en los hooks es client-side solamente. Un atacante podría llamar directamente a Supabase y bypasear las validaciones.

**Acción:** Crear una migración con CHECK constraints en las tablas:

```sql
-- Validar longitud de nombres
alter table pollas add constraint chk_pollas_nombre check (char_length(nombre) between 2 and 100);
alter table polla_participants add constraint chk_participants_apodo check (char_length(trim(apodo)) between 2 and 30);
alter table jornadas add constraint chk_jornadas_nombre check (char_length(nombre) between 1 and 100);
alter table jornadas add constraint chk_jornadas_puntos check (puntos_por_acierto between 1 and 50);
alter table jornadas add constraint chk_jornadas_orden check (orden between 1 and 100);
alter table matches add constraint chk_matches_equipos check (char_length(equipo_a) >= 1 and char_length(equipo_b) >= 1);

-- Prevenir inyección en invite_code
alter table pollas add constraint chk_pollas_invite_code check (invite_code ~ '^[A-Z0-9]{4,8}$');
```

**Nota:** Antes de agregar cada constraint, verifica que los datos existentes la cumplan. Si hay datos que la violan, corrígelos primero con un UPDATE.

**Verificación:** Intentar insertar un apodo de 1 carácter directamente via Supabase client. Debe fallar con error de constraint.

---

### Tarea 4.3 — Manejo de sesión expirada

**Archivo actual:** `src/context/AuthContext.tsx`
**Problema:** Si el token JWT de Supabase expira mientras el usuario está usando la app, las queries empiezan a fallar silenciosamente.

**Acción:**
1. En `AuthContext.tsx`, escuchar el evento `TOKEN_REFRESHED` y `SIGNED_OUT` de `onAuthStateChange`.
2. Si el evento es `SIGNED_OUT` inesperado (no iniciado por el usuario), mostrar un toast: "Tu sesión expiró. Por favor inicia sesión de nuevo." y redirigir a `/auth`.
3. Agregar un interceptor global en las queries de React Query para detectar errores 401/403 de Supabase y disparar el flujo de re-login:
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: (failureCount, error) => {
        // No reintentar si es error de auth
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          return false
        }
        return failureCount < 1
      },
    },
  },
})
```

**Verificación:** En Supabase Dashboard, revocar la sesión de un usuario de prueba. La app debe redirigir al login con un mensaje claro.

---

### Tarea 4.4 — Headers de seguridad en Vercel

**Problema:** El deploy en Vercel no tiene headers de seguridad configurados.

**Acción:** Crear o actualizar `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Verificación:** Después del deploy, verificar los headers en las DevTools del browser (Network tab → Response Headers).

---

### Tarea 4.5 — Variables de entorno: eliminar VITE_SUPERADMIN_USER_ID del frontend

**Problema:** El UUID del superadmin está expuesto en el bundle del frontend via `VITE_SUPERADMIN_USER_ID`. Cualquiera que inspeccione el JS puede ver quién es el superadmin.

**Acción:**
1. Mover la validación de superadmin al servidor. Crear una función RPC:
```sql
create or replace function is_superadmin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from superadmin_list where user_id = auth.uid()
  );
$$;
```
2. Crear tabla `superadmin_list` con RLS que solo permite SELECT a los propios superadmin (o sin RLS con función security definer).
3. En el frontend, reemplazar las comparaciones contra `VITE_SUPERADMIN_USER_ID` por llamadas a `is_superadmin()`.
4. Remover `VITE_SUPERADMIN_USER_ID` del `.env` y `.env.example`.

**Nota:** También mover `VITE_SUPERADMIN_EMAIL` al servidor por la misma razón.

**Verificación:** Hacer build. Buscar el UUID del superadmin en los archivos de dist — no debe aparecer.

---

## FASE 5: Mejoras de UX para participantes y polish final

**Por qué último:** Estas mejoras hacen la app más atractiva pero no son bloqueantes para escalar. Son el polish que diferencia una app beta de una app de producción.

### Tarea 5.1 — Skeleton loading screens

**Problema:** Las páginas muestran solo un spinner o nada mientras cargan datos. Esto se siente lento y poco profesional.

**Acción:** Crear componentes skeleton para las páginas principales:
1. `src/components/skeletons/StandingsSkeleton.tsx` — Simula la tabla de posiciones con rectángulos animados
2. `src/components/skeletons/PredictionsSkeleton.tsx` — Simula la lista de partidos con cards fantasma
3. `src/components/skeletons/HomeSkeleton.tsx` — Simula las cards de pollas

**Diseño:** Usar la clase `animate-pulse` de Tailwind con el color `bg-muted/40` sobre fondo dark. Las formas deben simular la estructura real del contenido (ancho de nombre, badges, scores).

Reemplazar los indicadores de carga actuales (`isLoading && <div>...`) con estos skeletons en las páginas correspondientes.

**Verificación:** Simular latencia de red con las DevTools (Network → Slow 3G). Los skeletons deben aparecer brevemente antes del contenido real.

---

### Tarea 5.2 — Notificaciones in-app para participantes

**Problema:** Los participantes no saben cuándo hay partidos nuevos desbloqueados, cuándo el admin ingresó resultados, ni cuándo se acerca el deadline de un partido.

**Acción:**
1. Crear tabla `notifications`:
```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  polla_id uuid not null references pollas(id) on delete cascade,
  type text not null, -- 'match_unlocked', 'result_entered', 'deadline_approaching', 'approved'
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on notifications(user_id, is_read) where is_read = false;
alter table notifications enable row level security;
create policy "notifications: select own" on notifications for select using (auth.uid() = user_id);
create policy "notifications: update own" on notifications for update using (auth.uid() = user_id);
```
2. Crear triggers que generen notificaciones automáticas:
   - Cuando un match se desbloquea → notificar a todos los participantes autorizados de esa polla
   - Cuando un resultado se ingresa → notificar a todos los participantes
   - Cuando un participante es aprobado → notificar a ese participante
3. Crear `src/hooks/useNotifications.ts` con query para notificaciones no leídas.
4. Crear `src/components/NotificationBell.tsx` con badge de contador en el AppLayout.
5. Crear `src/components/NotificationDrawer.tsx` como slide-over con la lista de notificaciones.

**Verificación:** Desbloquear un partido como admin. Verificar que aparece una notificación para el participante.

---

### Tarea 5.3 — Countdown timer en predicciones

**Problema:** Los participantes no tienen visibilidad clara de cuánto tiempo les queda para predecir un partido.

**Acción:**
1. Crear `src/components/predictions/CountdownTimer.tsx`.
2. Para partidos desbloqueados que aún no se juegan, mostrar un countdown: "Cierra en 2h 15m" o "Cierra en 45s".
3. Usar colores:
   - Verde tech si faltan > 1 hora
   - Amarillo (`amber-500`) si faltan < 1 hora
   - Rojo (`red-500`) si faltan < 5 minutos
   - Parpadeo si faltan < 1 minuto
4. Actualizar cada segundo usando `setInterval`.
5. Integrar en cada MatchCard en la página de Predicciones.

**Verificación:** Crear un partido con fecha_hora en 10 minutos. Verificar que el countdown aparece, cambia de color, y parpadea en el último minuto.

---

### Tarea 5.4 — Share mejorado para WhatsApp

**Problema:** El botón de compartir código de invitación usa `navigator.share` genérico o copia texto plano. Para el mercado colombiano, el canal principal es WhatsApp.

**Acción:**
1. En todos los puntos donde se comparte el código de invitación (AdminHeader, ClientAdmin, PollaCard), agregar un botón específico de WhatsApp.
2. Usar el deep link de WhatsApp: `https://wa.me/?text=ENCODED_TEXT`
3. El texto debe ser:
```
⚽ ¡Únete a mi polla del Mundial!

📱 Entra a app.pollafutbolera.online/auth
📝 Regístrate con tu email
🔑 Usa el código: {INVITE_CODE}

¡A competir! 🏆
```
4. En mobile, abrir el link de WhatsApp. En desktop, abrir WhatsApp Web.
5. Agregar icono de WhatsApp (crear un simple SVG icon component o usar un ícono de lucide-react si existe algo similar, si no, crear `src/components/icons/WhatsAppIcon.tsx`).

**Verificación:** Presionar el botón de WhatsApp. Debe abrir WhatsApp con el mensaje pre-formateado con el código correcto.

---

### Tarea 5.5 — PWA básica (Progressive Web App)

**Problema:** Los participantes deben abrir el browser cada vez. No hay icono en el home screen ni funciona offline.

**Acción:**
1. Crear `public/manifest.json`:
```json
{
  "name": "Polla Futbolera",
  "short_name": "Polla",
  "description": "Predicciones del Mundial FIFA 2026",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#09090F",
  "theme_color": "#22C55E",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
2. Agregar `<link rel="manifest" href="/manifest.json">` en `index.html`.
3. Agregar meta tags para iOS:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#09090F">
```
4. Crear los iconos (192x192 y 512x512) usando el favicon.svg existente — generar PNGs con sharp o canvas.
5. No implementar service worker completo por ahora — solo el manifest para que sea instalable.

**Verificación:** Abrir la app en Chrome mobile. Debe aparecer el prompt "Agregar a pantalla de inicio". Al instalar, debe abrir como app standalone con el theme color correcto.

---

### Tarea 5.6 — Meta tags y Open Graph para compartir

**Archivo actual:** `index.html`
**Problema:** Los meta tags de OG son genéricos. Cuando se comparte el link de la app en WhatsApp o redes sociales, no muestra una preview atractiva.

**Acción:**
1. Actualizar los meta tags en `index.html`:
```html
<meta property="og:title" content="Polla Futbolera — Organiza la polla del Mundial 2026" />
<meta property="og:description" content="Crea tu polla del Mundial FIFA 2026 en 5 minutos. Invita a familia y amigos, hagan sus predicciones y que gane el que más sabe de fútbol." />
<meta property="og:image" content="https://app.pollafutbolera.online/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://app.pollafutbolera.online" />
<meta property="og:locale" content="es_CO" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Polla Futbolera — Mundial 2026" />
<meta name="twitter:description" content="Crea tu polla del Mundial FIFA 2026 en 5 minutos." />
<meta name="twitter:image" content="https://app.pollafutbolera.online/og-image.png" />
```
2. Crear la imagen OG (`public/og-image.png`, 1200x630px) con:
   - Fondo negro estadio con gradiente sutil
   - Logo/texto "Polla Futbolera" en Bebas Neue
   - Subtítulo "Mundial FIFA 2026"
   - Balón de fútbol como elemento decorativo
   - Colores verde tech y azul tech

**Verificación:** Usar el [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) o [WhatsApp link preview] para verificar que la preview se muestra correctamente.

---

## Resumen de prioridades

| Fase | Descripción | Impacto | Esfuerzo |
|------|-------------|---------|----------|
| 1 | Refactorización frontend | Habilita todo lo demás | Medio |
| 2 | Optimización DB y performance | Crítico para escalar | Alto |
| 3 | UX del Cliente Admin | Crítico para el negocio | Medio |
| 4 | Seguridad y estabilidad | Necesario para producción | Medio |
| 5 | Polish y UX participantes | Diferenciador competitivo | Medio-Alto |

**Tiempo estimado total:** 5-8 sesiones de trabajo intenso con Claude Code.

---

## Notas para Claude Code

- No modifiques la paleta de colores ni la tipografía — están definidas en LOVABLE_DESIGN_GUIDELINES.md y no cambian.
- No toques el flujo de auth existente (email + contraseña + magic link) — funciona bien.
- No muevas el proyecto fuera de Vercel ni cambies el backend de Supabase.
- Mantén la convención de nombres en español para tablas, columnas, y UI.
- Cada migración SQL nueva debe ser un archivo separado con número consecutivo.
- Cuando crees componentes nuevos, sigue el patrón existente: hooks de React Query para data, shadcn/ui para componentes, Tailwind para estilos.
- Haz `npm run build` después de cada tarea para verificar que compila.
