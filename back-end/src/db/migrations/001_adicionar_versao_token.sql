-- Migration 001: Adiciona coluna versao_token à tabela usuarios
-- Necessária para invalidação de sessões anteriores (login em outro dispositivo)
-- Referenciada em: auth.ts, auth-qr.ts, middleware/auth.ts

ALTER TABLE usuarios ADD COLUMN versao_token INTEGER NOT NULL DEFAULT 1;
