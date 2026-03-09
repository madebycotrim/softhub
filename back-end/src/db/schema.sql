-- SCHEMA BLINDADO - SoftHub (Definitivo v1)
-- Este arquivo é a fonte única de verdade para a estrutura do banco de dados (SQLite/D1).
-- Segue as Regras Absolutas: IDs UUID, Datas ISO 8601 UTC, Soft Delete em tudo.

-- 1. Tabela de Pessoas
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'MEMBRO', -- ADMIN, LIDER_GRUPO, LIDER_EQUIPE, MEMBRO, VISITANTE
    ativo INTEGER NOT NULL DEFAULT 1,
    foto_perfil TEXT,
    bio TEXT,
    funcoes TEXT DEFAULT '[]', -- JSON: ['FRONTEND', 'BACKEND', etc]
    equipe_id TEXT REFERENCES equipes(id), -- FK para equipes lógicas
    grupo_id TEXT REFERENCES grupos(id), -- FK para grupos de trabalho / turnos (A/B)
    visivel INTEGER NOT NULL DEFAULT 1,
    versao_token INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_equipe ON usuarios(equipe_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_grupo ON usuarios(grupo_id);

-- 2. Tabela de Estrutura: Grupos
CREATE TABLE IF NOT EXISTS grupos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL, -- Líder Administrativo do Grupo
    sub_lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 3. Tabela de Estrutura: Equipes
CREATE TABLE IF NOT EXISTS equipes (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    sub_lider_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 4. Tabela Projetos
CREATE TABLE IF NOT EXISTS projetos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    publico INTEGER NOT NULL DEFAULT 0,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 5. Tabela Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
    id TEXT NOT NULL PRIMARY KEY,
    projeto_id TEXT NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT NOT NULL DEFAULT 'a_fazer', -- a_fazer, em_andamento, em_revisao, concluido
    prioridade TEXT NOT NULL DEFAULT 'media', -- baixa, media, alta, urgente
    pontos INTEGER DEFAULT 1,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    atualizado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_tarefas_projeto ON tarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);

-- 6. Junções e Associações
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

-- 7. Ponto Eletrônico
CREATE TABLE IF NOT EXISTS ponto_registros (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- ENTRADA, SAIDA
    registrado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    ip_origem TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ponto_usuario ON ponto_registros(usuario_id, registrado_em);

CREATE TABLE IF NOT EXISTS justificativas_ponto (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    data TEXT NOT NULL, -- YYYY-MM-DD
    tipo TEXT NOT NULL, -- FALTA, ATRASO, SAIDA_ANTECIPADA
    motivo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovada, rejeitada
    motivo_rejeicao TEXT,
    avaliado_por TEXT REFERENCES usuarios(id),
    avaliado_em TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_justificativa_unica ON justificativas_ponto (usuario_id, data);

-- 8. Colaboração: Comentários e Checklists
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

-- 9. Comunicação e Engajamento
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

-- 10. Governança e Audit
CREATE TABLE IF NOT EXISTS logs (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nome TEXT,
    usuario_email TEXT,
    usuario_role TEXT,
    acao TEXT NOT NULL,
    modulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    ip TEXT,
    entidade_tipo TEXT,
    entidade_id TEXT,
    dados_anteriores TEXT, -- JSON
    dados_novos TEXT, -- JSON
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS tarefa_historico (
    id TEXT NOT NULL PRIMARY KEY,
    tarefa_id TEXT NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id),
    campo_alterado TEXT NOT NULL,
    valor_antigo TEXT,
    valor_novo TEXT,
    alterado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 11. Configurações de Negócio Dinâmicas
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id TEXT NOT NULL PRIMARY KEY,
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL -- Geralmente JSON
);

-- 12. Sessões e QR Logic
CREATE TABLE IF NOT EXISTS sessoes_qr (
    id TEXT NOT NULL PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pendente',
    usuario_id TEXT REFERENCES usuarios(id),
    token_acesso TEXT,
    ip_origem TEXT,
    user_agent TEXT,
    expira_em TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
