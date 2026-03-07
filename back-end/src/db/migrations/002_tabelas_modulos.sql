-- Migration 002 - Tabelas de Módulos (Sprints, Tarefas, Avisos, Ponto, Logs)

-- Tabela Projetos / Times
CREATE TABLE projetos (
  id TEXT NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  publico INTEGER NOT NULL DEFAULT 0, -- 1 para exibir no portfolio externo
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Tabela Projetos_Membros (N:N)
CREATE TABLE projetos_membros (
  projeto_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  papel_no_projeto TEXT NOT NULL DEFAULT 'MEMBRO', -- para permissões granulares futuras
  PRIMARY KEY (projeto_id, usuario_id),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Sprints
CREATE TABLE sprints (
  id TEXT NOT NULL PRIMARY KEY,
  projeto_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  objetivo TEXT,
  status TEXT NOT NULL DEFAULT 'planejada', -- planejada, ativa, encerrada
  data_inicio TEXT,
  data_fim TEXT,
  velocity_planejado INTEGER,
  velocity_realizado INTEGER,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

-- Tabela Tarefas
CREATE TABLE tarefas (
  id TEXT NOT NULL PRIMARY KEY,
  projeto_id TEXT NOT NULL,
  sprint_id TEXT, -- nulo = backlog
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'a_fazer', -- backlog, a_fazer, em_andamento, em_revisao, concluido, testando
  prioridade TEXT NOT NULL DEFAULT 'media', -- urgente, alta, media, baixa
  pontos INTEGER,
  ativo INTEGER NOT NULL DEFAULT 1, -- soft delete (0 = arquivada)
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
);

-- Tabela Tarefas_Responsaveis (N:N)
CREATE TABLE tarefas_responsaveis (
  tarefa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  PRIMARY KEY (tarefa_id, usuario_id),
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Tarefa_Historico (Imutável)
CREATE TABLE tarefa_historico (
  id TEXT NOT NULL PRIMARY KEY,
  tarefa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  campo_alterado TEXT NOT NULL, -- ex: 'status', 'sprint_id'
  valor_antigo TEXT,
  valor_novo TEXT,
  alterado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Avisos
CREATE TABLE avisos (
  id TEXT NOT NULL PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'info', -- urgente, importante, info
  criado_por TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expira_em TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Ponto_Registros
CREATE TABLE ponto_registros (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- entrada, saida
  registrado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ip_origem TEXT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Notificacoes
CREATE TABLE notificacoes (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'sistema', 'tarefa', 'mencao'
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  link_acao TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela Logs de Auditoria (Imutável)
CREATE TABLE logs (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT, -- Pode ser null para eventos de sistema
  acao TEXT NOT NULL,
  detalhes TEXT NOT NULL,
  tabela_afetada TEXT,
  registro_id TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
