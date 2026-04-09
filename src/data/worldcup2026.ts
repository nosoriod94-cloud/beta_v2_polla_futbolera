// ============================================================
// FIFA World Cup 2026 — Datos oficiales fase de grupos
// Grupos: A–L (12 grupos × 6 partidos = 72 partidos)
// Fuente: sorteo FIFA dic 2024 + calendario oficial FIFA
// Fechas: almacenadas en UTC; la app muestra en hora Bogotá (UTC-5)
// ============================================================

export interface WC26Partido {
  equipoA: string
  equipoB: string
  fechaHoraUTC: string  // ISO 8601 en UTC
  estadio: string
}

export interface WC26Grupo {
  nombre: string
  orden: number
  puntosPorAcierto: number
  partidos: WC26Partido[]
}

export const WORLDCUP2026: WC26Grupo[] = [
  // ── GRUPO A: México, Corea del Sur, Sudáfrica, Chequia ─────────────
  {
    nombre: 'Grupo A',
    orden: 1,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'México',        equipoB: 'Sudáfrica',     fechaHoraUTC: '2026-06-11T18:00:00Z', estadio: 'Estadio Azteca, Ciudad de México' },
      { equipoA: 'Corea del Sur', equipoB: 'Chequia',       fechaHoraUTC: '2026-06-12T01:00:00Z', estadio: 'Estadio Akron, Guadalajara' },
      { equipoA: 'Chequia',       equipoB: 'Sudáfrica',     fechaHoraUTC: '2026-06-17T13:00:00Z', estadio: 'Mercedes-Benz Stadium, Atlanta' },
      { equipoA: 'México',        equipoB: 'Corea del Sur', fechaHoraUTC: '2026-06-18T00:00:00Z', estadio: 'Estadio Akron, Guadalajara' },
      { equipoA: 'Chequia',       equipoB: 'México',        fechaHoraUTC: '2026-06-25T00:00:00Z', estadio: 'Estadio Azteca, Ciudad de México' },
      { equipoA: 'Sudáfrica',     equipoB: 'Corea del Sur', fechaHoraUTC: '2026-06-25T00:00:00Z', estadio: 'Estadio BBVA, Monterrey' },
    ],
  },

  // ── GRUPO B: Canadá, Suiza, Catar, Bosnia y Herzegovina ────────────
  {
    nombre: 'Grupo B',
    orden: 2,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Canadá',               equipoB: 'Bosnia y Herzegovina', fechaHoraUTC: '2026-06-11T16:00:00Z', estadio: 'BMO Field, Toronto' },
      { equipoA: 'Catar',                equipoB: 'Suiza',                fechaHoraUTC: '2026-06-12T19:00:00Z', estadio: "Levi's Stadium, Santa Clara" },
      { equipoA: 'Suiza',                equipoB: 'Bosnia y Herzegovina', fechaHoraUTC: '2026-06-17T19:00:00Z', estadio: 'SoFi Stadium, Los Ángeles' },
      { equipoA: 'Canadá',               equipoB: 'Catar',                fechaHoraUTC: '2026-06-17T22:00:00Z', estadio: 'BC Place, Vancouver' },
      { equipoA: 'Suiza',                equipoB: 'Canadá',               fechaHoraUTC: '2026-06-23T19:00:00Z', estadio: 'BC Place, Vancouver' },
      { equipoA: 'Bosnia y Herzegovina', equipoB: 'Catar',                fechaHoraUTC: '2026-06-23T19:00:00Z', estadio: 'Lumen Field, Seattle' },
    ],
  },

  // ── GRUPO C: Brasil, Marruecos, Haití, Escocia ─────────────────────
  {
    nombre: 'Grupo C',
    orden: 3,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Brasil',    equipoB: 'Marruecos', fechaHoraUTC: '2026-06-12T19:00:00Z', estadio: 'MetLife Stadium, East Rutherford' },
      { equipoA: 'Haití',     equipoB: 'Escocia',   fechaHoraUTC: '2026-06-12T22:00:00Z', estadio: 'Gillette Stadium, Foxborough' },
      { equipoA: 'Escocia',   equipoB: 'Marruecos', fechaHoraUTC: '2026-06-18T19:00:00Z', estadio: 'Gillette Stadium, Foxborough' },
      { equipoA: 'Brasil',    equipoB: 'Haití',     fechaHoraUTC: '2026-06-18T22:00:00Z', estadio: 'Lincoln Financial Field, Philadelphia' },
      { equipoA: 'Escocia',   equipoB: 'Brasil',    fechaHoraUTC: '2026-06-23T19:00:00Z', estadio: 'Hard Rock Stadium, Miami' },
      { equipoA: 'Marruecos', equipoB: 'Haití',     fechaHoraUTC: '2026-06-23T19:00:00Z', estadio: 'Mercedes-Benz Stadium, Atlanta' },
    ],
  },

  // ── GRUPO D: EE.UU., Paraguay, Australia, Turquía ──────────────────
  {
    nombre: 'Grupo D',
    orden: 4,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'EE.UU.',    equipoB: 'Paraguay',  fechaHoraUTC: '2026-06-12T01:00:00Z', estadio: 'SoFi Stadium, Los Ángeles' },
      { equipoA: 'Australia', equipoB: 'Turquía',   fechaHoraUTC: '2026-06-13T04:00:00Z', estadio: 'BC Place, Vancouver' },
      { equipoA: 'EE.UU.',    equipoB: 'Australia', fechaHoraUTC: '2026-06-18T19:00:00Z', estadio: 'Lumen Field, Seattle' },
      { equipoA: 'Turquía',   equipoB: 'Paraguay',  fechaHoraUTC: '2026-06-19T04:00:00Z', estadio: "Levi's Stadium, Santa Clara" },
      { equipoA: 'Turquía',   equipoB: 'EE.UU.',    fechaHoraUTC: '2026-06-26T02:00:00Z', estadio: 'SoFi Stadium, Los Ángeles' },
      { equipoA: 'Paraguay',  equipoB: 'Australia', fechaHoraUTC: '2026-06-26T02:00:00Z', estadio: "Levi's Stadium, Santa Clara" },
    ],
  },

  // ── GRUPO E: Alemania, Curazao, Costa de Marfil, Ecuador ───────────
  {
    nombre: 'Grupo E',
    orden: 5,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Alemania',        equipoB: 'Curazao',        fechaHoraUTC: '2026-06-13T16:00:00Z', estadio: 'NRG Stadium, Houston' },
      { equipoA: 'Costa de Marfil', equipoB: 'Ecuador',        fechaHoraUTC: '2026-06-13T20:00:00Z', estadio: 'Lincoln Financial Field, Philadelphia' },
      { equipoA: 'Alemania',        equipoB: 'Costa de Marfil', fechaHoraUTC: '2026-06-19T17:00:00Z', estadio: 'BMO Field, Toronto' },
      { equipoA: 'Ecuador',         equipoB: 'Curazao',        fechaHoraUTC: '2026-06-19T23:00:00Z', estadio: 'Arrowhead Stadium, Kansas City' },
      { equipoA: 'Curazao',         equipoB: 'Costa de Marfil', fechaHoraUTC: '2026-06-24T17:00:00Z', estadio: 'Lincoln Financial Field, Philadelphia' },
      { equipoA: 'Ecuador',         equipoB: 'Alemania',       fechaHoraUTC: '2026-06-24T17:00:00Z', estadio: 'MetLife Stadium, East Rutherford' },
    ],
  },

  // ── GRUPO F: Países Bajos, Japón, Túnez, Suecia ────────────────────
  {
    nombre: 'Grupo F',
    orden: 6,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Países Bajos', equipoB: 'Japón',        fechaHoraUTC: '2026-06-13T19:00:00Z', estadio: 'AT&T Stadium, Arlington' },
      { equipoA: 'Suecia',       equipoB: 'Túnez',        fechaHoraUTC: '2026-06-14T01:00:00Z', estadio: 'Estadio BBVA, Monterrey' },
      { equipoA: 'Países Bajos', equipoB: 'Suecia',       fechaHoraUTC: '2026-06-19T16:00:00Z', estadio: 'NRG Stadium, Houston' },
      { equipoA: 'Túnez',        equipoB: 'Japón',        fechaHoraUTC: '2026-06-20T03:00:00Z', estadio: 'Estadio BBVA, Monterrey' },
      { equipoA: 'Japón',        equipoB: 'Suecia',       fechaHoraUTC: '2026-06-25T22:00:00Z', estadio: 'AT&T Stadium, Arlington' },
      { equipoA: 'Túnez',        equipoB: 'Países Bajos', fechaHoraUTC: '2026-06-25T22:00:00Z', estadio: 'Arrowhead Stadium, Kansas City' },
    ],
  },

  // ── GRUPO G: Bélgica, Egipto, Irán, Nueva Zelanda ──────────────────
  {
    nombre: 'Grupo G',
    orden: 7,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Bélgica',       equipoB: 'Egipto',        fechaHoraUTC: '2026-06-14T19:00:00Z', estadio: 'Lumen Field, Seattle' },
      { equipoA: 'Irán',          equipoB: 'Nueva Zelanda', fechaHoraUTC: '2026-06-15T01:00:00Z', estadio: 'SoFi Stadium, Los Ángeles' },
      { equipoA: 'Bélgica',       equipoB: 'Irán',          fechaHoraUTC: '2026-06-20T19:00:00Z', estadio: 'SoFi Stadium, Los Ángeles' },
      { equipoA: 'Nueva Zelanda', equipoB: 'Egipto',        fechaHoraUTC: '2026-06-21T01:00:00Z', estadio: 'BC Place, Vancouver' },
      { equipoA: 'Egipto',        equipoB: 'Irán',          fechaHoraUTC: '2026-06-28T03:00:00Z', estadio: 'Lumen Field, Seattle' },
      { equipoA: 'Nueva Zelanda', equipoB: 'Bélgica',       fechaHoraUTC: '2026-06-28T03:00:00Z', estadio: 'BC Place, Vancouver' },
    ],
  },

  // ── GRUPO H: España, Arabia Saudita, Uruguay, Cabo Verde ───────────
  {
    nombre: 'Grupo H',
    orden: 8,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'España',         equipoB: 'Cabo Verde',    fechaHoraUTC: '2026-06-14T13:00:00Z', estadio: 'Mercedes-Benz Stadium, Atlanta' },
      { equipoA: 'Arabia Saudita', equipoB: 'Uruguay',       fechaHoraUTC: '2026-06-14T19:00:00Z', estadio: 'Hard Rock Stadium, Miami' },
      { equipoA: 'España',         equipoB: 'Arabia Saudita', fechaHoraUTC: '2026-06-20T13:00:00Z', estadio: 'Mercedes-Benz Stadium, Atlanta' },
      { equipoA: 'Uruguay',        equipoB: 'Cabo Verde',    fechaHoraUTC: '2026-06-20T19:00:00Z', estadio: 'Hard Rock Stadium, Miami' },
      { equipoA: 'Cabo Verde',     equipoB: 'Arabia Saudita', fechaHoraUTC: '2026-06-26T23:00:00Z', estadio: 'NRG Stadium, Houston' },
      { equipoA: 'Uruguay',        equipoB: 'España',        fechaHoraUTC: '2026-06-26T23:00:00Z', estadio: 'Estadio Akron, Guadalajara' },
    ],
  },

  // ── GRUPO I: Francia, Senegal, Noruega, Irak ───────────────────────
  {
    nombre: 'Grupo I',
    orden: 9,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Francia', equipoB: 'Senegal', fechaHoraUTC: '2026-06-15T16:00:00Z', estadio: 'MetLife Stadium, East Rutherford' },
      { equipoA: 'Irak',    equipoB: 'Noruega', fechaHoraUTC: '2026-06-15T19:00:00Z', estadio: 'Gillette Stadium, Foxborough' },
      { equipoA: 'Francia', equipoB: 'Irak',    fechaHoraUTC: '2026-06-21T18:00:00Z', estadio: 'Lincoln Financial Field, Philadelphia' },
      { equipoA: 'Noruega', equipoB: 'Senegal', fechaHoraUTC: '2026-06-21T21:00:00Z', estadio: 'MetLife Stadium, East Rutherford' },
      { equipoA: 'Noruega', equipoB: 'Francia', fechaHoraUTC: '2026-06-26T16:00:00Z', estadio: 'Gillette Stadium, Foxborough' },
      { equipoA: 'Senegal', equipoB: 'Irak',    fechaHoraUTC: '2026-06-26T16:00:00Z', estadio: 'BMO Field, Toronto' },
    ],
  },

  // ── GRUPO J: Argentina, Argelia, Austria, Jordania ─────────────────
  {
    nombre: 'Grupo J',
    orden: 10,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Argentina', equipoB: 'Argelia',  fechaHoraUTC: '2026-06-16T00:00:00Z', estadio: 'Arrowhead Stadium, Kansas City' },
      { equipoA: 'Austria',   equipoB: 'Jordania', fechaHoraUTC: '2026-06-16T04:00:00Z', estadio: "Levi's Stadium, Santa Clara" },
      { equipoA: 'Argentina', equipoB: 'Austria',  fechaHoraUTC: '2026-06-21T16:00:00Z', estadio: 'AT&T Stadium, Arlington' },
      { equipoA: 'Jordania',  equipoB: 'Argelia',  fechaHoraUTC: '2026-06-22T03:00:00Z', estadio: "Levi's Stadium, Santa Clara" },
      { equipoA: 'Argelia',   equipoB: 'Austria',  fechaHoraUTC: '2026-06-29T01:00:00Z', estadio: 'Arrowhead Stadium, Kansas City' },
      { equipoA: 'Jordania',  equipoB: 'Argentina', fechaHoraUTC: '2026-06-29T01:00:00Z', estadio: 'AT&T Stadium, Arlington' },
    ],
  },

  // ── GRUPO K: Portugal, R.D. Congo, Uzbekistán, Colombia ────────────
  {
    nombre: 'Grupo K',
    orden: 11,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Portugal',    equipoB: 'R.D. Congo',  fechaHoraUTC: '2026-06-16T16:00:00Z', estadio: 'NRG Stadium, Houston' },
      { equipoA: 'Uzbekistán',  equipoB: 'Colombia',    fechaHoraUTC: '2026-06-17T01:00:00Z', estadio: 'Estadio Azteca, Ciudad de México' },
      { equipoA: 'Portugal',    equipoB: 'Uzbekistán',  fechaHoraUTC: '2026-06-22T16:00:00Z', estadio: 'NRG Stadium, Houston' },
      { equipoA: 'Colombia',    equipoB: 'R.D. Congo',  fechaHoraUTC: '2026-06-23T01:00:00Z', estadio: 'Estadio Akron, Guadalajara' },
      { equipoA: 'Colombia',    equipoB: 'Portugal',    fechaHoraUTC: '2026-06-28T20:30:00Z', estadio: 'Hard Rock Stadium, Miami' },
      { equipoA: 'R.D. Congo',  equipoB: 'Uzbekistán',  fechaHoraUTC: '2026-06-28T20:30:00Z', estadio: 'Mercedes-Benz Stadium, Atlanta' },
    ],
  },

  // ── GRUPO L: Inglaterra, Croacia, Ghana, Panamá ────────────────────
  {
    nombre: 'Grupo L',
    orden: 12,
    puntosPorAcierto: 1,
    partidos: [
      { equipoA: 'Inglaterra', equipoB: 'Croacia', fechaHoraUTC: '2026-06-16T19:00:00Z', estadio: 'AT&T Stadium, Arlington' },
      { equipoA: 'Ghana',      equipoB: 'Panamá',  fechaHoraUTC: '2026-06-16T20:00:00Z', estadio: 'BMO Field, Toronto' },
      { equipoA: 'Inglaterra', equipoB: 'Ghana',   fechaHoraUTC: '2026-06-22T17:00:00Z', estadio: 'Gillette Stadium, Foxborough' },
      { equipoA: 'Panamá',     equipoB: 'Croacia', fechaHoraUTC: '2026-06-22T20:00:00Z', estadio: 'BMO Field, Toronto' },
      { equipoA: 'Panamá',     equipoB: 'Inglaterra', fechaHoraUTC: '2026-06-27T18:00:00Z', estadio: 'MetLife Stadium, East Rutherford' },
      { equipoA: 'Croacia',    equipoB: 'Ghana',   fechaHoraUTC: '2026-06-27T18:00:00Z', estadio: 'Lincoln Financial Field, Philadelphia' },
    ],
  },
]
