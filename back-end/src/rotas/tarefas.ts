import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { D1Database } from '@cloudflare/workers-types';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasTarefas = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar Tarefas (Backlog ou Sprint)
rotasTarefas.get('/', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const sprintId = c.req.query('sprintId');
    const projetoId = c.req.query('projetoId') || 'p1';

    // Workflow 26 - Parâmetros de Filtro
    const busca = c.req.query('busca');
    const prioridade = c.req.query('prioridade'); // Suporta multiplas separadas por vírgula
    const responsavelId = c.req.query('responsavelId');

    try {
        let query = `
      SELECT t.id, t.titulo, t.descricao, t.status, t.prioridade, t.pontos
      FROM tarefas t
      WHERE t.projeto_id = ? AND t.ativo = 1
    `;
        const params: any[] = [projetoId];

        if (sprintId === 'null') {
            query += ` AND t.sprint_id IS NULL`;
        } else if (sprintId) {
            query += ` AND t.sprint_id = ?`;
            params.push(sprintId);
        }

        if (busca) {
            query += ` AND (t.titulo LIKE ? OR t.descricao LIKE ?)`;
            params.push(`%${busca}%`, `%${busca}%`);
        }

        if (prioridade) {
            const prioridades = prioridade.split(',');
            const placeholders = prioridades.map(() => '?').join(',');
            query += ` AND t.prioridade IN (${placeholders})`;
            params.push(...prioridades);
        }

        if (responsavelId) {
            query += ` AND EXISTS (SELECT 1 FROM tarefas_responsaveis tr WHERE tr.tarefa_id = t.id AND tr.usuario_id = ?)`;
            params.push(responsavelId);
        }

        const { results: tarefas } = await DB.prepare(query).bind(...params).all();

        // Buscar responsáveis 
        for (const tarefa of tarefas) {
            const resp = await DB.prepare(`
        SELECT u.id, u.nome, u.foto_perfil as foto
        FROM usuarios u
        JOIN tarefas_responsaveis tr ON tr.usuario_id = u.id
        WHERE tr.tarefa_id = ?
      `).bind(tarefa.id).all();

            (tarefa as any).responsaveis = resp.results;
        }

        return c.json(tarefas);
    } catch (erro) {
        console.error('[ERRO DB] GET /tarefas', erro);
        return c.json({ erro: 'Falha ao buscar tarefas' }, 500);
    }
});

