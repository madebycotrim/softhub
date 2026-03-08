-- Migração para adicionar líder e sub-líder aos grupos
ALTER TABLE grupos ADD COLUMN lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE grupos ADD COLUMN sub_lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL;
