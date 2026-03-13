import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';

const rotasDashboard = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Obter dados agregados do dashboard
rotasDashboard.get('/', autenticacaoRequerida(), verificarPermissao('dashboard:visualizar'), async (c: Context) => {
    const { DB, softhub_kv } = c.env;
    const projetoId = c.req.query('projetoId');
    const cacheKey = `dashboard_metrics_${projetoId}`;

    try {
        // 1. Tenta buscar do cache (5 min)
        const cached = await softhub_kv.get(cacheKey);
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

        // 3. Buscar os 3 últimos avisos ativos
        const { results: avisos } = await DB.prepare(`
            SELECT id, titulo, prioridade, criado_em FROM avisos 
            WHERE expira_em IS NULL OR expira_em > datetime('now')
            ORDER BY criado_em DESC LIMIT 3
        `).all();

        // 4. Buscar as 5 tarefas mais recentes atribuídas ao usuário logado
        const usuario = c.get('usuario') as any;
        const { results: minhasTarefas } = await DB.prepare(`
            SELECT t.id, t.titulo, t.status, t.prioridade 
            FROM tarefas t
            JOIN tarefas_responsaveis tr ON tr.tarefa_id = t.id
            WHERE tr.usuario_id = ? AND t.status != 'concluido'
            ORDER BY t.criado_em DESC LIMIT 5
        `).bind(usuario.id).all();

        const resposta = {
            metricas,
            avisos,
            minhasTarefas
        };

        // 3. Salva no cache por 5 minutos
        await softhub_kv.put(cacheKey, JSON.stringify(resposta), { expirationTtl: 300 });

        return c.json(resposta);
    } catch (erro) {
        console.error('[ERRO DB] GET /dashboard', erro);
        return c.json({ erro: 'Falha ao buscar dashboard' }, 500);
    }
});

// Obter dados para o gráfico de BurnDown (Fase 3)
rotasDashboard.get('/burndown', autenticacaoRequerida(), verificarPermissao('dashboard:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    const projetoId = c.req.query('projetoId');
    if (!projetoId) return c.json({ erro: 'ProjetoID é obrigatório' }, 400);

    try {
        // Busca as tarefas do projeto para calcular os pontos
        const { results: tarefas } = await DB.prepare(`
            SELECT pontos, status, criado_em, data_conclusao 
            FROM tarefas 
            WHERE projeto_id = ?
        `).bind(projetoId).all() as { results: any[] };

        const totalPontos = tarefas.reduce((acc: number, t: any) => acc + (t.pontos || 0), 0);
        
        // Vamos gerar os últimos 15 dias
        const hoje = new Date();
        const dias = [];
        for (let i = 14; i >= 0; i--) {
            const d = new Date(hoje);
            d.setDate(d.getDate() - i);
            dias.push(d.toISOString().split('T')[0]);
        }

        const dataBurndown = dias.map((dia, index) => {
            // Pontos restantes no final deste dia
            const pontosRestantes = tarefas.reduce((acc: number, t: any) => {
                const criadoEm = t.criado_em.split('T')[0];
                const concluidoEm = t.data_conclusao ? t.data_conclusao.split('T')[0] : null;

                // Se a tarefa existia neste dia e não estava concluída (ou foi concluída depois)
                if (criadoEm <= dia && (!concluidoEm || concluidoEm > dia)) {
                    return acc + (t.pontos || 0);
                }
                return acc;
            }, 0);

            // Linha Ideal (simples regressão linear do total até zero)
            const ideal = Math.max(0, totalPontos - (totalPontos / 14) * index);

            return {
                dia: dia.split('-').reverse().slice(0, 2).reverse().join('/'), // DD/MM
                real: pontosRestantes,
                ideal: Math.round(ideal)
            };
        });

        return c.json(dataBurndown);
    } catch (e) {
        console.error('[ERRO Burndown]', e);
        return c.json({ erro: 'Falha ao gerar burndown' }, 500);
    }
});

export default rotasDashboard;
