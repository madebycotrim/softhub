-- Seed.sql - Dados Iniciais para testes (Ambiente sem Sprints)

-- Usuários
INSERT INTO usuarios (id, nome, email, role, ativo, foto_perfil, bio) VALUES
('u1', 'Mateus Oliveira', 'mateus@unieuro.com.br', 'SUBLIDER', 1, NULL, 'Focado no backend e front.'),
('u2', 'Ana Souza', 'ana.souza@unieuro.com.br', 'ADMIN', 1, NULL, 'Professora orientadora.'),
('u3', 'Carlos Mendes', 'carlos.m@unieuro.com.br', 'MEMBRO', 1, NULL, NULL);

-- Projetos
INSERT INTO projetos (id, nome, descricao, publico) VALUES
('p1', 'Sistema Interno Fábrica', 'Gestão centralizada de kanban e membros.', 0),
('p2', 'Portfolio Externo', 'Site institucional com projetos públicos.', 1);

-- Tarefas
INSERT INTO tarefas (id, projeto_id, titulo, descricao, status, prioridade, pontos) VALUES
('t1', 'p1', 'Criar tela de login', 'Integrar MSAL', 'concluido', 'alta', 5),
('t2', 'p1', 'Ajustar hooks gerais', 'Refatoração do sistema', 'em_andamento', 'media', 3),
('t3', 'p1', 'Corrigir bug na home', 'Ajustar padding do layout', 'a_fazer', 'urgente', 8);

-- Responsáveis das Tarefas
INSERT INTO tarefas_responsaveis (tarefa_id, usuario_id) VALUES
('t1', 'u1'),
('t2', 'u3'),
('t3', 'u1');

-- Avisos
INSERT INTO avisos (id, titulo, conteudo, prioridade, criado_por) VALUES
('av1', 'Novo modulo Kanban no ar!', 'Migramos o sistema para DnD Kit.', 'importante', 'u1');

-- Logs
INSERT INTO logs (id, usuario_id, usuario_nome, usuario_email, usuario_role, acao, modulo, descricao) VALUES
('log1', 'u1', 'Mateus Oliveira', 'mateus@unieuro.com.br', 'SUBLIDER', 'LOGIN', 'autenticacao', 'Sessão iniciada via MSAL');

-- Configurações Iniciais do Sistema
INSERT INTO configuracoes_sistema (id, chave, valor) VALUES
('c1', 'permissoes_roles', '{"ADMIN":{"*":true},"COORDENADOR":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"organizacao:visualizar":true},"GESTOR":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"organizacao:visualizar":true},"LIDER":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"tarefas:editar":true,"tarefas:mover":true,"organizacao:visualizar":true,"organizacao:editar_equipe":true},"SUBLIDER":{"ponto:visualizar":true,"ponto:aprovar_justificativa":true,"tarefas:visualizar":true,"tarefas:mover":true,"organizacao:visualizar":true},"MEMBRO":{"ponto:visualizar":true,"ponto:justificar":true,"tarefas:visualizar":true,"tarefas:comentar":true}}');
