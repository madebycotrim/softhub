-- Migration 008 - Grupos e Equipes

-- 1. Tabela de Grupos (Entidade Hierárquica Maior)
CREATE TABLE grupos (
    id TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 2. Tabela de Equipes (Trabalham sob um Grupo)
CREATE TABLE equipes (
    id TEXT NOT NULL PRIMARY KEY,
    grupo_id TEXT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- 3. Referência 1:N no Usuário (Cada usuário pertence a, no máximo, 1 equipe)
ALTER TABLE usuarios ADD COLUMN equipe_id TEXT REFERENCES equipes(id) ON DELETE SET NULL;
