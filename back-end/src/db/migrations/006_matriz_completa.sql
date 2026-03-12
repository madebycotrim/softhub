-- Migração para atualizar a matriz de permissões com nomes granulares
-- Aplique com: wrangler d1 execute softhub_db --local --file=src/db/migrations/006_matriz_completa.sql

UPDATE configuracoes_sistema 
SET valor = '{
    "ADMIN": {"*": true},
    "COORDENADOR": {
        "dashboard:visualizar": true,
        "tarefas:visualizar_kanban": true,
        "tarefas:visualizar_backlog": true,
        "tarefas:visualizar_detalhes": true,
        "tarefas:visualizar_historico": true,
        "tarefas:criar": true,
        "tarefas:editar": true,
        "tarefas:mover": true,
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "ponto:exportar": true,
        "membros:gerenciar": true,
        "equipes:visualizar": true,
        "relatorios:visualizar": true,
        "relatorios:imprimir": true,
        "avisos:visualizar": true,
        "logs:visualizar": true,
        "configuracoes:visualizar": true
    },
    "GESTOR": {
        "dashboard:visualizar": true,
        "tarefas:visualizar_kanban": true,
        "tarefas:visualizar_backlog": true,
        "tarefas:visualizar_detalhes": true,
        "tarefas:visualizar_historico": true,
        "tarefas:criar": true,
        "tarefas:editar": true,
        "tarefas:mover": true,
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "ponto:exportar": true,
        "membros:gerenciar": true,
        "equipes:visualizar": true,
        "relatorios:visualizar": true,
        "relatorios:imprimir": true,
        "avisos:visualizar": true,
        "logs:visualizar": true,
        "configuracoes:visualizar": true
    },
    "LIDER": {
        "dashboard:visualizar": true,
        "tarefas:visualizar_kanban": true,
        "tarefas:visualizar_backlog": true,
        "tarefas:visualizar_detalhes": true,
        "tarefas:visualizar_historico": true,
        "tarefas:criar": true,
        "tarefas:editar": true,
        "tarefas:mover": true,
        "tarefas:checklist": true,
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "equipes:visualizar": true,
        "equipes:editar_equipe": true,
        "equipes:alocar_membro": true,
        "avisos:visualizar": true,
        "avisos:criar": true,
        "sistema:notificacoes": true
    },
    "SUBLIDER": {
        "dashboard:visualizar": true,
        "tarefas:visualizar_kanban": true,
        "tarefas:visualizar_backlog": true,
        "tarefas:visualizar_detalhes": true,
        "tarefas:mover": true,
        "tarefas:checklist": true,
        "ponto:visualizar": true,
        "ponto:aprovar_justificativa": true,
        "equipes:visualizar": true,
        "avisos:visualizar": true,
        "avisos:criar": true
    },
    "MEMBRO": {
        "dashboard:visualizar": true,
        "tarefas:visualizar_kanban": true,
        "tarefas:visualizar_backlog": true,
        "tarefas:visualizar_detalhes": true,
        "tarefas:comentar": true,
        "ponto:registrar": true,
        "ponto:visualizar": true,
        "ponto:justificar": true,
        "avisos:visualizar": true
    },
    "TODOS": {
        "avisos:visualizar": true
    }
}'
WHERE chave = 'permissoes_roles';

-- Configurações iniciais de Governança
INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor) VALUES
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'dominios_autorizados', '["unieuro.com.br", "unieuro.edu.br"]'),
('c3d4e5f6-a7b8-4c9d-d0e1-2f3a4b5c6d7e', 'auto_cadastro', 'false');
