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
    const { DB, softhub_kv } = c.env;
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
        
        // Limpa cache KV para todas as chaves atualizadas
        for (const chave of Object.keys(body)) {
            await softhub_kv.delete(chave);
        }
        
        return c.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso.' });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao salvar configurações', detalhe: e.message }, 500);
    }
});

// ─── PATCH /:chave (Admin) — Suporte ao hook usarConfiguracoes ──────────────
rotasConfiguracoes.patch('/:chave', autenticacaoRequerida('ADMIN'), async (c) => {
    const { DB, softhub_kv } = c.env;
    const chave = c.req.param('chave');
    const { valor } = await c.req.json();

    if (!chave) return c.json({ erro: 'Chave não especificada.' }, 400);

    try {
        await DB.prepare('INSERT OR REPLACE INTO configuracoes_sistema (chave, valor) VALUES (?, ?)')
            .bind(chave, JSON.stringify(valor))
            .run();
        
        // Limpa cache no KV para forçar atualização no próximo acesso
        await softhub_kv.delete(chave);
        
        return c.json({ sucesso: true, mensagem: `Configuração ${chave} atualizada.` });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao atualizar configuração', detalhe: e.message }, 500);
    }
});

// ─── PATCH /roles/:antigo/renomear (Admin) ───────────────────────────────────
rotasConfiguracoes.patch('/roles/:antigo/renomear', autenticacaoRequerida('ADMIN'), async (c) => {
    const { DB, softhub_kv } = c.env;
    const antigo = c.req.param('antigo');
    const { novo } = await c.req.json();

    if (!antigo || !novo || antigo === novo) {
        return c.json({ erro: 'O nome do cargo atual ou novo é inválido.' }, 400);
    }

    try {
        // 1. Buscar permissões e hierarquia atuais
        const resPermissoes = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('permissoes_roles').first<{ valor: string }>();
        const resHierarquia = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('hierarquia_roles').first<{ valor: string }>();

        const batch = [];

        if (resPermissoes) {
            const permissoes = JSON.parse(resPermissoes.valor);
            if (permissoes[antigo]) {
                permissoes[novo] = permissoes[antigo];
                delete permissoes[antigo];
                batch.push(DB.prepare('UPDATE configuracoes_sistema SET valor = ? WHERE chave = ?').bind(JSON.stringify(permissoes), 'permissoes_roles'));
            }
        }

        if (resHierarquia) {
            const hierarquia = JSON.parse(resHierarquia.valor);
            const index = hierarquia.indexOf(antigo);
            if (index !== -1) {
                hierarquia[index] = novo;
                batch.push(DB.prepare('UPDATE configuracoes_sistema SET valor = ? WHERE chave = ?').bind(JSON.stringify(hierarquia), 'hierarquia_roles'));
            }
        }

        // 2. Atualizar todos os usuários que possuem este cargo (Migração de Role)
        batch.push(DB.prepare('UPDATE usuarios SET role = ? WHERE role = ?').bind(novo, antigo));

        if (batch.length === 0) {
            return c.json({ erro: 'Cargo não encontrado nas configurações ou sem usuários vinculados.' }, 404);
        }

        await DB.batch(batch);

        // 3. Invalidar caches para refletir a mudança imediatamente
        await softhub_kv.delete('permissoes_roles');
        await softhub_kv.delete('hierarquia_roles');
        
        // Nota: usuários logados podem precisar de novo token se a role for validada no JWT, 
        // mas aqui a role é buscada no banco por ID no middleware autenticacaoRequerida, então será imediato.

        return c.json({ sucesso: true, mensagem: `Cargo renomeado de '${antigo}' para '${novo}' com sucesso.` });
    } catch (e: any) {
        return c.json({ erro: 'Falha crítica ao renomear cargo', detalhe: e.message }, 500);
    }
});

export default rotasConfiguracoes;