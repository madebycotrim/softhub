import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';

const rotasDashboard = new Hono<{ Bindings: Env }>();

// Obter dados agregados do dashboard
rotasDashboard.get('/', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const projetoId = c.req.query('projetoId') || 'p1';

    try {
        // 1. Obter a sprint ativa
        const sprintAtiva = await DB.prepare(`
      SELECT id, nome FROM sprints WHERE projeto_id = ? AND status = 'ativa' LIMIT 1
    `).bind(projetoId).first();

        const sprintId = sprintAtiva?.id;

        // 2. Métricas
        const countQuery = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN t.status != 'concluido' AND t.prioridade = 'urgente' THEN 1 ELSE 0 END) as atrasadas
      FROM tarefas t
      WHERE t.projeto_id = ? AND t.sprint_id = ? AND t.ativo = 1
    `).bind(projetoId, sprintId || 'none').first() as any;

        const horasHoje = await DB.prepare(`
      SELECT COUNT(*) as batidas FROM ponto_registros WHERE date(registrado_em) = date('now')
    `).first() as any;

        const metricasSimuladas = {
            totalTarefas: countQuery?.total || 0,
            tarefasConcluidas: countQuery?.concluidas || 0,
            tarefasAtrasadas: countQuery?.atrasadas || 0,
            horasRegistradasHoje: (horasHoje?.batidas || 0) * 4, // Simulando 4 horas por batida pro dashboard mock
            progressoSprint: countQuery?.total > 0 ? Math.round((countQuery.concluidas / countQuery.total) * 100) : 0,
            diasRestantesSprint: sprintId ? 7 : 0
        };

        // 3. Burndown Simulado baseado nos pontos pra não estender muito o SQL analítico nesta fundação
        const burndownSimulado = [
            { dia: 'Seg', planejado: 50, realizado: 50 },
            { dia: 'Ter', planejado: 40, realizado: 45 },
            { dia: 'Qua', planejado: 30, realizado: 38 },
            { dia: 'Qui', planejado: 20, realizado: 25 },
            { dia: 'Sex', planejado: 10, realizado: 20 }
        ];

        // 4. Velocity Histórico
        const sptsStatus = await DB.prepare(`
        SELECT nome as sprint, velocity_realizado as pontos
        FROM sprints
        WHERE projeto_id = ? AND status = 'encerrada'
        ORDER BY criado_em DESC LIMIT 5
    `).bind(projetoId).all();

        const mockVelocity = sptsStatus.results.map((s: any) => ({
            sprint: s.sprint,
            pontos: s.pontos || 0
        })).reverse();

        return c.json({
            metricas: metricasSimuladas,
            burndown: burndownSimulado,
            velocity: mockVelocity.length > 0 ? mockVelocity : []
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /dashboard', erro);
        return c.json({ erro: 'Falha ao buscar dashboard' }, 500);
    }
});

export default rotasDashboard;
