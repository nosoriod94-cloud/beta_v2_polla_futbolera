# Polla Futbolera — Guía de Diseño y Branding para Landing Page
> Documento de referencia para Lovable. Úsalo como guía absoluta de diseño, color, tono y lenguaje.

---

## 1. La Esencia de la Marca

### Concepto central
**"El mundial es una oportunidad para unirnos y disfrutar juntos."**

Polla Futbolera no es solo una app de predicciones — es el pretexto perfecto para que la familia y los amigos tengan algo en común durante el Mundial. El torneo pasa cada cuatro años. Los recuerdos que se crean alrededor de una polla duran para siempre.

### La historia emocional
Cada cuatro años el mundo se detiene. Las familias se reúnen, los grupos de amigos se reactivan, los compañeros de trabajo dejan de hablar de trabajo. El Mundial es el único evento que convierte a extraños en amigos y a amigos en rivales amistosos.

Polla Futbolera existe para **organizar esa energía** — para que el grupo que ya tiene el chat armado tenga también un lugar donde competir, reírse, y vivir el Mundial de verdad.

### Posicionamiento
- **No es** una plataforma de apuestas con dinero real
- **Es** un juego de predicciones entre conocidos — la familia, el trabajo, los amigos del barrio
- **Para quién:** El que organiza todo — el que siempre arma el plan, el que crea el grupo de WhatsApp, el que propone el asado para ver los partidos
- **Promesa principal:** En 5 minutos tienes tu polla lista y todo el grupo compitiendo

---

## 2. Sistema de Colores

### Paleta principal
Usa **exclusivamente** estos colores. No improvises.

| Nombre | HEX | HSL | Uso |
|--------|-----|-----|-----|
| **Negro Estadio** | `#09090F` | `222 22% 5%` | Fondo principal de la página |
| **Panel Oscuro** | `#0F1219` | `224 20% 8%` | Cards, secciones alternadas |
| **Verde Tech** | `#22C55E` | `142 70% 45%` | CTAs primarios, acentos, highlights |
| **Azul Tech** | `#08B4F8` | `199 88% 48%` | CTAs secundarios, íconos, detalles |
| **Blanco Suave** | `#E4E9F0` | `210 15% 92%` | Texto principal, títulos |
| **Gris Muted** | `#7788A8` | `218 14% 52%` | Texto secundario, subtítulos |
| **Borde Sutil** | `#1B2133` | `224 18% 14%` | Bordes de cards, separadores |

### Gradientes aprobados
```css
/* Fondo hero principal */
background: linear-gradient(135deg, #09090F 0%, #0d1520 50%, #061209 100%);

/* Glow verde para CTAs */
box-shadow: 0 0 40px rgba(34, 197, 94, 0.2);

/* Gradiente de texto destacado */
background: linear-gradient(90deg, #22C55E, #08B4F8);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Reglas de contraste
- Texto sobre fondo negro → usar Blanco Suave (`#E4E9F0`)
- Texto sobre Verde Tech → usar Negro Estadio (`#09090F`)
- Texto sobre Azul Tech → usar Negro Estadio (`#09090F`)
- Nunca usar texto blanco puro (`#FFFFFF`) — usar el Blanco Suave
- Nunca usar fondos blancos o claros — la landing siempre es dark

---

## 3. Tipografía

### Jerarquía visual
- **Display / Headlines grandes:** `Bebas Neue` o `Barlow Condensed ExtraBold` — fuerte, deportivo, impactante. Mayúsculas para los titulares principales.
- **Subtítulos y UI:** `DM Sans` o `Plus Jakarta Sans` — limpio, moderno, legible.
- **Código / Invite codes:** `JetBrains Mono` — para mostrar los códigos de invitación.

### Tamaños
```
Headline hero:    clamp(48px, 8vw, 96px) — Bebas Neue, uppercase
H2 secciones:     clamp(32px, 5vw, 56px) — Bebas Neue o Barlow Condensed
Subtítulos:       18-22px — DM Sans, weight 400-500
Body:             16px — DM Sans, weight 400
Labels/small:     13-14px — DM Sans, weight 500
```

---

## 4. Componentes y Estilo Visual

### Cards
- Fondo: `#0F1219` (Panel Oscuro)
- Borde: `1px solid #1B2133` (Borde Sutil)
- Border-radius: `12px`
- Hover state: borde con acento verde `1px solid rgba(34,197,94,0.3)` + `box-shadow: 0 0 20px rgba(34,197,94,0.08)`
- Sin sombras pesadas — usar glow sutil en verde o azul

### Botones CTA primarios (Verde Tech)
```css
background: #22C55E;
color: #09090F;
font-weight: 700;
border-radius: 8px;
padding: 14px 32px;
font-size: 16px;
transition: all 0.2s;
hover: background #16a34a, box-shadow 0 0 24px rgba(34,197,94,0.35)
```

### Botones CTA secundarios (Azul Tech / outline)
```css
border: 1px solid #08B4F8;
color: #08B4F8;
background: transparent;
border-radius: 8px;
hover: background rgba(8,180,248,0.08)
```

