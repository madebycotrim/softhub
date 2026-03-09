import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';

const rotasDashboard = new Hono<{ Bindings: Env }>();

// Obter dados agregados do dashboard
rotasDashboard.get('/', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const projetoId = c.req.query('projetoId') || 'p1';

    try {
        // 1. Métricas do Projeto (Total das tarefas ativas do projeto)
        const countQuery = await DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as concluidas,
        SUM(CASE WHEN t.status != 'concluido' AND t.prioridade = 'urgente' THEN 1 ELSE 0 END) as atrasadas
      FROM tarefas t
      WHERE t.projeto_id = ? AND t.ativo = 1
    `).bind(projetoId).first() as any;

        const horasHoje = await DB.prepare(`
      SELECT COUNT(*) as batidas FROM ponto_registros WHERE date(registrado_em) = date('now')
    `).first() as any;

        const metricasSimuladas = {
            totalTarefas: countQuery?.total || 0,
            tarefasConcluidas: countQuery?.concluidas || 0,
            tarefasAtrasadas: countQuery?.atrasadas || 0,
            horasRegistradasHoje: (horasHoje?.batidas || 0) * 4,
            progressoGeral: countQuery?.total > 0 ? Math.round((countQuery.concluidas / countQuery.total) * 100) : 0
        };

        return c.json({
            metricas: metricasSimuladas,
            avisos: [], // Será preenchido por cada serviço ou via agregação
            minhasTarefas: [] // Será preenchido por cada serviço ou via agregação
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /dashboard', erro);
        return c.json({ erro: 'Falha ao buscar dashboard' }, 500);
    }
});

export default rotasDashboard;
