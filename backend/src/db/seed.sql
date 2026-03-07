-- Seed.sql - Dados Iniciais para testes (Mock da Etapa 5)

-- Usuários
INSERT INTO usuarios (id, nome, email, role, ativo, foto_perfil, bio) VALUES
('u1', 'Mateus Oliveira', 'mateus@unieuro.com.br', 'LIDER_EQUIPE', 1, NULL, 'Focado no backend e front.'),
('u2', 'Ana Souza', 'ana.souza@unieuro.com.br', 'ADMIN', 1, NULL, 'Professora orientadora.'),
('u3', 'Carlos Mendes', 'carlos.m@unieuro.com.br', 'MEMBRO', 0, NULL, NULL);

-- Projetos
INSERT INTO projetos (id, nome, descricao, publico) VALUES
('p1', 'Sistema Interno Fábrica', 'Gestão de sprints, kanban e membros.', 0),
('p2', 'Portfolio Externo', 'Site institucional com projetos públicos.', 1);

-- Sprints
INSERT INTO sprints (id, projeto_id, nome, status, data_inicio, data_fim, velocity_planejado) VALUES
('s1', 'p1', 'Sprint 1 - Autenticação', 'encerrada', '2026-03-01T08:00:00Z', '2026-03-05T18:00:00Z', 20),
('s2', 'p1', 'Sprint 2 - Kanban V2', 'ativa', '2026-03-06T08:00:00Z', NULL, 30);

-- Tarefas
INSERT INTO tarefas (id, projeto_id, sprint_id, titulo, descricao, status, prioridade, pontos) VALUES
('t1', 'p1', 's1', 'Criar tela de login', 'Integrar MSAL', 'concluido', 'alta', 5),
('t2', 'p1', 's2', 'Ajustar hooks gerais', NULL, 'em_andamento', 'media', 3),
('t3', 'p1', 's2', 'Corrigir bug na home', 'Erro 404', 'a_fazer', 'urgente', 8);

-- Responsáveis das Tarefas
INSERT INTO tarefas_responsaveis (tarefa_id, usuario_id) VALUES
('t1', 'u1'),
('t3', 'u1');

-- Avisos
INSERT INTO avisos (id, titulo, conteudo, prioridade, criado_por) VALUES
('av1', 'Novo módulo Kanban no ar!', 'Migramos o sistema para DnD Kit.', 'info', 'u1');

-- Logs
INSERT INTO logs (id, usuario_id, usuario_nome, usuario_email, usuario_role, acao, modulo, descricao) VALUES
('log1', 'u1', 'Mateus Oliveira', 'mateus@unieuro.com.br', 'LIDER_EQUIPE', 'LOGIN', 'auth', 'Sessão iniciada via MSAL');
