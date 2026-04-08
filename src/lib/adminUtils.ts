import ExcelJS from 'exceljs'

// ─── Timezone helpers (Bogotá = UTC-5, sin cambio de horario) ───────────────

/** Convierte un valor de datetime-local en hora Bogotá a ISO UTC string */
export function bogotaInputToUTC(localValue: string): string {
  const d = new Date(localValue + ':00-05:00')
  if (isNaN(d.getTime())) throw new Error(`Fecha inválida: ${localValue}`)
  return d.toISOString()
}

/** Convierte un ISO UTC string al valor datetime-local en hora Bogotá. */
export function utcToBogotaInput(utcStr: string): string {
  try {
    const d = new Date(utcStr)
    if (isNaN(d.getTime())) return ''
    const col = new Date(d.getTime() - 5 * 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${col.getUTCFullYear()}-${pad(col.getUTCMonth() + 1)}-${pad(col.getUTCDate())}T${pad(col.getUTCHours())}:${pad(col.getUTCMinutes())}`
  } catch {
    return ''
  }
}

/** Formatea un ISO UTC string como hora Colombia legible. */
export function formatBogota(utcStr: string): string {
  try {
    const d = new Date(utcStr)
    if (isNaN(d.getTime())) return '—'
    const col = new Date(d.getTime() - 5 * 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${col.getUTCDate()} ${months[col.getUTCMonth()]} ${col.getUTCFullYear()}, ${pad(col.getUTCHours())}:${pad(col.getUTCMinutes())} Col`
  } catch {
    return '—'
  }
}

// ─── Import helpers (Excel + CSV) ────────────────────────────────────────────

export interface CsvRow {
  jornada: string
  equipo_a: string
  equipo_b: string
  fecha: string
  hora: string
  estadio: string
  fechaUTC?: string
  error?: string
}

export function excelTimeToHHMM(val: unknown): string {
  if (val instanceof Date) {
    const h = val.getUTCHours()
    const m = val.getUTCMinutes()
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  if (typeof val === 'number') {
    const frac = val % 1
    const totalMin = Math.round(frac * 24 * 60)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const s = String(val ?? '').trim()
  const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (ampm) {
    let h = parseInt(ampm[1])
    const m = parseInt(ampm[2] ?? '0')
    const period = ampm[3].toLowerCase()
    if (period === 'pm' && h !== 12) h += 12
    if (period === 'am' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const hhmm = s.match(/^(\d{1,2}):(\d{2})/)
  return hhmm ? `${hhmm[1].padStart(2, '0')}:${hhmm[2]}` : s
}

export function excelDateToDDMMYYYY(val: unknown): string {
  if (val instanceof Date) {
    const dd = String(val.getUTCDate()).padStart(2, '0')
    const mm = String(val.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = val.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  if (typeof val === 'number' && val > 1) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000))
    const dd = String(d.getUTCDate()).padStart(2, '0')
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = d.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  return String(val ?? '').trim()
}

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<CsvRow[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.getWorksheet('Partidos') ?? wb.worksheets[0]
  if (!ws) return []
  const rows: unknown[][] = []
  ws.eachRow((row) => {
    const vals = (row.values as unknown[]).slice(1)
    rows.push(vals)
  })
  if (rows.length < 2) return []
  return rows.slice(1)
    .filter(cols => cols.some(c => String(c ?? '').trim()))
    .map(cols => ({
      jornada:  String(cols[0] ?? '').trim(),
      equipo_a: String(cols[1] ?? '').trim(),
      equipo_b: String(cols[2] ?? '').trim(),
      fecha:    excelDateToDDMMYYYY(cols[3]),
      hora:     excelTimeToHHMM(cols[4]),
      estadio:  String(cols[5] ?? '').trim(),
    }))
}

export function parseCSVText(text: string): CsvRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  if (lines.length < 2) return []
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim())
    return {
      jornada:  cols[0] ?? '',
      equipo_a: cols[1] ?? '',
      equipo_b: cols[2] ?? '',
      fecha:    cols[3] ?? '',
      hora:     cols[4] ?? '',
      estadio:  cols[5] ?? '',
    }
  })
}

export function validateAndEnrichRows(rows: CsvRow[], jornadaNames: string[]): CsvRow[] {
  return rows.map(row => {
    if (!row.jornada) return { ...row, error: 'Falta jornada' }
    if (!jornadaNames.includes(row.jornada)) return { ...row, error: `Jornada "${row.jornada}" no existe` }
    if (!row.equipo_a || !row.equipo_b) return { ...row, error: 'Faltan equipos' }
    if (!row.fecha.match(/^\d{2}\/\d{2}\/\d{4}$/)) return { ...row, error: 'Fecha inválida (usa dd/mm/yyyy)' }
    if (!row.hora.match(/^\d{2}:\d{2}$/)) return { ...row, error: 'Hora inválida (usa HH:mm)' }
    const [dd, mm, yyyy] = row.fecha.split('/')
    const isoLocal = `${yyyy}-${mm}-${dd}T${row.hora}`
    try {
      const utcDate = new Date(isoLocal + ':00-05:00')
      if (isNaN(utcDate.getTime())) return { ...row, error: 'Fecha u hora inválida' }
      return { ...row, fechaUTC: utcDate.toISOString() }
    } catch {
      return { ...row, error: 'Error al parsear fecha/hora' }
    }
  })
}

export async function downloadTemplate(jornadaNames: string[]) {
  const wb = new ExcelJS.Workbook()
  const wsPartidos = wb.addWorksheet('Partidos')
  wsPartidos.columns = [
    { header: 'jornada',            width: 22 },
    { header: 'equipo_a',           width: 16 },
    { header: 'equipo_b',           width: 16 },
    { header: 'fecha (DD/MM/AAAA)', width: 20 },
    { header: 'hora_bogota',        width: 13 },
    { header: 'estadio',            width: 22 },
  ]
  wsPartidos.addRow([jornadaNames[0] ?? 'Jornada 1', 'Colombia',  'Brasil',  '15/06/2026', '20:00', 'MetLife Stadium'])
  wsPartidos.addRow([jornadaNames[0] ?? 'Jornada 1', 'Argentina', 'México',  '16/06/2026', '17:00', ''])
  for (let r = 2; r <= 51; r++) {
    wsPartidos.getCell(r, 4).numFmt = '@'
    wsPartidos.getCell(r, 5).numFmt = '@'
  }
  const wsInstr = wb.addWorksheet('Instrucciones')
  wsInstr.columns = [
    { header: 'Campo',       width: 22 },
    { header: 'Descripción', width: 58 },
    { header: 'Ejemplo',     width: 22 },
  ]
  const instrRows = [
    ['jornada',            'Nombre exacto de la jornada creada en la polla',                        jornadaNames[0] ?? 'Jornada 1'],
    ['equipo_a',           'Nombre del equipo local (o equipo A)',                                   'Colombia'],
    ['equipo_b',           'Nombre del equipo visitante (o equipo B)',                               'Brasil'],
    ['fecha (DD/MM/AAAA)', 'Fecha del partido — formato Día/Mes/Año Colombia',                       '15/06/2026'],
    ['hora_bogota',        'Hora en Colombia. Acepta: 20:00 · 8 pm · 8:00 pm',                      '20:00'],
    ['estadio',            'Estadio (opcional, puede dejarse vacío)',                                'MetLife Stadium'],
    ['', '', ''],
    ['⚠️ IMPORTANTE', 'La columna "fecha" está pre-formateada como Texto. Escríbela como DD/MM/AAAA.', ''],
    ['⚠️ IMPORTANTE', 'No cambies el nombre de la pestaña "Partidos" ni los encabezados de la fila 1.', ''],
    ['⚠️ IMPORTANTE', 'Llena los datos desde la fila 2 de la pestaña "Partidos".', ''],
  ]
  instrRows.forEach(row => wsInstr.addRow(row))
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_partidos.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Result labels ────────────────────────────────────────────────────────────

export const resultLabels: Record<string, string> = {
  A_wins: 'Gana A',
  draw: 'Empate',
  B_wins: 'Gana B',
}
