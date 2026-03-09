import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasOrganizacao = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// === GRUPOS ===

rotasOrganizacao.get('/grupos', autenticacaoRequerida(), verificarPermissao('organizacao:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    try {
        const query = `
            SELECT g.*, 
                   u1.nome as lider_nome, 
                   u2.nome as sub_lider_nome 
            FROM grupos g
            LEFT JOIN usuarios u1 ON g.lider_id = u1.id
            LEFT JOIN usuarios u2 ON g.sub_lider_id = u2.id
            WHERE g.ativo = 1 
            ORDER BY g.nome ASC
        `;
        const { results } = await DB.prepare(query).all();
        return c.json(results);
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar grupos' }, 500);
    }
});

rotasOrganizacao.post('/grupos', autenticacaoRequerida(), verificarPermissao('organizacao:criar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario');

    const { nome, descricao, lider_id, sub_lider_id } = await c.req.json();
    if (!nome) return c.json({ erro: 'Nome é obrigatório' }, 400);

    try {
        const id = crypto.randomUUID();
        await DB.prepare('INSERT INTO grupos (id, nome, descricao, lider_id, sub_lider_id) VALUES (?, ?, ?, ?, ?)')
            .bind(id, nome, descricao || null, lider_id || null, sub_lider_id || null).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_GRUPO_CRIADO',
            modulo: 'organizacao',
            descricao: `Criou o grupo "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosNovos: { nome, descricao, lider_id, sub_lider_id }
        });
        return c.json({ sucesso: true, id });
    } catch (e) {
        return c.json({ erro: 'Falha ao criar grupo' }, 500);
    }
});

rotasOrganizacao.patch('/grupos/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');

    const { nome, descricao, lider_id, sub_lider_id } = await c.req.json();
    try {
        await DB.prepare('UPDATE grupos SET nome = ?, descricao = ?, lider_id = ?, sub_lider_id = ? WHERE id = ?')
            .bind(nome, descricao, lider_id, sub_lider_id, id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_GRUPO_EDITADO',
            modulo: 'organizacao',
            descricao: `Editou o grupo "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosNovos: { nome, descricao }
        });
        return c.json({ sucesso: true });
    } catch (e: any) {
        console.error('[ERRO EDITAR GRUPO]', e);
        return c.json({ erro: 'Falha ao editar grupo', detalhe: e.message }, 500);
    }
});

rotasOrganizacao.delete('/grupos/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_grupo'), async (c: Context) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');

    try {
        await DB.prepare('UPDATE grupos SET ativo = 0 WHERE id = ?').bind(id).run();
        await DB.prepare('UPDATE equipes SET ativo = 0 WHERE grupo_id = ?').bind(id).run(); // cascata lógica

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_GRUPO_REMOVIDO',
            modulo: 'organizacao',
            descricao: `Desativou o grupo ${id} e suas equipes vinculadas`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao excluir grupo' }, 500);
    }
});

// === EQUIPES ===

rotasOrganizacao.get('/equipes', autenticacaoRequerida(), verificarPermissao('organizacao:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    try {
        const query = `
            SELECT e.*,
                   u1.nome as lider_nome, 
                   u2.nome as sub_lider_nome 
            FROM equipes e
            LEFT JOIN usuarios u1 ON e.lider_id = u1.id
            LEFT JOIN usuarios u2 ON e.sub_lider_id = u2.id
            WHERE e.ativo = 1
            ORDER BY e.nome ASC
        `;
        const { results } = await DB.prepare(query).all();
        return c.json(results);
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar equipes' }, 500);
    }
});

rotasOrganizacao.post('/equipes', autenticacaoRequerida(), verificarPermissao('organizacao:criar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario');

    const { nome, descricao, lider_id, sub_lider_id } = await c.req.json();
    if (!nome) return c.json({ erro: 'Nome é obrigatório' }, 400);

    try {
        const id = crypto.randomUUID();
        await DB.prepare('INSERT INTO equipes (id, nome, descricao, lider_id, sub_lider_id) VALUES (?, ?, ?, ?, ?)')
            .bind(id, nome, descricao || null, lider_id || null, sub_lider_id || null).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_EQUIPE_CRIADA',
            modulo: 'organizacao',
            descricao: `Criou o squad "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { nome, descricao, lider_id, sub_lider_id }
        });
        return c.json({ sucesso: true, id });
    } catch (e) {
        return c.json({ erro: 'Falha ao criar equipe' }, 500);
    }
});

rotasOrganizacao.patch('/equipes/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');

    const { nome, descricao, lider_id, sub_lider_id } = await c.req.json();
    try {
        await DB.prepare('UPDATE equipes SET nome = ?, descricao = ?, lider_id = ?, sub_lider_id = ? WHERE id = ?')
            .bind(nome, descricao, lider_id, sub_lider_id, id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_EQUIPE_EDITADA',
            modulo: 'organizacao',
            descricao: `Editou o squad "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { nome, descricao, lider_id, sub_lider_id }
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao editar equipe' }, 500);
    }
});

rotasOrganizacao.delete('/equipes/:id', autenticacaoRequerida(), verificarPermissao('organizacao:editar_equipe'), async (c: Context) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');

    try {
        await DB.prepare('UPDATE equipes SET ativo = 0 WHERE id = ?').bind(id).run();
        // Usuários transferidos para NULL caso equipe seja excluída? O RH aloca depois, mas a FK no BD tem ON DELETE SET NULL, 
        // mas como é soft delete, fazemos na mão:
        await DB.prepare('UPDATE usuarios SET equipe_id = NULL WHERE equipe_id = ?').bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_EQUIPE_REMOVIDA',
            modulo: 'organizacao',
            descricao: `Desativou a equipe ${id} e desalocou seus membros`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao excluir equipe' }, 500);
    }
});

// === ALOCAÇÃO ===

rotasOrganizacao.patch('/alocacao/:usuarioId', autenticacaoRequerida(), verificarPermissao('membros:gerenciar'), async (c: Context) => {
    const { DB } = c.env;
    const reqUserId = c.req.param('usuarioId');
    const usuario = c.get('usuario');

    const { equipe_id, grupo_id } = await c.req.json();

    try {
        await DB.prepare('UPDATE usuarios SET equipe_id = COALESCE(?, equipe_id), grupo_id = COALESCE(?, grupo_id) WHERE id = ?')
            .bind(equipe_id === 'clear' ? null : (equipe_id || null), grupo_id === 'clear' ? null : (grupo_id || null), reqUserId).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_USUARIO_ALOCADO',
            modulo: 'organizacao',
            descricao: `Usuário ${reqUserId} alocado: Squad ${equipe_id || 'Mantida'} / Polo ${grupo_id || 'Mantido'}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: reqUserId,
            dadosNovos: { equipe_id, grupo_id }
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao alocar usuário' }, 500);
    }
});

export default rotasOrganizacao;
