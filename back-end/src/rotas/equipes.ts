import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes, removerNotificacoesPorEntidade } from '../servicos/servico-notificacoes';

const rotasEquipes = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── GET /grupos — Listar todos os grupos ────────────────────────────────────

rotasEquipes.get('/grupos', autenticacaoRequerida(), verificarPermissao('equipes:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const grupos = await DB.prepare(`
            SELECT
                g.id, g.nome, g.descricao, g.criado_em,
                g.equipe_id,
                e.nome AS equipe_nome,
                ul.nome AS lider_nome,
                us.nome AS sub_lider_nome,
                COUNT(uo.usuario_id) AS total_membros
            FROM grupos g
            LEFT JOIN equipes e ON g.equipe_id = e.id
            LEFT JOIN usuarios ul ON e.lider_id = ul.id
            LEFT JOIN usuarios us ON e.sub_lider_id = us.id
            LEFT JOIN usuarios_organizacao uo ON uo.grupo_id = g.id
            GROUP BY g.id
            ORDER BY e.nome ASC, g.nome ASC
        `).all();

        return c.json({ grupos: grupos.results ?? [] });
    } catch (erro: any) {
        console.error('[ERRO] GET /api/equipes/grupos', erro);
        return c.json({ erro: 'Falha ao listar grupos.' }, 500);
    }
});

// ─── POST /grupos — Criar grupo ──────────────────────────────────────────────

rotasEquipes.post('/grupos', autenticacaoRequerida(), verificarPermissao('equipes:criar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    let nome: string, descricao: string | null, equipe_id: string | null;
    try {
        ({ nome, descricao = null, equipe_id = null } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (!nome?.trim()) return c.json({ erro: 'O nome do grupo é obrigatório.' }, 400);
    if (!equipe_id) return c.json({ erro: 'O vínculo com uma equipe é obrigatório.' }, 400);

    try {
        const id = crypto.randomUUID();
        await DB.prepare(
            'INSERT INTO grupos (id, nome, descricao, equipe_id) VALUES (?, ?, ?, ?)'
        ).bind(id, nome.trim(), descricao, equipe_id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'GRUPO_CRIADO',
            modulo: 'equipes',
            descricao: `Grupo "${nome}" criado`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosNovos: { nome, descricao, equipe_id },
        });

        return c.json({ sucesso: true, id }, 201);
    } catch (erro: any) {
        console.error('[ERRO] POST /api/equipes/grupos', erro);
        return c.json({ erro: 'Falha ao criar grupo.' }, 500);
    }
});

// ─── PATCH /grupos/:id — Editar grupo ────────────────────────────────────────

rotasEquipes.patch('/grupos/:id', autenticacaoRequerida(), verificarPermissao('equipes:editar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    let corpo: any;
    try {
        corpo = await c.req.json();
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    try {
        const atual = await DB.prepare('SELECT nome, descricao, equipe_id FROM grupos WHERE id = ?').bind(id).first() as any;
        if (!atual) return c.json({ erro: 'Grupo não encontrado.' }, 404);

        const nome = (corpo.nome !== undefined ? corpo.nome : atual.nome)?.trim();
        const descricao = corpo.descricao !== undefined ? corpo.descricao : atual.descricao;
        const equipe_id = corpo.equipe_id !== undefined ? corpo.equipe_id : atual.equipe_id;

        if (!nome) return c.json({ erro: 'O nome do grupo é obrigatório.' }, 400);

        await DB.prepare(
            'UPDATE grupos SET nome = ?, descricao = ?, equipe_id = ? WHERE id = ?'
        ).bind(nome, descricao, equipe_id, id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'GRUPO_EDITADO',
            modulo: 'equipes',
            descricao: `Grupo "${nome}" atualizado`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosAnteriores: { nome: atual.nome, descricao: atual.descricao, equipe_id: atual.equipe_id },
            dadosNovos: { nome, descricao, equipe_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/equipes/grupos/:id', erro);
        return c.json({ erro: 'Falha ao editar grupo.' }, 500);
    }
});

// ─── DELETE /grupos/:id — Remoção Permanente (Hard Delete) ───────────────────

rotasEquipes.delete('/grupos/:id', autenticacaoRequerida(), verificarPermissao('equipes:editar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    try {
        // Hard Delete no grupo (Cascata no schema lidará com vínculos se configurado)
        await DB.prepare('DELETE FROM grupos WHERE id = ?').bind(id).run();

        // Remove notificações vinculadas ao grupo
        if (id) await removerNotificacoesPorEntidade(DB, id);

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'GRUPO_REMOVIDO_HARD',
            modulo: 'equipes',
            descricao: `Grupo ${id} removido permanentemente (Hard Delete)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] DELETE /api/equipes/grupos/:id', erro);
        return c.json({ erro: 'Falha ao remover grupo.' }, 500);
    }
});

