import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';

const rotasUsuarios = new Hono<{ Bindings: Env; Variables: { usuario: any } }>({ strict: false });

/**
 * Health Check do módulo de usuários.
 */
rotasUsuarios.get('/ping', async (c) => {
    const { DB } = c.env;
    try {
        const res = await DB.prepare('SELECT COUNT(*) as n FROM usuarios').first();
        return c.json({ status: 'ok', banco_usuarios: (res as any)?.n ?? 0, timestamp: new Date().toISOString() });
    } catch (e: any) {
        return c.json({ status: 'erro', detalhes: e.message }, 500);
    }
});

/**
 * Lista todos os membros do sistema.
 */
rotasUsuarios.get('/', autenticacaoRequerida(), verificarPermissao('membros:gerenciar'), async (c: Context) => {
    const { DB } = c.env;
    try {
        const query = `
            SELECT
                u.id, u.nome, u.email, u.role, u.foto_perfil, u.foto_banner, u.bio, u.criado_em,
                u.github_url, u.linkedin_url, u.website_url,
                (SELECT GROUP_CONCAT(grupo_id) FROM usuarios_organizacao WHERE usuario_id = u.id) as grupos_ids,
                (SELECT GROUP_CONCAT(e.nome) FROM usuarios_organizacao uo JOIN equipes e ON e.id = uo.equipe_id WHERE uo.usuario_id = u.id) as equipe_nome
            FROM usuarios u
            ORDER BY u.nome ASC
        `;
        const res = await DB.prepare(query).all();
        return c.json({ membros: res.results || [] });
    } catch (erro: any) {
        console.error('[ERRO] GET /api/usuarios:', erro.message);
        return c.json({ erro: 'Falha ao buscar membros' }, 500);
    }
});

export default rotasUsuarios;