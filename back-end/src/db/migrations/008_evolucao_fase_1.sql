-- Migração: Evolução Fase 1 - Base de Engenharia
-- Adiciona campos técnicos aos projetos

ALTER TABLE projetos ADD COLUMN documentacao_url TEXT;
ALTER TABLE projetos ADD COLUMN figma_url TEXT;
ALTER TABLE projetos ADD COLUMN setup_url TEXT;
