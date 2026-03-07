-- Migration 010 - Checklist de Tarefas

CREATE TABLE checklist_tarefa (
  id         TEXT NOT NULL PRIMARY KEY,
  tarefa_id  TEXT NOT NULL REFERENCES tarefas(id),
  texto      TEXT NOT NULL,
  concluido  INTEGER NOT NULL DEFAULT 0,  -- 0 = pendente, 1 = concluído
  ordem      INTEGER NOT NULL DEFAULT 0,  -- para reordenação
  criado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_checklist_tarefa ON checklist_tarefa(tarefa_id);