// ─── GET /equipes — Listar todas as equipes ───────────────────────────────────

rotasEquipes.get('/equipes', autenticacaoRequerida(), verificarPermissao('equipes:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const equipes = await DB.prepare(`
            SELECT
                e.id, e.nome, e.descricao, e.criado_em,
                e.lider_id, e.sub_lider_id,
                ul.nome AS lider_nome,
                us.nome AS sub_lider_nome,
                COUNT(DISTINCT uo.usuario_id) AS total_membros,
                (SELECT GROUP_CONCAT(nome, ', ') FROM grupos WHERE equipe_id = e.id) AS grupos_nomes
            FROM equipes e
            LEFT JOIN usuarios ul ON e.lider_id = ul.id
            LEFT JOIN usuarios us ON e.sub_lider_id = us.id
            LEFT JOIN usuarios_organizacao uo ON uo.equipe_id = e.id
            GROUP BY e.id
            ORDER BY e.nome ASC
        `).all();

        return c.json({ equipes: equipes.results ?? [] });
    } catch (erro: any) {
        console.error('[ERRO] GET /api/equipes/equipes', erro);
        return c.json({ erro: 'Falha ao listar equipes.' }, 500);
    }
});

// ─── POST /equipes — Criar equipe ─────────────────────────────────────────────

rotasEquipes.post('/equipes', autenticacaoRequerida(), verificarPermissao('equipes:criar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    let nome: string, descricao: string | null, lider_id: string | null, sub_lider_id: string | null;
    try {
        ({ nome, descricao = null, lider_id = null, sub_lider_id = null } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (!nome?.trim()) return c.json({ erro: 'O nome da equipe é obrigatório.' }, 400);

    try {
        const id = crypto.randomUUID();
        await DB.prepare(
            'INSERT INTO equipes (id, nome, descricao, lider_id, sub_lider_id) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, nome.trim(), descricao, lider_id, sub_lider_id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'EQUIPE_CRIADA',
            modulo: 'equipes',
            descricao: `Equipe "${nome}" criada`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { nome, descricao, lider_id, sub_lider_id },
        });

        return c.json({ sucesso: true, id }, 201);
    } catch (erro: any) {
        console.error('[ERRO] POST /api/equipes/equipes', erro);
        return c.json({ erro: 'Falha ao criar equipe.' }, 500);
    }
});

// ─── PATCH /equipes/:id — Editar equipe ──────────────────────────────────────

rotasEquipes.patch('/equipes/:id', autenticacaoRequerida(), verificarPermissao('equipes:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    let corpo: any;
    try {
        corpo = await c.req.json();
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    try {
        const atual = await DB.prepare('SELECT nome, descricao, lider_id, sub_lider_id FROM equipes WHERE id = ?').bind(id).first() as any;
        if (!atual) return c.json({ erro: 'Equipe não encontrada.' }, 404);

        const nome = (corpo.nome !== undefined ? corpo.nome : atual.nome)?.trim();
        const descricao = corpo.descricao !== undefined ? corpo.descricao : atual.descricao;
        const lider_id = corpo.lider_id !== undefined ? corpo.lider_id : atual.lider_id;
        const sub_lider_id = corpo.sub_lider_id !== undefined ? corpo.sub_lider_id : atual.sub_lider_id;

        if (!nome) return c.json({ erro: 'O nome da equipe é obrigatório.' }, 400);

        await DB.prepare(
            'UPDATE equipes SET nome = ?, descricao = ?, lider_id = ?, sub_lider_id = ? WHERE id = ?'
        ).bind(nome, descricao, lider_id, sub_lider_id, id).run();

        // Notificar novos líderes se mudaram
        if (lider_id && lider_id !== atual.lider_id) {
            await criarNotificacoes(DB, {
                usuarioId: lider_id,
                tipo: 'sistema',
                titulo: 'Nova Liderança',
                mensagem: `Você foi designado como Líder da equipe "${nome}".`,
                link: '/app/admin/equipes',
                entidadeId: id
            });
        }
        if (sub_lider_id && sub_lider_id !== atual.sub_lider_id) {
            await criarNotificacoes(DB, {
                usuarioId: sub_lider_id,
                tipo: 'sistema',
                titulo: 'Nova Liderança',
                mensagem: `Você foi designado como Sublíder da equipe "${nome}".`,
                link: '/app/admin/equipes',
                entidadeId: id
            });
        }

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'EQUIPE_EDITADA',
            modulo: 'equipes',
            descricao: `Equipe "${nome}" atualizada`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosAnteriores: { nome: atual.nome, descricao: atual.descricao, lider_id: atual.lider_id, sub_lider_id: atual.sub_lider_id },
            dadosNovos: { nome, descricao, lider_id, sub_lider_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/equipes/equipes/:id', erro);
        return c.json({ erro: 'Falha ao editar equipe.' }, 500);
    }
});

// ─── DELETE /equipes/:id — Remoção Permanente (Hard Delete) ───────────────────

rotasEquipes.delete('/equipes/:id', autenticacaoRequerida(), verificarPermissao('equipes:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    try {
        // Hard delete na equipe (Cascata lidará com grupos e vínculos)
        await DB.prepare('DELETE FROM equipes WHERE id = ?').bind(id).run();

        // Remove notificações vinculadas à equipe
        if (id) await removerNotificacoesPorEntidade(DB, id);

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'EQUIPE_REMOVIDA_HARD',
            modulo: 'equipes',
            descricao: `Equipe ${id} removida permanentemente (Hard Delete)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] DELETE /api/equipes/equipes/:id', erro);
        return c.json({ erro: 'Falha ao remover equipe.' }, 500);
    }
});

