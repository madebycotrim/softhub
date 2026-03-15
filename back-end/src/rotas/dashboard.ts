import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';

const rotasDashboard = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Obter dados agregados do dashboard (Global ou por Projeto)
rotasDashboard.get('/', autenticacaoRequerida(), verificarPermissao('dashboard:visualizar'), async (c: Context) => {
    const { DB, softhub_kv } = c.env;
    const projetoId = c.req.query('projetoId');
    const usuarioLogado = c.get('usuario') as any;

    try {
        let projetosIds: string[] = [];
        let nomesProjetos: string[] = [];

        if (projetoId && projetoId !== 'global') {
            projetosIds = [projetoId];
            const p = await DB.prepare('SELECT nome FROM projetos WHERE id = ?').bind(projetoId).first() as any;
            if (p) nomesProjetos = [p.nome];
        } else {
            // Dashboard Global: Projetos onde o usuário possui tarefas atribuídas
            const { results } = await DB.prepare(`
                SELECT DISTINCT p.id, p.nome 
                FROM projetos p
                JOIN tarefas t ON t.projeto_id = p.id
                JOIN tarefas_responsaveis tr ON tr.tarefa_id = t.id
                WHERE tr.usuario_id = ?
            `).bind(usuarioLogado.id).all();
            
            projetosIds = results.map((r: any) => r.id);
            nomesProjetos = results.map((r: any) => r.nome);
        }

        if (projetosIds.length === 0) {
            return c.json({
                metricas: { totalTarefas: 0, tarefasConcluidas: 0, tarefasAtrasadas: 0, horasRegistradasHoje: 0, progressoGeral: 0 },
                avisos: [],
                minhasTarefas: [],
                projetosAtivos: []
            });
        }

        const cacheKey = `dashboard_metrics_${projetoId || 'global'}_${usuarioLogado.id}`;
        const cached = await softhub_kv.get(cacheKey);
        if (cached) return c.json(JSON.parse(cached));

        const placeholders = projetosIds.map(() => '?').join(',');
        
        // Métricas Consolidadas
        const countQuery = await DB.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN t.status = 'concluido' THEN 1 ELSE 0 END) as concluidas,
                SUM(CASE WHEN t.status != 'concluido' AND t.prioridade = 'urgente' THEN 1 ELSE 0 END) as atrasadas
            FROM tarefas t
            WHERE t.projeto_id IN (${placeholders})
        `).bind(...projetosIds).first() as any;

        const horasHoje = await DB.prepare(`
            SELECT COUNT(*) as batidas FROM ponto_registros 
            WHERE usuario_id = ? AND date(registrado_em, '-3 hours') = date('now', '-3 hours')
        `).bind(usuarioLogado.id).first() as any;

        const total = Number(countQuery?.total || 0);
        const concluidas = Number(countQuery?.concluidas || 0);

        const metricas = {
            totalTarefas: total,
            tarefasConcluidas: concluidas,
            tarefasAtrasadas: Number(countQuery?.atrasadas || 0),
            horasRegistradasHoje: (Number(horasHoje?.batidas || 0)) * 4,
            progressoGeral: total > 0 ? Math.round((concluidas / total) * 100) : 0
        };

        // Avisos (Global)
        const { results: avisos } = await DB.prepare(`
            SELECT a.id, a.titulo, a.conteudo, a.prioridade, a.criado_em, 
                   u.nome as autor_nome, u.foto_perfil as autor_foto
            FROM avisos a
            JOIN usuarios u ON a.criado_por = u.id
            WHERE a.expira_em IS NULL OR a.expira_em > datetime('now')
            ORDER BY a.criado_em DESC LIMIT 3
        `).all();

        // Minhas Tarefas (de todos os projetos monitorados)
        const { results: minhasTarefas } = await DB.prepare(`
            SELECT t.id, t.titulo, t.status, t.prioridade, p.nome as projeto_nome
            FROM tarefas t
            JOIN tarefas_responsaveis tr ON tr.tarefa_id = t.id
            JOIN projetos p ON t.projeto_id = p.id
            WHERE tr.usuario_id = ? AND t.status != 'concluido' AND t.projeto_id IN (${placeholders})
            ORDER BY t.criado_em DESC LIMIT 5
        `).bind(usuarioLogado.id, ...projetosIds).all();

        const resposta = { 
            metricas, 
            avisos: avisos.map((a: any) => ({
                id: a.id, titulo: a.titulo, conteudo: a.conteudo, prioridade: a.prioridade, criado_em: a.criado_em,
                criado_por: { nome: a.autor_nome, foto: a.autor_foto }
            })), 
            minhasTarefas,
            projetosAtivos: nomesProjetos
        };

        await softhub_kv.put(cacheKey, JSON.stringify(resposta), { expirationTtl: 300 }); // 5 min
        return c.json(resposta);
    } catch (erro) {
        console.error('[ERRO DB] GET /dashboard', erro);
        return c.json({ erro: 'Falha ao buscar dashboard consolidado' }, 500);
    }
});







export default rotasDashboard;
