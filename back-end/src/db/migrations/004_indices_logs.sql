-- Migração 004: Índices para otimização de Logs e Auditoria
-- Melhora performance de busca por data, módulo e ação

CREATE INDEX IF NOT EXISTS idx_logs_criado_em ON logs(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs(acao);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON logs(entidade_tipo, entidade_id);