// ─── PATCH /membros/:id/alocar — Alocar membro em grupo+equipe ───────────────
rotasEquipes.patch('/membros/:id/alocar', autenticacaoRequerida(), verificarPermissao('equipes:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const membroId = c.req.param('id');

    let equipe_id: string | null, grupo_id: string | null;
    try {
        ({ equipe_id = null, grupo_id = null } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    try {
        let acao = 'MEMBRO_ALOCADO';
        let desc = '';

        if (equipe_id && grupo_id) {
            // Workflow 27: Garantir que membro pertence a apenas UMA equipe+grupo por vez
            // 1. Remove vínculos anteriores (Blindagem)
            await DB.prepare('DELETE FROM usuarios_organizacao WHERE usuario_id = ?').bind(membroId).run();

            // 2. Insere novo vínculo
            await DB.prepare(`
                INSERT INTO usuarios_organizacao (id, usuario_id, equipe_id, grupo_id)
                VALUES (?, ?, ?, ?)
            `).bind(crypto.randomUUID(), membroId, equipe_id, grupo_id).run();

            const info = await DB.prepare('SELECT e.nome as e_nome, g.nome as g_nome FROM equipes e, grupos g WHERE e.id = ? AND g.id = ?')
                .bind(equipe_id, grupo_id).first() as any;
            
            desc = `Membro alocado → ${info?.e_nome ?? equipe_id} / ${info?.g_nome ?? grupo_id}`;

            await criarNotificacoes(DB, {
                usuarioId: membroId,
                tipo: 'sistema',
                titulo: 'Nova alocação',
                mensagem: `Você foi alocado à equipe ${info?.e_nome ?? 'da organização'} no grupo ${info?.g_nome ?? ''}.`,
                link: '/app/membros',
                entidadeId: equipe_id
            });

        } else if (equipe_id && !grupo_id) {
            // Remoção específica da equipe
            acao = 'MEMBRO_REMOVIDO_EQUIPE';
            await DB.prepare('DELETE FROM usuarios_organizacao WHERE usuario_id = ? AND equipe_id = ?')
                .bind(membroId, equipe_id)
                .run();
            
            desc = `Membro removido da equipe ${equipe_id}`;
        }

        // Buscar estado atual da alocação
        const atual = await DB.prepare('SELECT (SELECT GROUP_CONCAT(equipe_id) FROM usuarios_organizacao WHERE usuario_id = u.id) as equipe_id, (SELECT GROUP_CONCAT(grupo_id) FROM usuarios_organizacao WHERE usuario_id = u.id) as grupo_id FROM usuarios u WHERE u.id = ?').bind(membroId).first() as any;

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao,
            modulo: 'equipes',
            descricao: desc || `Alteração organizacional para ${membroId}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: membroId,
            dadosAnteriores: { equipe_id: atual?.equipe_id, grupo_id: atual?.grupo_id },
            dadosNovos: { equipe_id, grupo_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/equipes/membros/:id/alocar', erro);
        return c.json({ erro: 'Falha ao alocar membro.' }, 500);
    }
});

// ─── PATCH /membros/:id/mover — Mover membro entre grupos ─────────────────────
rotasEquipes.patch('/membros/:id/mover', autenticacaoRequerida(), verificarPermissao('equipes:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const membroId = c.req.param('id');

    let equipe_id: string, grupo_id: string, origem_grupo_id: string;
    try {
        ({ equipe_id, grupo_id, origem_grupo_id } = await c.req.json());
    } catch {
        return c.json({ erro: 'Corpo da requisição inválido.' }, 400);
    }

    if (!equipe_id || !grupo_id || !origem_grupo_id) {
        return c.json({ erro: 'IDs de equipe, grupo destino e grupo origem são obrigatórios.' }, 400);
    }

    try {
        // 1. Remove o vínculo antigo
        await DB.prepare('DELETE FROM usuarios_organizacao WHERE usuario_id = ? AND equipe_id = ? AND grupo_id = ?')
            .bind(membroId, equipe_id, origem_grupo_id)
            .run();

        // 2. Adiciona o novo (ou garante)
        await DB.prepare(`
            INSERT INTO usuarios_organizacao (id, usuario_id, equipe_id, grupo_id)
            VALUES (?, ?, ?, ?)
        `).bind(crypto.randomUUID(), membroId, equipe_id, grupo_id).run();

        // 4. Notifica
        const info = await DB.prepare('SELECT nome FROM grupos WHERE id = ?').bind(grupo_id).first() as any;
        await criarNotificacoes(DB, {
            usuarioId: membroId,
            tipo: 'sistema',
            titulo: 'Mudança de grupo',
            mensagem: `Sua alocação foi alterada para o grupo ${info?.nome ?? 'selecionado'}.`,
            link: '/app/membros',
            entidadeId: grupo_id
        });

        // Buscar estado atual antes de mover
        const atual = await DB.prepare('SELECT (SELECT GROUP_CONCAT(equipe_id) FROM usuarios_organizacao WHERE usuario_id = u.id) as equipe_id, (SELECT GROUP_CONCAT(grupo_id) FROM usuarios_organizacao WHERE usuario_id = u.id) as grupo_id FROM usuarios u WHERE u.id = ?').bind(membroId).first() as any;

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBRO_MOVIMENTADO',
            modulo: 'equipes',
            descricao: `Membro ${membroId} movido do grupo ${origem_grupo_id} para ${grupo_id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: membroId,
            dadosAnteriores: { equipe_id: atual?.equipe_id, grupo_id: atual?.grupo_id },
            dadosNovos: { equipe_id, grupo_id, origem_grupo_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/equipes/membros/:id/mover', erro);
        return c.json({ erro: 'Falha ao mover membro.' }, 500);
    }
});

export default rotasEquipes;
