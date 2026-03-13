-- Migração: Evolução Fase 2 - Gestão de Ciclos e Feedback
-- Adiciona campos de feedback e aprendizado às tarefas

ALTER TABLE tarefas ADD COLUMN feedback_lider TEXT;
ALTER TABLE tarefas ADD COLUMN nota_aprendizado INTEGER DEFAULT 0; -- 1 a 5 ou 0 para não avaliado
ALTER TABLE tarefas ADD COLUMN data_conclusao TEXT;
