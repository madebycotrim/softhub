-- Migração para correção de permissões e dependências de tarefas
-- Aplique com: wrangler d1 execute softhub_db --local --file=src/db/migrations/005_corrigir_permissoes.sql

-- 1. Garante que o projeto padrão existe para evitar erro de Foreign Key
INSERT OR IGNORE INTO projetos (id, nome, descricao) 
VALUES ('d62657e4-230b-4680-a292-06b291d2f62b', 'Projeto Principal', 'Fábrica de Software - Backlog Geral');

-- 2. Atualiza a matriz de permissões para incluir 'tarefas:criar' e 'tarefas:checklist'
-- O JSON foi formatado para suportar futuras manutenções
UPDATE configuracoes_sistema 
SET valor = '{
    "ADMIN": {"*": true},
    "COORDENADOR": {
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "tarefas:visualizar": true,
        "tarefas:criar": true,
        "tarefas:editar": true,
        "tarefas:mover": true,
        "organizacao:visualizar": true
    },
    "GESTOR": {
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "tarefas:visualizar": true,
        "tarefas:criar": true,
        "tarefas:editar": true,
        "tarefas:mover": true,
        "organizacao:visualizar": true
    },
    "LIDER": {
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "tarefas:visualizar": true,
        "tarefas:criar": true,
        "tarefas:editar": true,
        "tarefas:mover": true,
        "organizacao:visualizar": true,
        "organizacao:editar_equipe": true,
        "tarefas:checklist": true
    },
    "SUBLIDER": {
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "tarefas:visualizar": true,
        "tarefas:criar": true,
        "tarefas:mover": true,
        "organizacao:visualizar": true,
        "tarefas:checklist": true
    },
    "MEMBRO": {
        "ponto:visualizar": true,
        "ponto:justificar": true,
        "tarefas:visualizar": true,
        "tarefas:comentar": true
    }
}'
WHERE chave = 'permissoes_roles';
