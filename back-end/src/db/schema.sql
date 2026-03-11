-- ============================================
-- RESET + CREATE: Fábrica de Software
-- Ordem correta respeitando foreign keys
-- ============================================

-- Drop na ordem inversa das dependências
DROP TABLE IF EXISTS configuracoes_sistema;
DROP TABLE IF EXISTS tarefa_historico;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS avisos;
DROP TABLE IF EXISTS checklist_tarefa;
DROP TABLE IF EXISTS comentarios_tarefa;
DROP TABLE IF EXISTS justificativas_ponto;
DROP TABLE IF EXISTS ponto_registros;
DROP TABLE IF EXISTS projetos_membros;
DROP TABLE IF EXISTS tarefas_responsaveis;
DROP TABLE IF EXISTS tarefas;
DROP TABLE IF EXISTS projetos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS usuarios_organizacao;
DROP TABLE IF EXISTS grupos;
DROP TABLE IF EXISTS equipes;

-- ============================================
-- CRIAÇÃO DAS TABELAS
-- ============================================

-- 1. Pessoas e Perfis
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'MEMBRO',
    ativo INTEGER NOT NULL DEFAULT 1,
    foto_perfil TEXT,
    bio TEXT,
    funcoes TEXT DEFAULT '[]',
    visivel INTEGER NOT NULL DEFAULT 1,
    versao_token INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. Estrutura Organizacional
CREATE TABLE IF NOT EXISTS equipes (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    sub_lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS grupos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    equipe_id TEXT REFERENCES equipes(id) ON DELETE CASCADE,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS usuarios_organizacao (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    equipe_id TEXT NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    grupo_id TEXT REFERENCES grupos(id) ON DELETE SET NULL,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(usuario_id, equipe_id, grupo_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_org_usuario ON usuarios_organizacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_org_equipe ON usuarios_organizacao(equipe_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_org_grupo ON usuarios_organizacao(grupo_id);

-- 3. Gestão de Projetos e Tarefas
CREATE TABLE IF NOT EXISTS projetos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    publico INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tarefas (
    id TEXT NOT NULL PRIMARY KEY,
    projeto_id TEXT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'backlog',
    prioridade TEXT NOT NULL DEFAULT 'media',
    pontos INTEGER DEFAULT 1,
    modulo TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_tarefas_projeto ON tarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status_ativo ON tarefas(projeto_id, status, ativo);
CREATE INDEX IF NOT EXISTS idx_tarefas_modulo ON tarefas(modulo);

CREATE TABLE IF NOT EXISTS tarefas_responsaveis (
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (tarefa_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS projetos_membros (
    projeto_id TEXT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    papel_no_projeto TEXT DEFAULT 'MEMBRO',
    PRIMARY KEY (projeto_id, usuario_id)
);

-- 4. Ponto Eletrônico
CREATE TABLE IF NOT EXISTS ponto_registros (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    registrado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ip_origem TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ponto_usuario ON ponto_registros(usuario_id, registrado_em DESC);

CREATE TABLE IF NOT EXISTS justificativas_ponto (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    tipo TEXT NOT NULL,
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    motivo_rejeicao TEXT,
    avaliado_por TEXT REFERENCES usuarios(id),
    avaliado_em TEXT,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_justificativa_unica ON justificativas_ponto(usuario_id, data);

-- 5. Colaboração
CREATE TABLE IF NOT EXISTS comentarios_tarefa (
    id TEXT NOT NULL PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    autor_id TEXT NOT NULL REFERENCES usuarios(id),
    conteudo TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    atualizado_em TEXT
);

CREATE TABLE IF NOT EXISTS checklist_tarefa (
    id TEXT NOT NULL PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    concluido INTEGER NOT NULL DEFAULT 0,
    ordem INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 6. Comunicação
CREATE TABLE IF NOT EXISTS avisos (
    id TEXT NOT NULL PRIMARY KEY,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    prioridade TEXT NOT NULL DEFAULT 'info',
    criado_por TEXT NOT NULL REFERENCES usuarios(id),
    expira_em TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS notificacoes (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida INTEGER NOT NULL DEFAULT 0,
    link_acao TEXT,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 7. Logs e Histórico
CREATE TABLE IF NOT EXISTS logs (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    modulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    ip TEXT,
    entidade_tipo TEXT,
    entidade_id TEXT,
    dados_anteriores TEXT,
    dados_novos TEXT,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_criado_em ON logs(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_logs_modulo ON logs(modulo);
CREATE INDEX IF NOT EXISTS idx_logs_acao ON logs(acao);
CREATE INDEX IF NOT EXISTS idx_logs_usuario_id ON logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_entidade ON logs(entidade_tipo, entidade_id);

CREATE TABLE IF NOT EXISTS tarefa_historico (
    id TEXT NOT NULL PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    campo_alterado TEXT NOT NULL,
    valor_antigo TEXT,
    valor_novo TEXT,
    alterado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 8. Configurações e Auxiliares
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id TEXT NOT NULL PRIMARY KEY,
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL
);

-- 9. Seed
INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor) VALUES
('c1', 'permissoes_roles', '{"ADMIN":{"*":true},"COORDENADOR":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"organizacao:visualizar":true},"GESTOR":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"organizacao:visualizar":true},"LIDER":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"tarefas:editar":true,"tarefas:mover":true,"organizacao:visualizar":true,"organizacao:editar_equipe":true},"SUBLIDER":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"tarefas:mover":true,"organizacao:visualizar":true},"MEMBRO":{"ponto:visualizar":true,"ponto:justificar":true,"tarefas:visualizar":true,"tarefas:comentar":true}}');