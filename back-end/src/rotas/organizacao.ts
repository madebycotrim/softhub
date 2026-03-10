import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasOrganizacao = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── GET /grupos — Listar todos os grupos ────────────────────────────────────

rotasOrganizacao.get('/grupos', autenticacaoRequerida(), verificarPermissao('organizacao:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const grupos = await DB.prepare(`
            SELECT
                g.id, g.nome, g.descricao, g.ativo, g.criado_em,
                g.equipe_id,
                e.nome AS equipe_nome,
                ul.nome AS lider_nome,
                us.nome AS sub_lider_nome,
                COUNT(u.id) AS total_membros
            FROM grupos g
            LEFT JOIN equipes e ON g.equipe_id = e.id
            LEFT JOIN usuarios ul ON e.lider_id = ul.id
            LEFT JOIN usuarios us ON e.sub_lider_id = us.id
            LEFT JOIN usuarios u ON u.grupo_id = g.id AND u.ativo = 1
            GROUP BY g.id
            ORDER BY e.nome ASC, g.nome ASC
        `).all();

        return c.json({ grupos: grupos.results ?? [] });
    } catch (erro: any) {
        console.error('[ERRO] GET /api/organizacao/grupos', erro);
        return c.json({ erro: 'Falha ao listar grupos.' }, 500);
    }
});

// ─── POST /grupos — Criar grupo ──────────────────────────────────────────────

rotasOrganizacao.post('/grupos', autenticacaoRequerida(), verificarPermissao('organizacao:criar_grupo'), async (c: Context) => {
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
            modulo: 'organizacao',
            descricao: `Grupo "${nome}" criado`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosNovos: { nome, descricao, equipe_id },
        });

        return c.json({ sucesso: true, id }, 201);
    } catch (erro: any) {
        console.error('[ERRO] POST /api/organizacao/grupos', erro);
        return c.json({ erro: 'Falha ao criar grupo.' }, 500);
    }
});

// ─── PATCH /grupos/:id — Editar grupo ────────────────────────────────────────

rotasOrganizacao.patch('/grupos/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_grupo'), async (c: Context) => {
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
            modulo: 'organizacao',
            descricao: `Grupo "${nome}" atualizado`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosNovos: { nome, descricao, equipe_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/organizacao/grupos/:id', erro);
        return c.json({ erro: 'Falha ao editar grupo.' }, 500);
    }
});

// ─── DELETE /grupos/:id — Soft delete grupo ───────────────────────────────────

rotasOrganizacao.delete('/grupos/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_grupo'), async (c: Context) => {
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
            modulo: 'organizacao',
            descricao: `Grupo ${id} desativado (soft delete)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] DELETE /api/organizacao/grupos/:id', erro);
        return c.json({ erro: 'Falha ao desativar grupo.' }, 500);
    }
});

// ─── GET /equipes — Listar todas as equipes ───────────────────────────────────

rotasOrganizacao.get('/equipes', autenticacaoRequerida(), verificarPermissao('organizacao:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const equipes = await DB.prepare(`
            SELECT
                e.id, e.nome, e.descricao, e.ativo, e.criado_em,
                e.lider_id, e.sub_lider_id,
                ul.nome AS lider_nome,
                us.nome AS sub_lider_nome,
                COUNT(DISTINCT u.id) AS total_membros,
                (SELECT GROUP_CONCAT(nome, ', ') FROM grupos WHERE equipe_id = e.id AND ativo = 1) AS grupos_nomes
            FROM equipes e
            LEFT JOIN usuarios ul ON e.lider_id = ul.id
            LEFT JOIN usuarios us ON e.sub_lider_id = us.id
            LEFT JOIN usuarios u ON u.equipe_id = e.id AND u.ativo = 1
            GROUP BY e.id
            ORDER BY e.nome ASC
        `).all();

        return c.json({ equipes: equipes.results ?? [] });
    } catch (erro: any) {
        console.error('[ERRO] GET /api/organizacao/equipes', erro);
        return c.json({ erro: 'Falha ao listar equipes.' }, 500);
    }
});

// ─── POST /equipes — Criar equipe ─────────────────────────────────────────────

rotasOrganizacao.post('/equipes', autenticacaoRequerida(), verificarPermissao('organizacao:criar_equipe'), async (c: Context) => {
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
            modulo: 'organizacao',
            descricao: `Equipe "${nome}" criada`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { nome, descricao, lider_id, sub_lider_id },
        });

        return c.json({ sucesso: true, id }, 201);
    } catch (erro: any) {
        console.error('[ERRO] POST /api/organizacao/equipes', erro);
        return c.json({ erro: 'Falha ao criar equipe.' }, 500);
    }
});

// ─── PATCH /equipes/:id — Editar equipe ──────────────────────────────────────

rotasOrganizacao.patch('/equipes/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_equipe'), async (c: Context) => {
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

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'EQUIPE_EDITADA',
            modulo: 'organizacao',
            descricao: `Equipe "${nome}" atualizada`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { nome, descricao, lider_id, sub_lider_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/organizacao/equipes/:id', erro);
        return c.json({ erro: 'Falha ao editar equipe.' }, 500);
    }
});

// ─── DELETE /equipes/:id — Soft delete equipe ─────────────────────────────────

rotasOrganizacao.delete('/equipes/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    try {
        await DB.prepare('UPDATE equipes SET ativo = 0 WHERE id = ?').bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'EQUIPE_DESATIVADA',
            modulo: 'organizacao',
            descricao: `Equipe ${id} desativada (soft delete)`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] DELETE /api/organizacao/equipes/:id', erro);
        return c.json({ erro: 'Falha ao desativar equipe.' }, 500);
    }
});

// ─── PATCH /membros/:id/alocar — Alocar membro em grupo+equipe ───────────────
// Regra: membro pertence a apenas UMA equipe por vez.
// Ao trocar, atualiza usuarios.equipe_id E usuarios.grupo_id.

rotasOrganizacao.patch('/membros/:id/alocar', autenticacaoRequerida(), verificarPermissao('organizacao:editar_equipe'), async (c: Context) => {
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
        await DB.prepare('UPDATE usuarios SET equipe_id = ?, grupo_id = ? WHERE id = ?')
            .bind(equipe_id, grupo_id, membroId)
            .run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            usuarioNome: usuarioLogado.nome,
            usuarioEmail: usuarioLogado.email,
            usuarioRole: usuarioLogado.role,
            acao: 'MEMBRO_ALOCADO',
            modulo: 'organizacao',
            descricao: `Membro ${membroId} alocado → equipe: ${equipe_id ?? 'nenhuma'} / grupo: ${grupo_id ?? 'nenhum'}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: membroId,
            dadosNovos: { equipe_id, grupo_id },
        });

        return c.json({ sucesso: true });
    } catch (erro: any) {
        console.error('[ERRO] PATCH /api/organizacao/membros/:id/alocar', erro);
        return c.json({ erro: 'Falha ao alocar membro.' }, 500);
    }
});

export default rotasOrganizacao;
