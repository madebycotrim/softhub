import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';

const rotasNotificacoes = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

/**
 * 🔔 LISTAR NOTIFICAÇÕES NÃO LIDAS
 */
rotasNotificacoes.get('/', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    try {
        const { results } = await DB.prepare(`
            SELECT * FROM notificacoes 
            WHERE usuario_id = ? AND lida = 0 
            ORDER BY criado_em DESC
        `).bind(usuarioLogado.id).all();

        return c.json({ notificacoes: results });
    } catch (erro) {
        console.error('[ERRO DB] GET /notificacoes', erro);
        return c.json({ erro: 'Falha ao buscar notificações' }, 500);
    }
});

/**
 * ✅ MARCAR COMO LIDA
 */
rotasNotificacoes.patch('/:id/lida', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    try {
        await DB.prepare('UPDATE notificacoes SET lida = 1 WHERE id = ? AND usuario_id = ?')
            .bind(id, usuarioLogado.id)
            .run();

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] PATCH /notificacoes/:id/lida', erro);
        return c.json({ erro: 'Falha ao atualizar notificação' }, 500);
    }
});

/**
 * 🧹 LIMPAR TODAS (MARCAR TODAS COMO LIDAS)
 */
rotasNotificacoes.delete('/limpar-todas', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    try {
        await DB.prepare('UPDATE notificacoes SET lida = 1 WHERE usuario_id = ?')
            .bind(usuarioLogado.id)
            .run();

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO DB] DELETE /notificacoes/limpar-todas', erro);
        return c.json({ erro: 'Falha ao limpar notificações' }, 500);
    }
});

export default rotasNotificacoes;
