/**
 * Convierte errores internos de Supabase/sistema en mensajes amigables
 * para el usuario, evitando exponer detalles técnicos de la base de datos.
 */
export function getReadableError(error: unknown): string {
  const msg = ((error as Error)?.message ?? '').toLowerCase()

  if (msg.includes('duplicate key') || msg.includes('already exists')) {
    return 'Este registro ya existe.'
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

  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
