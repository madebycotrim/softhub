-- Tabela de comentários em tarefas
CREATE TABLE comentarios_tarefa (
    id TEXT PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id),
    autor_id TEXT NOT NULL REFERENCES usuarios(id),
    conteudo TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    atualizado_em TEXT,
    ativo INTEGER NOT NULL DEFAULT 1
);

-- Índices para otimização
CREATE INDEX idx_comentarios_tarefa_id ON comentarios_tarefa(tarefa_id);
