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
