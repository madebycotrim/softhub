-- 🗄️ SCHEMA.sql Completo - Fábrica de Software
-- Este arquivo contém todas as tabelas, índices e dados iniciais necessários.
-- Ideal para ser executado manualmente no painel Cloudflare D1 ou via Wrangler.

-- 1. TABELAS HIERÁRQUICAS (Grupos e Equipes)
CREATE TABLE grupos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE equipes (
    id TEXT NOT NULL PRIMARY KEY,
    grupo_id TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 2. TABELA USUÁRIOS
CREATE TABLE usuarios (
  id TEXT NOT NULL PRIMARY KEY,
  equipe_id TEXT REFERENCES equipes(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'MEMBRO',
  ativo INTEGER NOT NULL DEFAULT 1,
  foto_perfil TEXT,
  bio TEXT,
  -- Colunas de Gamificação
  xp INTEGER NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'Trainee',
  streak_atual INTEGER NOT NULL DEFAULT 0,
  streak_maximo INTEGER NOT NULL DEFAULT 0,
  ultima_atividade TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 3. GESTÃO DE PROJETOS E TAREFAS
CREATE TABLE projetos (
  id TEXT NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  publico INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE projetos_membros (
  projeto_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  papel_no_projeto TEXT NOT NULL DEFAULT 'MEMBRO',
  PRIMARY KEY (projeto_id, usuario_id),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

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
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
);

CREATE TABLE tarefas (
  id TEXT NOT NULL PRIMARY KEY,
  projeto_id TEXT NOT NULL,
  sprint_id TEXT,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'a_fazer', -- backlog, a_fazer, em_andamento, em_revisao, concluido, testando
  prioridade TEXT NOT NULL DEFAULT 'media', -- urgente, alta, media, baixa
  pontos INTEGER,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE,
  FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE SET NULL
);

CREATE TABLE tarefas_responsaveis (
  tarefa_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  PRIMARY KEY (tarefa_id, usuario_id),
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

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

CREATE TABLE checklist_tarefa (
  id TEXT NOT NULL PRIMARY KEY,
  tarefa_id TEXT NOT NULL REFERENCES tarefas(id),
  texto TEXT NOT NULL,
  concluido INTEGER NOT NULL DEFAULT 0,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE comentarios_tarefa (
    id TEXT PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id),
    autor_id TEXT NOT NULL REFERENCES usuarios(id),
    conteudo TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    atualizado_em TEXT,
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE retrospectivas (
  id TEXT NOT NULL PRIMARY KEY,
  sprint_id TEXT NOT NULL UNIQUE REFERENCES sprints(id) ON DELETE CASCADE,
  o_que_foi_bem TEXT,
  o_que_melhorar TEXT,
  acoes_proxima_sprint TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 4. PONTO E JUSTIFICATIVAS
CREATE TABLE ponto_registros (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  tipo TEXT NOT NULL, -- entrada, saida
  registrado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ip_origem TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE justificativas_ponto (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  data TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'ausencia', 'esquecimento', 'problema_sistema'
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovada', 'rejeitada'
  motivo_rejeicao TEXT,
  avaliado_por TEXT REFERENCES usuarios(id),
  avaliado_em TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 5. COMUNICAÇÃO E SISTEMA
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

CREATE TABLE sessoes_qr (
  id TEXT NOT NULL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pendente',
  usuario_id TEXT REFERENCES usuarios(id),
  token_acesso TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expira_em TEXT NOT NULL,
  ip_origem TEXT,
  user_agent TEXT
);

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

-- 6. GAMIFICAÇÃO (Achievement System)
CREATE TABLE conquistas (
  id TEXT NOT NULL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE conquistas_usuarios (
  id TEXT NOT NULL PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  conquista_id TEXT NOT NULL REFERENCES conquistas(id),
  desbloqueado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(usuario_id, conquista_id)
);

-- 7. ÍNDICES
CREATE UNIQUE INDEX idx_justificativa_unica ON justificativas_ponto (usuario_id, data);
CREATE INDEX idx_comentarios_tarefa_id ON comentarios_tarefa(tarefa_id);
CREATE INDEX idx_checklist_tarefa ON checklist_tarefa(tarefa_id);
CREATE INDEX idx_sessoes_qr_status ON sessoes_qr(status);
CREATE INDEX idx_sessoes_qr_expira ON sessoes_qr(expira_em);

-- 8. DADOS INICIAIS (Catálogo de Conquistas)
INSERT INTO conquistas (id, codigo, titulo, descricao, icone, xp_bonus) VALUES
('c1', 'PRIMEIRA_TAREFA', 'Primeira Tarefa', 'Completou a primeira tarefa', '🎯', 20),
('c2', 'STREAK_7', 'Em Chamas', '7 dias seguidos de streak', '🔥', 50),
('c3', 'STREAK_30', 'Inabalável', '30 dias seguidos de streak', '💎', 200),
('c4', 'SPRINT_PERFEITA', 'Sprint Perfeita', 'Sprint encerrada com 100% das tarefas concluídas', '⚡', 100),
('c5', 'TOP_EQUIPE', 'Top da Equipe', 'Maior XP da equipe em um mês', '🏆', 75),
('c6', 'PONTUAL_30', 'Pontual', '30 dias batendo ponto sem falha', '⏰', 100),
('c7', 'TAREFAS_10', 'Produtivo', 'Completou 10 tarefas', '📦', 30),
('c8', 'TAREFAS_50', 'Veterano', 'Completou 50 tarefas', '🧠', 100),
('c9', 'URGENTE_5', 'Bombeiro', 'Completou 5 tarefas urgentes', '🚒', 80),
('c10', 'COMENTARISTA', 'Colaborador', 'Fez 20 comentários em tarefas', '💬', 40),
('c11', 'CHECKLIST_10', 'Organizado', 'Concluiu 10 checklists completos', '✅', 30);