### Badges / Pills de estado
```css
/* Verde */
background: rgba(34,197,94,0.1);
border: 1px solid rgba(34,197,94,0.25);
color: #22C55E;

/* Azul */
background: rgba(8,180,248,0.1);
border: 1px solid rgba(8,180,248,0.25);
color: #08B4F8;
```

### Efectos de fondo
- Usar un **grid pattern sutil** sobre el fondo negro (líneas de `rgba(255,255,255,0.03)`) — da sensación tech/estadio
- Opcionalmente, un **glow radial verde muy sutil** detrás del hero: `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, transparent 70%)`
- Evitar partículas animadas excesivas — sutileza sobre espectáculo

---

## 5. Voz y Tono de Marca

### Personalidad
| Atributo | Descripción |
|----------|-------------|
| **Cercano** | Habla como un amigo que organiza el plan, no como una empresa |
| **Entusiasta** | El Mundial es emocionante — el copy debe sentirse así |
| **Directo** | Sin rodeos. Di lo que hace y por qué importa |
| **Inclusivo** | Para todos: la familia, el trabajo, los amigos del barrio |
| **Ligero** | Hay humor permitido — esto es un juego, no cirugía |

### Tono por sección
- **Hero:** Emocional, grande, inspirador — conecta con el sentimiento del Mundial
- **Features/Cómo funciona:** Práctico, claro, confianza — demuestra que es fácil
- **Social proof:** Cálido, humano — cita situaciones reales y reconocibles
- **CTA final:** Urgente pero amigable — no agresivo, sí motivador

### Lo que NO decimos
- ❌ "Plataforma de apuestas" — somos un juego, no una casa de apuestas
- ❌ "Software de gestión" — demasiado frío y corporativo
- ❌ Anglicismos innecesarios — hablar como la audiencia habla
- ❌ Superlativos vacíos: "el mejor", "increíble", "revolucionario"
- ❌ Exclamaciones excesivas (máximo 1-2 en toda la página)

### Lo que SÍ decimos
- ✅ "Tu polla" / "la polla del grupo" — apropiación natural del producto
- ✅ Situaciones concretas: "el chat del trabajo", "la familia por WhatsApp", "los del barrio"
- ✅ Referencias al ritual: "ver los partidos juntos", "el asado del domingo", "el grupo que siempre se activa"
- ✅ El rival amistoso: "ya veremos quién sabe más de fútbol"
- ✅ La emoción compartida: "sufrir y celebrar juntos"

---

## 6. Estructura de la Landing Page

### Sección 1 — Hero
**Objetivo:** Conectar emocionalmente en los primeros 3 segundos.

**Headline principal (opciones):**
> "El Mundial une a la familia. La polla decide quién sabe más."

> "Cuatro años esperando esto. ¿Vas a vivirlo solo?"

> "Organiza la polla del grupo en 5 minutos."

**Subheadline:**
> Crea tu polla, invita a familia y amigos con un código, y que gane el que más sabe de fútbol. Simple así.

**CTA principal:** `Crear mi polla gratis`

**Elementos visuales sugeridos:**
- Fondo: gradiente negro-verde muy oscuro
- Mockup de la app en mobile (pantalla de posiciones o predicciones)
- Sutil efecto de estadio / campo de fútbol como textura de fondo

---

### Sección 2 — El momento (problema/contexto emocional)
**Objetivo:** Hacer que el visitante se identifique.

**Headline:** `Cada cuatro años pasa lo mismo`

**Copy:**
> El grupo de WhatsApp explota. Todo el mundo tiene su opinión. Alguien dice "¿hacemos una polla?" y ahí empieza el caos — hojas de Excel, grupos de Telegram, resultados que nadie actualiza, discusiones de quién ganó qué.

> Este Mundial es diferente.

**Visual:** Split de "antes" (caos de mensajes, Excel) vs "después" (app limpia, tabla de posiciones)

---

### Sección 3 — Cómo funciona
**Objetivo:** Demostrar simplicidad. Máximo 3 pasos.

**Headline:** `Listo en 5 minutos. En serio.`

**Pasos:**
1. **Crea tu polla** — Dale nombre, configura las jornadas y los partidos
2. **Comparte el código** — Un código de 8 letras. El grupo se une desde el cel
3. **Que empiece el Mundial** — Cada quien predice, la app lleva los puntos automáticamente

---

### Sección 4 — Para quién es
**Objetivo:** Que el visitante se reconozca.

**Headline:** `¿Cuál es tu grupo?`

Mostrar 3-4 tarjetas con situaciones reales:
- 🏠 **La familia** — "De los que viven el fútbol en serio desde el primer partido hasta la final"
- 💼 **El trabajo** — "El único tema que une al equipo más allá de los reportes del lunes"
- 🍺 **Los amigos** — "Los del grupo que ya tiene nombre y lleva años activo solo para el Mundial"
- 🌎 **El grupo internacional** — "Familia y amigos en distintos países que quieren vivir el torneo juntos"

---

### Sección 5 — Características clave
**Objetivo:** Dar confianza racional. No abrumar.

Máximo 4-5 features, presentados como beneficios:

