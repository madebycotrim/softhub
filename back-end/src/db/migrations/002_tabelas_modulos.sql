-- Migração 002: Dados Iniciais e Permissões
-- Copiado de seed.sql

-- Configurações Iniciais do Sistema (Permissões de Roles)
INSERT OR IGNORE INTO configuracoes_sistema (id, chave, valor) VALUES
('c1', 'permissoes_roles', '{"ADMIN":{"*":true},"COORDENADOR":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"organizacao:visualizar":true},"GESTOR":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"organizacao:visualizar":true},"LIDER":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"tarefas:editar":true,"tarefas:mover":true,"organizacao:visualizar":true,"organizacao:editar_equipe":true},"SUBLIDER":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"tarefas:mover":true,"organizacao:visualizar":true},"MEMBRO":{"ponto:visualizar":true,"ponto:justificar":true,"tarefas:visualizar":true,"tarefas:comentar":true}}');
