import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';

const rotasConfiguracoes = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

// ─── GET / — Buscar todas as configurações ─────────────────────────────────────

rotasConfiguracoes.get('/', autenticacaoRequerida('ADMIN'), async (c) => {
    const { DB } = c.env;

    try {
        const { results } = await DB.prepare('SELECT chave, valor, descricao, atualizado_em FROM configuracoes').all();

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

rotasConfiguracoes.patch('/:chave', autenticacaoRequerida('ADMIN'), async (c) => {
    const { DB } = c.env;
    const { chave } = c.req.param();
    const { valor } = await c.req.json();
    const usuarioId = c.get('usuario').id;

    if (valor === undefined) {
        return c.json({ erro: 'Valor é obrigatório' }, 400);
    }

    try {
        const valorString = JSON.stringify(valor);

        const res = await DB.prepare(`
            UPDATE configuracoes 
            SET valor = ?, atualizado_em = (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            WHERE chave = ?
        `).bind(valorString, chave).run();

        if (res.meta.changes === 0) {
            return c.json({ erro: 'Configuração não encontrada' }, 404);
        }

        await registrarLog(DB, {
            usuarioId,
            acao: 'ATUALIZAR_CONFIG',
            modulo: 'ADMIN',
            descricao: `Configuração "${chave}" atualizada.`
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao atualizar configuração', detalhe: e.message }, 500);
    }
});

export default rotasConfiguracoes;
