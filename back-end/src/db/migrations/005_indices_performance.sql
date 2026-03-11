-- Evita varredura em massa ao carregar o Ponto do colaborador logado
CREATE INDEX IF NOT EXISTS idx_ponto_usuario ON registros_ponto(usuario_id, registrado_em DESC);

-- Acelera absurdamente o carregamento do Kanban visual
CREATE INDEX IF NOT EXISTS idx_tarefas_status_ativo ON tarefas(projeto_id, status, ativo);