// Mover Tarefa
rotasTarefas.patch('/:id/mover', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const { status: colunaDestino } = await c.req.json();

    try {
        const usuario = c.get('usuario') as any; // tipagem simplificada

        // Obter status e prioridade atual da tarefa
        const { results } = await DB.prepare('SELECT titulo, status, prioridade FROM tarefas WHERE id = ?').bind(id).all();
        const tarefa = results[0] as { titulo: string, status: string, prioridade: string };

        if (!tarefa) {
            return c.json({ erro: 'Tarefa não encontrada' }, 404);
        }

        // Workflow 8 - Mover Card (Verificar permissão)
        const ehAdminOuLider = ['ADMIN', 'LIDER_GRUPO', 'LIDER_EQUIPE'].includes(usuario.role);
        let podeMover = ehAdminOuLider;

        if (!podeMover) {
            const resp = await DB.prepare('SELECT usuario_id FROM tarefas_responsaveis WHERE tarefa_id = ? AND usuario_id = ?').bind(id, usuario.id).first();
            if (resp) podeMover = true;
        }

        if (!podeMover) {
            return c.json({ erro: 'Apenas os responsáveis ou líderes podem mover esta tarefa.' }, 403);
        }

        if (tarefa.status !== colunaDestino) {
            await DB.prepare('UPDATE tarefas SET status = ?, atualizado_em = ? WHERE id = ?')
                .bind(colunaDestino, new Date().toISOString(), id).run();

            // Histórico
            await DB.prepare('INSERT INTO tarefa_historico (id, tarefa_id, usuario_id, campo_alterado, valor_antigo, valor_novo) VALUES (?, ?, ?, ?, ?, ?)')
                .bind(crypto.randomUUID(), id, usuario.id, 'status', tarefa.status, colunaDestino).run();

            await registrarLog(DB, {
                usuarioId: usuario.id,
                usuarioNome: usuario.nome,
                usuarioEmail: usuario.email,
                usuarioRole: usuario.role,
                acao: 'TAREFA_MOVIDA',
                modulo: 'kanban',
                descricao: `Tarefa "${tarefa.titulo}" movida para ${colunaDestino}`,
                ip: c.req.header('CF-Connecting-IP') ?? '',
                entidadeTipo: 'tarefas',
                entidadeId: id,
                dadosAnteriores: { status: tarefa.status },
                dadosNovos: { status: colunaDestino }
            });

            if (colunaDestino === 'em_revisao') {
                const { results: lideres } = await DB.prepare("SELECT id FROM usuarios WHERE role IN ('LIDER_EQUIPE', 'LIDER_GRUPO')").all();
                if (lideres) {
                    for (const row of lideres as any) {
                        await criarNotificacoes(DB, {
                            usuarioId: row.id,
                            tipo: 'tarefa',
                            titulo: 'Tarefa precisa de revisão',
                            mensagem: `A tarefa "${tarefa.titulo}" foi movida para Em Revisão por ${usuario.nome}.`,
                            link: `/app/kanban?tarefa=${id}`
                        });
                    }
                }
            }
        } return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /tarefas/:id/mover', erro);
        return c.json({ erro: 'Falha ao mover tarefa' }, 500);
    }
});

// Atribuir Responsável (WF 13)
rotasTarefas.post('/:id/responsaveis', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const { usuario_id } = await c.req.json();
    const usuario = c.get('usuario') as any;

    try {
        const ehAdminOuLider = ['ADMIN', 'LIDER_GRUPO', 'LIDER_EQUIPE'].includes(usuario.role);

        let podeAtribuir = ehAdminOuLider;
        if (!podeAtribuir) {
            const resp = await DB.prepare('SELECT usuario_id FROM tarefas_responsaveis WHERE tarefa_id = ? AND usuario_id = ?').bind(id, usuario.id).first();
            if (resp) podeAtribuir = true;
        }

        if (!podeAtribuir) {
            return c.json({ erro: 'Apenas liderança ou os responsáveis atuais da tarefa.' }, 403);
        }

        const tarefa = await DB.prepare('SELECT titulo FROM tarefas WHERE id = ?').bind(id).first<{ titulo: string }>();
        if (!tarefa) return c.json({ erro: 'Tarefa não encontrada' }, 404);

        await DB.prepare('INSERT OR IGNORE INTO tarefas_responsaveis (tarefa_id, usuario_id) VALUES (?, ?)').bind(id, usuario_id).run();

        await DB.prepare('INSERT INTO tarefa_historico (id, tarefa_id, usuario_id, campo_alterado, valor_antigo, valor_novo) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(crypto.randomUUID(), id, usuario.id, 'responsavel', null, usuario_id).run();

        await criarNotificacoes(DB, {
            usuarioId: usuario_id,
            tipo: 'tarefa',
            titulo: 'Você foi atribuído a uma tarefa',
            mensagem: `A tarefa "${tarefa.titulo}" foi atribuída a você.`,
            link: `/app/kanban?tarefa=${id}`
        });

        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            usuarioRole: usuario.role,
            acao: 'TAREFA_RESPONSAVEL_ADICIONADO',
            modulo: 'kanban',
            descricao: `Responsável ${usuario_id} adicionado à tarefa "${tarefa.titulo}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'tarefas',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] POST /tarefas/:id/responsaveis', erro);
        return c.json({ erro: 'Falha ao atribuir responsabilidade' }, 500);
    }
});
export default rotasTarefas;