| Feature | Beneficio copy |
|---------|---------------|
| Predicciones por partido | "Cada uno predice antes del pitazo inicial. Sin trampa." |
| Tabla de posiciones en tiempo real | "Todo el mundo sabe cómo va la competencia. Sin preguntar." |
| Transparencia total | "Después del partido, todos ven las predicciones de todos." |
| Código de invitación | "Un código. Tu grupo se une en segundos desde donde esté." |
| Panel de administrador | "El que organiza tiene el control. Sin dramas." |

---

### Sección 6 — CTA Final
**Objetivo:** Conversión. Último empujón emocional.

**Headline:** `El Mundial empieza pronto. Tu grupo ya está esperando.`

**Subheadline:**
> Crea tu polla en 5 minutos. El que organiza siempre es el héroe del grupo.

**CTA:** `Crear mi polla gratis`
**Texto de apoyo:** `Sin tarjeta de crédito. Sin instalación. Solo fútbol.`

---

## 7. Elementos Emocionales Clave

### Palabras y frases que conectan
Usa estas en headlines, bullets y microcopy:

- "vivir el Mundial juntos"
- "el que siempre organiza todo"
- "el grupo que se activa cada cuatro años"
- "sufrir y celebrar juntos"
- "¿quién sabe más de fútbol?"
- "el pretexto perfecto para reunirse"
- "ya veremos en la final"
- "el rival más difícil es tu papá / tu hermano / tu jefe"
- "recuerdos que duran más que el torneo"

### Momentos reconocibles (usar como anclas)
- El grupo de WhatsApp que explota con cada partido
- La apuesta amistosa de quién eliminará a quién
- El que nunca sabe nada de fútbol pero siempre termina ganando
- Las predicciones que todos hacen pero nadie recuerda después
- Ver los partidos en casa de alguien con asado incluido

### La tensión emocional central
El Mundial es **efímero** (dura un mes, cada 4 años) pero los momentos que crea son **permanentes**. La landing debe evocar esa tensión: *no lo desperdicies, úsalo para conectar con los tuyos.*

---

## 8. Microcopy y UI Text

### Labels y botones
- `Crear mi polla` (no "Registrarse" o "Sign Up")
- `Unirme con código` (no "Join")
- `Ver cómo funciona` (CTA secundario)
- `Ya tengo cuenta, entrar`

### Mensajes de estado
- Loading: `Cargando la polla...`
- Error: `Algo salió mal. Intenta de nuevo.`
- Éxito crear: `Tu polla está lista. Comparte el código.`
- Éxito unirse: `Solicitud enviada. El admin te aprueba pronto.`

### Footer
- Sin legalese innecesario
- Links: Inicio · Cómo funciona · Contacto
- Email: hola@pollafutbolera.online
- Tagline footer: *"Hecho con pasión por el fútbol y los que lo viven en familia."*

---

## 9. Imágenes y Assets

### Estilo visual
- **Fotografía:** Grupos reales de personas viendo fútbol juntos — risas, tensión, celebración. No fotos de stock genéricas de "equipos de trabajo sonriendo".
- **Mockups:** La app en pantallas de celular — mostrar la tabla de posiciones, la pantalla de predicciones. Fondo oscuro del mockup.
- **Íconos:** Line icons, trazo delgado, en verde tech o azul tech.
- **Balón de fútbol:** Elemento visual recurrente — puede aparecer como fondo sutil, decoración, separador de secciones.

### Lo que evitar
- ❌ Imágenes de estadios vacíos o muy genéricas
- ❌ Iconografía de "finanzas" o "apuestas" (fichas de casino, billetes, gráficas de trading)
- ❌ Fotos de personas con camisetas de equipos específicos (para no alienar a nadie)
- ❌ Colores claros o fondos blancos — todo debe vivir en el universo dark

---

## 10. SEO y Meta

### Palabras clave objetivo
- "polla mundial 2026"
- "predicciones mundial fútbol"
- "juego predicciones fútbol amigos"
- "organizar polla futbol familia"
- "polla mundialista gratis"

### Page title sugerido
`Polla Futbolera — Organiza la polla del Mundial 2026 con tu grupo`

### Meta description
`Crea tu polla del Mundial FIFA 2026 en 5 minutos. Invita a familia y amigos con un código, hagan sus predicciones y que gane el que más sabe de fútbol. Gratis.`

---

## 11. Resumen para Lovable (TL;DR)

> Diseña una landing page **dark, moderna y deportiva** para una app de pollas del Mundial. Los colores son negro profundo (`#09090F`), verde tech (`#22C55E`) y azul tech (`#08B4F8`). La tipografía combina una fuente condensada bold para headlines (Bebas Neue o Barlow Condensed) con DM Sans para el cuerpo.
>
> El tono es **cálido y emocional** — habla de reunir a la familia y los amigos alrededor del fútbol, no de funcionalidades técnicas. El CTA principal es `Crear mi polla gratis`.
>
> La landing debe sentirse como estar en un estadio de noche: poderosa, emocionante, con ese verde característico del campo de fútbol brillando en la oscuridad.
