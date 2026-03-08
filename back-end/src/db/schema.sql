-- SCHEMA UNIFICADO - SoftHub
-- Este arquivo contém a estrutura completa do banco de dados unificada e ordenada por dependências.

-- 1. Tabela de Grupos
CREATE TABLE grupos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 2. Tabela de Equipes
CREATE TABLE equipes (
    id TEXT NOT NULL PRIMARY KEY,
    grupo_id TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 3. Tabela Usuários
CREATE TABLE usuarios (
  id TEXT NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'MEMBRO', -- LIDER_EQUIPE, LIDER_GRUPO, ADMIN, VISITANTE
  ativo INTEGER NOT NULL DEFAULT 1,
  foto_perfil TEXT,
  bio TEXT,
  funcoes TEXT DEFAULT '[]',
  equipe_id TEXT REFERENCES equipes(id) ON DELETE SET NULL,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 4. Tabela Projetos / Times
CREATE TABLE projetos (
  id TEXT NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  publico INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 5. Tabela Projetos_Membros (N:N)
CREATE TABLE projetos_membros (
  projeto_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  papel_no_projeto TEXT NOT NULL DEFAULT 'MEMBRO',
  PRIMARY KEY (projeto_id, usuario_id),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 6. Tabela Sprints
CREATE TABLE sprints (
  id TEXT NOT NULL PRIMARY KEY,
  projeto_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  objetivo TEXT,
  status TEXT NOT NULL DEFAULT 'planejada',
  data_inicio TEXT,
  data_fim TEXT,
  velocity_planejado INTEGER,
  velocity_realizado INTEGER,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

-- 7. Tabela Tarefas
CREATE TABLE tarefas (
  id TEXT NOT NULL PRIMARY KEY,
  projeto_id TEXT NOT NULL,
  sprint_id TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'a_fazer',
  prioridade TEXT NOT NULL DEFAULT 'media',
  pontos INTEGER,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
);

-- 8. Tabela Tarefas_Responsaveis (N:N)
CREATE TABLE tarefas_responsaveis (
  tarefa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  PRIMARY KEY (tarefa_id, usuario_id),
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 9. Tabela Tarefa_Historico
CREATE TABLE tarefa_historico (
  id TEXT NOT NULL PRIMARY KEY,
  tarefa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  campo_alterado TEXT NOT NULL,
  valor_antigo TEXT,
  valor_novo TEXT,
  alterado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 10. Tabela Avisos
CREATE TABLE avisos (
  id TEXT NOT NULL PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'info',
  criado_por TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expira_em TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 11. Tabela Ponto_Registros
CREATE TABLE ponto_registros (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  registrado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ip_origem TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 12. Tabela Notificacoes
CREATE TABLE notificacoes (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  link_acao TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 13. Tabela Logs de Auditoria
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

-- 14. Tabela Retrospectivas
CREATE TABLE retrospectivas (
  id                   TEXT NOT NULL PRIMARY KEY,
  sprint_id            TEXT NOT NULL UNIQUE REFERENCES sprints(id) ON DELETE CASCADE,
  o_que_foi_bem        TEXT,
  o_que_melhorar       TEXT,
  acoes_proxima_sprint TEXT,
  atualizado_em        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 15. Tabela Justificativas de Ponto
CREATE TABLE justificativas_ponto (
  id              TEXT NOT NULL PRIMARY KEY,
  usuario_id      TEXT NOT NULL REFERENCES usuarios(id),
  data            TEXT NOT NULL,
  tipo            TEXT NOT NULL,
  motivo          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente',
  motivo_rejeicao TEXT,
  avaliado_por    TEXT REFERENCES usuarios(id),
  avaliado_em     TEXT,
  ativo           INTEGER NOT NULL DEFAULT 1,
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX idx_justificativa_unica ON justificativas_ponto (usuario_id, data);

-- 16. Tabela Comentários em Tarefas
CREATE TABLE comentarios_tarefa (
    id TEXT PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id),
    autor_id TEXT NOT NULL REFERENCES usuarios(id),
    conteudo TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    atualizado_em TEXT,
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_comentarios_tarefa_id ON comentarios_tarefa(tarefa_id);

-- 17. Tabela Checklist de Tarefas
CREATE TABLE checklist_tarefa (
  id         TEXT NOT NULL PRIMARY KEY,
  tarefa_id  TEXT NOT NULL REFERENCES tarefas(id),
  texto      TEXT NOT NULL,
  concluido  INTEGER NOT NULL DEFAULT 0,
  ordem      INTEGER NOT NULL DEFAULT 0,
  criado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_checklist_tarefa ON checklist_tarefa(tarefa_id);

-- 18. Tabela Sessões QR
CREATE TABLE sessoes_qr (
  id              TEXT NOT NULL PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'pendente',
  usuario_id      TEXT REFERENCES usuarios(id),
  token_acesso    TEXT,
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expira_em       TEXT NOT NULL,
  ip_origem       TEXT,
  user_agent      TEXT
);

CREATE INDEX idx_sessoes_qr_status ON sessoes_qr(status);
CREATE INDEX idx_sessoes_qr_expira ON sessoes_qr(expira_em);

-- FIM DO SCHEMA
