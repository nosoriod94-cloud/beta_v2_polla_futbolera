/**
 * Convierte errores internos de Supabase/sistema en mensajes amigables
 * para el usuario, evitando exponer detalles técnicos de la base de datos.
 */
export function getReadableError(error: unknown): string {
  const msg = ((error as Error)?.message ?? '').toLowerCase()
  const rawMsg = (error as Error)?.message ?? ''

  if (msg.includes('duplicate key') || msg.includes('already exists') || msg.includes('user already registered')) {
    return 'Este correo ya tiene una cuenta registrada.'
  }
  if (msg.includes('violates foreign key')) {
    return 'Referencia inválida. El recurso asociado no existe.'
  }
  if (msg.includes('permission denied') || msg.includes('not authorized')) {
    return 'No tienes permisos para esta acción.'
  }
  if (msg.includes('invalid input') || msg.includes('invalid value')) {
    return 'Los datos ingresados no son válidos.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Error de conexión. Verifica tu internet e intenta de nuevo.'
  }
  if (msg.includes('jwt') || msg.includes('session') || msg.includes('token')) {
    return 'Tu sesión expiró. Por favor ingresa de nuevo.'
  }
  if (msg.includes('email rate limit') || msg.includes('rate limit')) {
    return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
  }
  if (msg.includes('signup') && msg.includes('disabled')) {
    return 'El registro está temporalmente deshabilitado.'
  }
  if (msg.includes('email') && (msg.includes('disabled') || msg.includes('not enabled'))) {
    return 'El registro por correo está deshabilitado. Contacta al administrador.'
  }
  if (msg.includes('password') && msg.includes('characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'El correo electrónico no es válido.'
  }

  // Mostrar el mensaje real de Supabase si no coincide con ningún patrón conocido
  if (rawMsg) return rawMsg

  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
