import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dir, '..', 'public')

// ─── 1. Iconos PWA desde favicon.svg ─────────────────────────────────────────
const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'))

for (const size of [192, 512]) {
  const outPath = join(publicDir, `icon-${size}.png`)
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath)
  console.log(`✓ icon-${size}.png`)
}

// ─── 2. OG Image 1200×630 ────────────────────────────────────────────────────
// Generamos la imagen OG como SVG y luego la convertimos a PNG con sharp.
// Usamos fuentes del sistema (Arial/sans-serif) para que no dependan de Google Fonts.

const ballSvg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8')

// Extraer el contenido del SVG del balón para embebido en el OG SVG
// El balón original es 100×100; lo escalamos a 280×280 y lo posicionamos en la derecha
const BALL_SIZE  = 280
const BALL_X     = 1200 - BALL_SIZE - 60   // margen derecho
const BALL_Y     = (630 - BALL_SIZE) / 2

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <!-- Fondo negro estadio -->
  <rect width="1200" height="630" fill="#09090F"/>

  <!-- Gradiente sutil de fondo -->
  <defs>
    <radialGradient id="glow" cx="30%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#22C55E" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#09090F" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowBlue" cx="80%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#08B4F8" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#09090F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glowBlue)"/>

  <!-- Línea decorativa verde izquierda -->
  <rect x="64" y="100" width="4" height="430" rx="2" fill="#22C55E" opacity="0.6"/>

  <!-- Título principal -->
  <text
    x="104" y="240"
    font-family="Arial Black, Arial, sans-serif"
    font-size="112"
    font-weight="900"
    letter-spacing="4"
    fill="white"
  >POLLA</text>
  <text
    x="104" y="360"
    font-family="Arial Black, Arial, sans-serif"
    font-size="112"
    font-weight="900"
    letter-spacing="4"
    fill="white"
  >FUTBOLERA</text>

  <!-- Subtítulo verde -->
  <text
    x="106" y="420"
    font-family="Arial, sans-serif"
    font-size="36"
    font-weight="700"
    letter-spacing="6"
    fill="#22C55E"
  >MUNDIAL FIFA 2026</text>

  <!-- Tagline -->
  <text
    x="106" y="480"
    font-family="Arial, sans-serif"
    font-size="22"
    fill="#7788A8"
  >Haz tus predicciones · Compite con amigos · Gana</text>

  <!-- URL -->
  <text
    x="106" y="548"
    font-family="Arial, sans-serif"
    font-size="20"
    fill="#1B2133"
  >app.pollafutbolera.online</text>

  <!-- Balón de fútbol (favicon.svg embebido via image) -->
  <image
    href="data:image/svg+xml;base64,${Buffer.from(ballSvg).toString('base64')}"
    x="${BALL_X}"
    y="${BALL_Y}"
    width="${BALL_SIZE}"
    height="${BALL_SIZE}"
    opacity="0.9"
  />

  <!-- Círculo glow detrás del balón -->
  <circle cx="${BALL_X + BALL_SIZE / 2}" cy="${BALL_Y + BALL_SIZE / 2}" r="${BALL_SIZE / 2 + 20}"
    fill="none" stroke="#22C55E" stroke-width="1" opacity="0.15"/>
</svg>`

const ogBuffer = Buffer.from(ogSvg)
const ogPath = join(publicDir, 'og-image.png')

await sharp(ogBuffer)
  .resize(1200, 630)
  .png()
  .toFile(ogPath)

console.log('✓ og-image.png')
console.log('\nTodos los assets generados correctamente.')
