import { Hono, Context } from 'hono';
import { autenticacaoRequerida } from '../middleware/auth';
import { Env } from '../index';

const rotasConfiguracoes = new Hono<{ Bindings: Env }>();

// ─── GET / (Admin) ──────────────────────────────────────────────────────────
rotasConfiguracoes.get('/', autenticacaoRequerida('ADMIN'), async (c) => {
    const { DB } = c.env;

    try {
        const { results } = await DB.prepare('SELECT * FROM configuracoes_sistema').all();
        const config: Record<string, any> = {};

        if (results) {
            results.forEach((row: any) => {
                try {
                    config[row.chave] = JSON.parse(row.valor);
                } catch {
                    config[row.chave] = row.valor;
                }
            });
        }

        return c.json({ configuracoes: config, bruta: results });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar configurações', detalhe: e.message }, 500);
    }
});

// ─── GET /publico — Endpoint acessível para TODOS autenticados (UX) ─────────
rotasConfiguracoes.get('/publico', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;

    try {
        const { results } = await DB.prepare('SELECT chave, valor FROM configuracoes_sistema WHERE chave IN (?, ?)')
            .bind('permissoes_roles', 'hierarquia_roles')
            .all();

        const config: Record<string, any> = {
            permissoes_roles: {},
            hierarquia_roles: [] // Garante que a resposta seja sempre um array, mesmo que vazio.
        };

        if (results) {
            results.forEach((row: any) => {
                try {
                    config[row.chave] = JSON.parse(row.valor);
                } catch {
                    // Mantém o valor padrão (array vazio ou objeto vazio)
                }
            });
        }

        return c.json(config);
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar configurações públicas', detalhe: e.message }, 500);
    }
});

// ─── POST / (Admin) ─────────────────────────────────────────────────────────
rotasConfiguracoes.post('/', autenticacaoRequerida('ADMIN'), async (c) => {
    const { DB } = c.env;
    const body = await c.req.json();

    if (!body || typeof body !== 'object') {
        return c.json({ erro: 'Corpo da requisição inválido' }, 400);
    }

    const transacoes = Object.entries(body).map(([chave, valor]) => {
        return DB.prepare('INSERT OR REPLACE INTO configuracoes_sistema (chave, valor) VALUES (?, ?)')
            .bind(chave, JSON.stringify(valor));
    });

    try {
        await DB.batch(transacoes);
        return c.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso.' });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao salvar configurações', detalhe: e.message }, 500);
    }
});

export default rotasConfiguracoes;