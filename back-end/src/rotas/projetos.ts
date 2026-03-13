import { Hono, Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasProjetos = new Hono<{ Bindings: Env; Variables: { usuario: any } }>({ strict: false });

// Schema para criação/edição de projetos
const ProjetoSchema = z.object({
    nome: z.string().min(3).max(100),
    descricao: z.string().optional(),
    publico: z.boolean().default(false),
});

/**
 * GET /api/projetos/publicos
 * Rota pública para o portfólio.
 */
rotasProjetos.get('/publicos', async (c) => {
    const { DB } = c.env;
    try {
        const { results } = await DB.prepare(`
            SELECT id, nome, descricao, criado_em 
            FROM projetos 
            WHERE publico = 1 
            ORDER BY criado_em DESC
        `).all();
        return c.json(results);
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar projetos públicos' }, 500);
    }
});

/**
 * GET /api/projetos
 * Listar todos os projetos (Privado - Requer permissão)
 */
rotasProjetos.get('/', autenticacaoRequerida(), verificarPermissao('projetos:visualizar'), async (c) => {
    const { DB } = c.env;
    try {
        const { results } = await DB.prepare(`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM tarefas WHERE projeto_id = p.id) as total_tarefas
            FROM projetos p 
            ORDER BY criado_em DESC
        `).all();
        return c.json(results);
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar projetos' }, 500);
    }
});

/**
 * POST /api/projetos
 * Criar um novo projeto (Privado - Admin/Gestor)
 */
rotasProjetos.post('/', 
    autenticacaoRequerida(), 
    verificarPermissao('projetos:criar'), 
    zValidator('json', ProjetoSchema), 
    async (c) => {
    const { DB } = c.env;
    const body = c.req.valid('json');
    const usuario = c.get('usuario');
    const id = crypto.randomUUID();

    try {
        await DB.prepare(`
            INSERT INTO projetos (id, nome, descricao, publico)
            VALUES (?, ?, ?, ?)
        `).bind(id, body.nome, body.descricao || null, body.publico ? 1 : 0).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PROJETO_CRIADO',
            modulo: 'projetos',
            descricao: `Projeto "${body.nome}" criado com ID ${id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'projetos',
            entidadeId: id
        });

        return c.json({ id, sucesso: true }, 201);
    } catch (e: any) {
        console.error('[ERRO DB] POST /api/projetos', e);
        return c.json({ erro: 'Falha ao criar projeto', detalhe: e.message }, 500);
    }
});

/**
 * PATCH /api/projetos/:id
 * Editar projeto existente
 */
rotasProjetos.patch('/:id', 
    autenticacaoRequerida(), 
    verificarPermissao('projetos:editar'), 
    zValidator('json', ProjetoSchema.partial()), 
    async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const usuario = c.get('usuario');

    try {
        const atual = await DB.prepare('SELECT * FROM projetos WHERE id = ?').bind(id).first();
        if (!atual) return c.json({ erro: 'Projeto não encontrado' }, 404);

        const campos = [];
        const valores = [];
        if (body.nome !== undefined) { campos.push('nome = ?'); valores.push(body.nome); }
        if (body.descricao !== undefined) { campos.push('descricao = ?'); valores.push(body.descricao); }
        if (body.publico !== undefined) { campos.push('publico = ?'); valores.push(body.publico ? 1 : 0); }

        if (campos.length === 0) return c.json({ erro: 'Nenhum campo para atualizar' }, 400);

        valores.push(id);
        await DB.prepare(`UPDATE projetos SET ${campos.join(', ')} WHERE id = ?`).bind(...valores).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PROJETO_EDITADO',
            modulo: 'projetos',
            descricao: `Projeto ${id} editado`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'projetos',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao editar projeto' }, 500);
    }
});

/**
 * DELETE /api/projetos/:id
 * Remoção permanente (Hard Delete conforme regra)
 */
rotasProjetos.delete('/:id', autenticacaoRequerida(), verificarPermissao('projetos:excluir'), async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');
    const usuario = c.get('usuario');

    try {
        const projeto = await DB.prepare('SELECT nome FROM projetos WHERE id = ?').bind(id).first() as any;
        if (!projeto) return c.json({ erro: 'Projeto não encontrado' }, 404);

        await DB.prepare('DELETE FROM projetos WHERE id = ?').bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PROJETO_REMOVIDO_HARD',
            modulo: 'projetos',
            descricao: `Projeto "${projeto.nome}" removido permanentemente`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'projetos',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao deletar projeto' }, 500);
    }
});

export default rotasProjetos;
