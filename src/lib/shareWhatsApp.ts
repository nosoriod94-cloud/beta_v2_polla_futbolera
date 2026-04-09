const APP_URL = 'https://app.pollafutbolera.online/auth'

export function shareViaWhatsApp(inviteCode: string) {
  const text = [
    '⚽ ¡Únete a mi polla del Mundial!',
    '',
    `📱 Entra a ${APP_URL}`,
    '📝 Regístrate con tu email',
    `🔑 Usa el código: ${inviteCode}`,
    '',
    '¡A competir! 🏆',
  ].join('\n')

  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
