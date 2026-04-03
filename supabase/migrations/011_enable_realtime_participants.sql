-- ============================================================
-- Migración 011: Habilitar Realtime en polla_participants
-- ============================================================
-- Permite que el panel del admin reciba actualizaciones en tiempo
-- real cuando un nuevo participante se une o cambia de estado.
-- ============================================================

alter publication supabase_realtime add table polla_participants;
