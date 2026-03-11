import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasEquipes = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── GET /grupos — Listar todos os grupos ────────────────────────────────────

rotasEquipes.get('/grupos', autenticacaoRequerida(), verificarPermissao('equipes:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const grupos = await DB.prepare(`
            SELECT
                g.id, g.nome, g.descricao, g.ativo, g.criado_em,
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
            LEFT JOIN usuarios u ON uo.usuario_id = u.id AND u.ativo = 1
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
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
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
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
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

// ─── DELETE /grupos/:id — Soft delete grupo ───────────────────────────────────

rotasEquipes.delete('/grupos/:id', autenticacaoRequerida(), verificarPermissao('equipes:editar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    try {
        // Soft delete no grupo e em todas as equipes vinculadas aos membros do grupo
        await DB.prepare('UPDATE grupos SET ativo = 0 WHERE id = ?').bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'GRUPO_DESATIVADO',
            modulo: 'equipes',
            descricao: `Grupo ${id} desativado (soft delete)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] DELETE /api/equipes/grupos/:id', erro);
        return c.json({ erro: 'Falha ao desativar grupo.' }, 500);
    }
});

// ─── GET /equipes — Listar todas as equipes ───────────────────────────────────

rotasEquipes.get('/equipes', autenticacaoRequerida(), verificarPermissao('equipes:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const equipes = await DB.prepare(`
            SELECT
                e.id, e.nome, e.descricao, e.ativo, e.criado_em,
                e.lider_id, e.sub_lider_id,
                ul.nome AS lider_nome,
                us.nome AS sub_lider_nome,
                COUNT(DISTINCT uo.usuario_id) AS total_membros,
                (SELECT GROUP_CONCAT(nome, ', ') FROM grupos WHERE equipe_id = e.id AND ativo = 1) AS grupos_nomes
            FROM equipes e
            LEFT JOIN usuarios ul ON e.lider_id = ul.id
            LEFT JOIN usuarios us ON e.sub_lider_id = us.id
            LEFT JOIN usuarios_organizacao uo ON uo.equipe_id = e.id
            LEFT JOIN usuarios u ON uo.usuario_id = u.id AND u.ativo = 1
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
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
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
                link: '/app/admin/equipes'
            });
        }
        if (sub_lider_id && sub_lider_id !== atual.sub_lider_id) {
            await criarNotificacoes(DB, {
                usuarioId: sub_lider_id,
                tipo: 'sistema',
                titulo: 'Nova Liderança',
                mensagem: `Você foi designado como Sublíder da equipe "${nome}".`,
                link: '/app/admin/equipes'
            });
        }

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
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

// ─── DELETE /equipes/:id — Soft delete equipe ─────────────────────────────────

rotasEquipes.delete('/equipes/:id', autenticacaoRequerida(), verificarPermissao('equipes:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    try {
        // Soft delete na equipe e em todos os grupos vinculados
        await DB.batch([
            DB.prepare('UPDATE equipes SET ativo = 0 WHERE id = ?').bind(id),
            DB.prepare('UPDATE grupos SET ativo = 0 WHERE equipe_id = ?').bind(id)
        ]);

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'EQUIPE_DESATIVADA',
            modulo: 'equipes',
            descricao: `Equipe ${id} desativada (soft delete)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] DELETE /api/equipes/equipes/:id', erro);
        return c.json({ erro: 'Falha ao desativar equipe.' }, 500);
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

            // 3. Sincroniza tabela usuarios (Regra 13)
            await DB.prepare('UPDATE usuarios SET equipe_id = ?, grupo_id = ? WHERE id = ?')
                .bind(equipe_id, grupo_id, membroId).run();

            const info = await DB.prepare('SELECT e.nome as e_nome, g.nome as g_nome FROM equipes e, grupos g WHERE e.id = ? AND g.id = ?')
                .bind(equipe_id, grupo_id).first() as any;
            
            desc = `Membro alocado → ${info?.e_nome ?? equipe_id} / ${info?.g_nome ?? grupo_id}`;

            await criarNotificacoes(DB, {
                usuarioId: membroId,
                tipo: 'sistema',
                titulo: 'Nova alocação',
                mensagem: `Você foi alocado à equipe ${info?.e_nome ?? 'da organização'} no grupo ${info?.g_nome ?? ''}.`,
                link: '/app/membros'
            });

        } else if (equipe_id && !grupo_id) {
            // Remoção específica da equipe
            acao = 'MEMBRO_REMOVIDO_EQUIPE';
            await DB.prepare('DELETE FROM usuarios_organizacao WHERE usuario_id = ? AND equipe_id = ?')
                .bind(membroId, equipe_id)
                .run();
            
            // Limpa se era a equipe atual
            await DB.prepare('UPDATE usuarios SET equipe_id = NULL, grupo_id = NULL WHERE id = ? AND equipe_id = ?')
                .bind(membroId, equipe_id).run();
            
            desc = `Membro removido da equipe ${equipe_id}`;
        }

        // Buscar estado atual da alocação
        const atual = await DB.prepare('SELECT equipe_id, grupo_id FROM usuarios WHERE id = ?').bind(membroId).first() as any;

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
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

        // 3. Sincroniza usuarios (Blindagem)
        await DB.prepare('UPDATE usuarios SET grupo_id = ? WHERE id = ? AND equipe_id = ?')
            .bind(grupo_id, membroId, equipe_id).run();

        // 4. Notifica
        const info = await DB.prepare('SELECT nome FROM grupos WHERE id = ?').bind(grupo_id).first() as any;
        await criarNotificacoes(DB, {
            usuarioId: membroId,
            tipo: 'sistema',
            titulo: 'Mudança de grupo',
            mensagem: `Sua alocação foi alterada para o grupo ${info?.nome ?? 'selecionado'}.`,
            link: '/app/membros'
        });

        // Buscar estado atual antes de mover
        const atual = await DB.prepare('SELECT equipe_id, grupo_id FROM usuarios WHERE id = ?').bind(membroId).first() as any;

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
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
