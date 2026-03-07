-- Migration 009 - Soft Delete Compliance

-- Ponto Registros
ALTER TABLE ponto_registros ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1;

-- Justificativas Ponto
ALTER TABLE justificativas_ponto ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1;

-- Sprints
ALTER TABLE sprints ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1;
