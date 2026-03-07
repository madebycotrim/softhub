-- Migration 004 - Expandindo a tabela logs conforme Workflow 7
DROP TABLE IF EXISTS logs;

CREATE TABLE logs (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT,
  usuario_nome TEXT,
  usuario_email TEXT,
  usuario_role TEXT,
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  ip TEXT,
  entidade_tipo TEXT,
  entidade_id TEXT,
  dados_anteriores TEXT,
  dados_novos TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
