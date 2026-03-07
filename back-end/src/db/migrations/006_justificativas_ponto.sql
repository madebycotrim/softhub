-- 006_justificativas_ponto.sql
-- Adiciona a tabela de Justificativas de Ponto (Workflow 24)

CREATE TABLE IF NOT EXISTS justificativas_ponto (
  id              TEXT NOT NULL PRIMARY KEY,
  usuario_id      TEXT NOT NULL REFERENCES usuarios(id),
  data            TEXT NOT NULL,
  tipo            TEXT NOT NULL, -- 'ausencia', 'esquecimento', 'problema_sistema'
  motivo          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovada', 'rejeitada'
  motivo_rejeicao TEXT,
  avaliado_por    TEXT REFERENCES usuarios(id),
  avaliado_em     TEXT,
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- O mesmo usuário não pode justificar a mesma exata data duas vezes
CREATE UNIQUE INDEX IF NOT EXISTS idx_justificativa_unica ON justificativas_ponto (usuario_id, data);
