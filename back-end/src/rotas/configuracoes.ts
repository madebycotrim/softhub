import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasConfiguracoes = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── GET / — Buscar todas as configurações ─────────────────────────────────────

rotasConfiguracoes.get('/', autenticacaoRequerida(), verificarPermissao('configuracoes:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        const { results } = await DB.prepare('SELECT chave, valor FROM configuracoes_sistema').all();

        // Mapeia para um objeto chave-valor para facilitar o uso no front
        const config: Record<string, any> = {};
        results.forEach((row: any) => {
            try {
                config[row.chave] = JSON.parse(row.valor);
            } catch {
                config[row.chave] = row.valor;
            }

            // Robustez: garante que chaves que DEVEM ser arrays ou objetos o sejam
            if (row.chave === 'funcoes_tecnicas' && !Array.isArray(config[row.chave])) {
                config[row.chave] = [];
            }
            if (row.chave === 'permissoes_roles' && (typeof config[row.chave] !== 'object' || config[row.chave] === null)) {
                config[row.chave] = {};
            }
        });

        return c.json({ configuracoes: config, bruta: results });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar configurações', detalhe: e.message }, 500);
    }
});

// ─── PATCH /:chave — Atualizar uma configuração ────────────────────────────────

rotasConfiguracoes.patch('/:chave', autenticacaoRequerida(), verificarPermissao('configuracoes:editar'), async (c: Context) => {
    const { DB } = c.env;
    const { chave } = c.req.param();
    const { valor } = await c.req.json();

    if (valor === undefined) {
        return c.json({ erro: 'Valor é obrigatório' }, 400);
    }

    try {
        const valorString = JSON.stringify(valor);

        // O schema não possui atualizado_em, então removemos
        const res = await DB.prepare(`
            UPDATE configuracoes_sistema 
            SET valor = ?
            WHERE chave = ?
        `).bind(valorString, chave).run();

        if (res.meta.changes === 0) {
            // Se não existe, tenta inserir (Upsert básico com UUID)
            await DB.prepare(`
                INSERT INTO configuracoes_sistema (id, chave, valor)
                VALUES (?, ?, ?)
            `).bind(crypto.randomUUID(), chave, valorString).run();
        }

        const usuario = c.get('usuario');
        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            usuarioRole: usuario.role,
            acao: 'ATUALIZAR_CONFIG',
            modulo: 'ADMIN',
            descricao: `Configuração "${chave}" atualizada.`,
            ip: c.req.header('CF-Connecting-IP') ?? ''
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao atualizar configuração', detalhe: e.message }, 500);
    }
});

export default rotasConfiguracoes;
