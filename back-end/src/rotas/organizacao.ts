import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasOrganizacao = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Apenas ADMIN ou LIDER_GRUPO podem modificar a estrutura. LIDER_EQUIPE apenas vê ou manipula sua equipe (regra customizada nas rotas se preciso).
const verificarPermissaoAdminLiderGrupo = (role: string) => ['ADMIN', 'LIDER_GRUPO'].includes(role);

// === GRUPOS ===

rotasOrganizacao.get('/grupos', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    try {
        const { results } = await DB.prepare('SELECT * FROM grupos WHERE ativo = 1 ORDER BY nome ASC').all();
        return c.json(results);
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar grupos' }, 500);
    }
});

rotasOrganizacao.post('/grupos', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario');
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

    const { nome, descricao } = await c.req.json();
    if (!nome) return c.json({ erro: 'Nome é obrigatório' }, 400);

    try {
        const id = crypto.randomUUID();
        await DB.prepare('INSERT INTO grupos (id, nome, descricao) VALUES (?, ?, ?)')
            .bind(id, nome, descricao || null).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_GRUPO_CRIADO',
            modulo: 'organizacao',
            descricao: `Criou o grupo "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'grupos',
            entidadeId: id,
            dadosNovos: { nome, descricao }
        });
        return c.json({ sucesso: true, id });
    } catch (e) {
        return c.json({ erro: 'Falha ao criar grupo' }, 500);
    }
});

rotasOrganizacao.patch('/grupos/:id', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

    const { nome, descricao } = await c.req.json();
    try {
        await DB.prepare('UPDATE grupos SET nome = ?, descricao = ? WHERE id = ?')
            .bind(nome, descricao, id).run();

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
    } catch (e) {
        return c.json({ erro: 'Falha ao editar grupo' }, 500);
    }
});

rotasOrganizacao.delete('/grupos/:id', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

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

rotasOrganizacao.get('/equipes', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    try {
        const query = `
            SELECT e.*, g.nome as grupo_nome 
            FROM equipes e 
            JOIN grupos g ON e.grupo_id = g.id 
            WHERE e.ativo = 1 AND g.ativo = 1
            ORDER BY g.nome ASC, e.nome ASC
        `;
        const { results } = await DB.prepare(query).all();
        return c.json(results);
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar equipes' }, 500);
    }
});

rotasOrganizacao.post('/equipes', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario');
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

    const { grupo_id, nome, descricao } = await c.req.json();
    if (!grupo_id || !nome) return c.json({ erro: 'Grupo e Nome são obrigatórios' }, 400);

    try {
        const id = crypto.randomUUID();
        await DB.prepare('INSERT INTO equipes (id, grupo_id, nome, descricao) VALUES (?, ?, ?, ?)')
            .bind(id, grupo_id, nome, descricao || null).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_EQUIPE_CRIADA',
            modulo: 'organizacao',
            descricao: `Criou a equipe "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { grupo_id, nome, descricao }
        });
        return c.json({ sucesso: true, id });
    } catch (e) {
        return c.json({ erro: 'Falha ao criar equipe' }, 500);
    }
});

rotasOrganizacao.patch('/equipes/:id', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

    const { nome, descricao, grupo_id } = await c.req.json();
    try {
        await DB.prepare('UPDATE equipes SET nome = ?, descricao = ?, grupo_id = ? WHERE id = ?')
            .bind(nome, descricao, grupo_id, id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_EQUIPE_EDITADA',
            modulo: 'organizacao',
            descricao: `Editou a equipe "${nome}"`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'equipes',
            entidadeId: id,
            dadosNovos: { nome, descricao, grupo_id }
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao editar equipe' }, 500);
    }
});

rotasOrganizacao.delete('/equipes/:id', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

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

rotasOrganizacao.patch('/alocacao/:usuarioId', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const reqUserId = c.req.param('usuarioId');
    const usuario = c.get('usuario');
    // Apenas ADMIN ou LIDER_GRUPO para mudar alocação
    if (!verificarPermissaoAdminLiderGrupo(usuario.role)) return c.json({ erro: 'Acesso negado' }, 403);

    const { equipe_id } = await c.req.json(); // Se null, é desvinculação

    try {
        await DB.prepare('UPDATE usuarios SET equipe_id = ? WHERE id = ?')
            .bind(equipe_id || null, reqUserId).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'ORG_USUARIO_ALOCADO',
            modulo: 'organizacao',
            descricao: `Usuário ${reqUserId} alocado para equipe ${equipe_id || 'Nenhuma'}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: reqUserId,
            dadosNovos: { equipe_id }
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao alocar usuário' }, 500);
    }
});

export default rotasOrganizacao;
