-- Seguridad: revocar acceso anónimo a lookup_license_code.
-- Esta función era accesible sin autenticación, permitiendo enumerar
-- códigos de licencia válidos y obtener emails de clientes.

revoke execute on function lookup_license_code(text) from anon;
grant execute on function lookup_license_code(text) to authenticated;
