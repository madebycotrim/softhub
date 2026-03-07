import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
const rotasSprints = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar sprints de um projeto
rotasSprints.get('/', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const projetoId = c.req.query('projetoId') || 'p1';

    try {
        const { results } = await DB.prepare(`
      SELECT s.id, s.nome, s.objetivo, s.status, s.data_inicio, s.data_fim, s.velocity_planejado, s.velocity_realizado,
             r.o_que_foi_bem, r.o_que_melhorar, r.acoes_proxima_sprint
      FROM sprints s
      LEFT JOIN retrospectivas r ON r.sprint_id = s.id
      WHERE s.projeto_id = ? AND s.ativo = 1
      ORDER BY s.criado_em DESC
    `).bind(projetoId).all();

        const formatados = results.map((r: any) => ({
            id: r.id,
            nome: r.nome,
            objetivo: r.objetivo,
            status: r.status,
            data_inicio: r.data_inicio,
            data_fim: r.data_fim,
            velocity_planejado: r.velocity_planejado,
            velocity_realizado: r.velocity_realizado,
            retrospectiva: (r.o_que_foi_bem || r.o_que_melhorar || r.acoes_proxima_sprint) ? {
                o_que_foi_bem: r.o_que_foi_bem,
                o_que_melhorar: r.o_que_melhorar,
                acoes_proxima_sprint: r.acoes_proxima_sprint
            } : null
        }));

        return c.json(formatados);
    } catch (erro) {
        console.error('[ERRO DB] GET /sprints', erro);
        return c.json({ erro: 'Falha ao buscar sprints' }, 500);
    }
});

// Criar Sprint (Workflow 10)
rotasSprints.post('/', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;
    const { projeto_id, nome, objetivo, data_inicio, data_fim, velocity_planejado } = await c.req.json();

    try {
        if (!['ADMIN', 'LIDER_GRUPO'].includes(usuario.role)) {
            return c.json({ erro: 'Apenas líderes de grupo e administradores podem criar sprints.' }, 403);
        }

        const sprintAtiva = await DB.prepare('SELECT id FROM sprints WHERE projeto_id = ? AND status = ?').bind(projeto_id, 'ativa').first();
        if (sprintAtiva) {
            return c.json({ erro: 'Já existe uma sprint ativa neste projeto.' }, 400);
        }

        const novoId = crypto.randomUUID();
        await DB.prepare(`
            INSERT INTO sprints (id, projeto_id, nome, objetivo, status, data_inicio, data_fim, velocity_planejado, criado_em)
            VALUES (?, ?, ?, ?, 'ativa', ?, ?, ?, ?)
        `).bind(
            novoId, projeto_id, nome, objetivo || null, data_inicio, data_fim, velocity_planejado || 0, new Date().toISOString()
        ).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            usuarioRole: usuario.role,
            acao: 'SPRINT_CRIADA',
            modulo: 'backlog',
            descricao: `Sprint "${nome}" iniciada no projeto ${projeto_id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'sprints',
            entidadeId: novoId,
            dadosNovos: { nome, objetivo, velocity_planejado }
        });

        return c.json({ sucesso: true, id: novoId }, 201);
    } catch (erro) {
        console.error('[ERRO DB] POST /sprints', erro);
        return c.json({ erro: 'Falha ao criar sprint' }, 500);
    }
});

// Encerrar Sprint
rotasSprints.post('/:id/encerrar', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario') as any;

    try {
        if (!['ADMIN', 'LIDER_GRUPO'].includes(usuario.role)) {
            return c.json({ erro: 'Apenas liderança pode encerrar sprints.' }, 403);
        }

        // 1. Atualiza status da sprint
        await DB.prepare(`
      UPDATE sprints 
      SET status = 'encerrada', data_fim = datetime('now')
      WHERE id = ? AND status = 'ativa'
    `).bind(id).run();

        // 2. Workflow 11: Tarefas não concluídas vão pro backlog
        await DB.prepare(`
      UPDATE tarefas
      SET sprint_id = NULL, status = 'backlog', atualizado_em = datetime('now')
      WHERE sprint_id = ? AND status != 'concluido'
    `).bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'SPRINT_ENCERRADA',
            modulo: 'backlog',
            descricao: `Sprint ${id} encerrada por ${usuario.nome}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'sprints',
            entidadeId: id
        });

        // Gamificação: Sprints Perfeitas
        const sprint = await DB.prepare('SELECT velocity_planejado, projeto_id FROM sprints WHERE id = ?').bind(id).first<{ velocity_planejado: number, projeto_id: string }>();
        const resVel = await DB.prepare("SELECT SUM(pontos) as total FROM tarefas WHERE sprint_id = ? AND status = 'concluido'").bind(id).all<{ total: number }>();

        if (sprint && resVel.results && resVel.results.length > 0) {
            const velocityCalc = resVel.results[0].total || 0;
            await DB.prepare('UPDATE sprints SET velocity_realizado = ? WHERE id = ?').bind(velocityCalc, id).run();

            if (velocityCalc >= sprint.velocity_planejado) {
                // Metas da Sprint atingidas - Lógica de Gamificação removida
            }
        }

        return c.json({ sucesso: true });
    } catch (erro) {
        return c.json({ erro: 'Falha ao encerrar sprint' }, 500);
    }
});

// Atualizar Retrospectiva (Workflow 19)
rotasSprints.patch('/:id/retrospectiva', autenticacaoRequerida, async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario') as any;
    const { o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint } = await c.req.json();

    try {
        if (!['ADMIN', 'LIDER_GRUPO'].includes(usuario.role)) {
            return c.json({ erro: 'Apenas liderança pode editar retrospectivas.' }, 403);
        }

        const sprint = await DB.prepare('SELECT status FROM sprints WHERE id = ?').bind(id).first<{ status: string }>();
        if (!sprint || sprint.status !== 'encerrada') {
            return c.json({ erro: 'A sprint precisa estar encerrada para receber retrospectiva.' }, 400);
        }

        // Upsert manual lite (já que a tabela retrospectivas tem sprint_id UNIQUE)
        const existe = await DB.prepare('SELECT id FROM retrospectivas WHERE sprint_id = ?').bind(id).first();
        if (existe) {
            await DB.prepare(`UPDATE retrospectivas SET o_que_foi_bem = ?, o_que_melhorar = ?, acoes_proxima_sprint = ?, atualizado_em = datetime('now') WHERE sprint_id = ?`)
                .bind(o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint, id).run();
        } else {
            const retoId = crypto.randomUUID();
            await DB.prepare(`INSERT INTO retrospectivas (id, sprint_id, o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint) VALUES (?, ?, ?, ?, ?)`)
                .bind(retoId, id, o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint).run();
        }

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'SPRINT_RETROSPECTIVA_ATUALIZADA',
            modulo: 'backlog',
            descricao: `Retrospectiva preenchida para a Sprint ${id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'sprints',
            entidadeId: id,
            dadosNovos: { o_que_foi_bem, o_que_melhorar, acoes_proxima_sprint }
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /sprints/:id/retrospectiva', erro);
        return c.json({ erro: 'Falha ao salvar retrospectiva' }, 500);
    }
});

export default rotasSprints;
