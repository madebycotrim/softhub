-- Migration para invalidar sessões anteriores ao conectar novo dispositivo
-- Adiciona controle de versão de token na tabela de usuários

ALTER TABLE usuarios ADD COLUMN versao_token INTEGER NOT NULL DEFAULT 1;
