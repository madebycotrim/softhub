import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';

const rotasDashboard = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Obter dados agregados do dashboard
rotasDashboard.get('/', autenticacaoRequerida(), verificarPermissao('dashboard:visualizar'), async (c: Context) => {
    const { DB, SISTEMA_KV } = c.env;
    const projetoId = c.req.query('projetoId') || 'p1';
    const cacheKey = `dashboard_metrics_${projetoId}`;

    try {
        // 1. Tenta buscar do cache (5 min)
        const cached = await SISTEMA_KV.get(cacheKey);
        if (cached) {
            return c.json(JSON.parse(cached));
        }

        // 2. Se não houver cache, calcula no D1
        const countQuery = await DB.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as concluidas,
                SUM(CASE WHEN t.status != 'concluido' AND t.prioridade = 'urgente' THEN 1 ELSE 0 END) as atrasadas
            FROM tarefas t
            WHERE t.projeto_id = ?
        `).bind(projetoId).first() as any;

        const horasHoje = await DB.prepare(`
            SELECT COUNT(*) as batidas FROM ponto_registros WHERE date(registrado_em) = date('now')
        `).first() as any;

        const total = Number(countQuery?.total || 0);
        const concluidas = Number(countQuery?.concluidas || 0);

        const metricas = {
            totalTarefas: total,
            tarefasConcluidas: concluidas,
            tarefasAtrasadas: Number(countQuery?.atrasadas || 0),
            horasRegistradasHoje: (Number(horasHoje?.batidas || 0)) * 4,
            progressoGeral: total > 0 ? Math.round((concluidas / total) * 100) : 0
        };

        const resposta = {
            metricas,
            avisos: [],
            minhasTarefas: []
        };

        // 3. Salva no cache por 5 minutos
        await SISTEMA_KV.put(cacheKey, JSON.stringify(resposta), { expirationTtl: 300 });

        return c.json(resposta);
    } catch (erro) {
        console.error('[ERRO DB] GET /dashboard', erro);
        return c.json({ erro: 'Falha ao buscar dashboard' }, 500);
    }
});

export default rotasDashboard;
