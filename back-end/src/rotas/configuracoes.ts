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

// ─── GET /permissoes — Endpoint acessível para TODOS autenticados (UX) ─────────
rotasConfiguracoes.get('/publico/permissoes', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;

    try {
        const res = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?')
            .bind('permissoes_roles')
            .first();
        const config = res as any;

        if (!config) {
            return c.json({ permissoes_roles: {} });
        }

        return c.json({ permissoes_roles: JSON.parse(config.valor) });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar matriz de permissões', detalhe: e.message }, 500);
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

        // Buscar estado atual para o log "Antes/Depois"
        const atual = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind(chave).first() as any;
        let valorAnterior: any = null;
        if (atual) {
            try { valorAnterior = JSON.parse(atual.valor); } catch { valorAnterior = atual.valor; }
        }

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
            ip: c.req.header('CF-Connecting-IP') ?? '',
            dadosAnteriores: { [chave]: valorAnterior },
            dadosNovos: { [chave]: valor }
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        return c.json({ erro: 'Falha ao atualizar configuração', detalhe: e.message }, 500);
    }
});

// ─── PATCH /roles/:antigo/renomear — Renomear cargo e atualizar usuários ────────
rotasConfiguracoes.patch('/roles/:antigo/renomear', autenticacaoRequerida(), verificarPermissao('configuracoes:editar'), async (c: Context) => {
    const { DB } = c.env;
    const { antigo } = c.req.param();
    const { novo } = await c.req.json();

    if (!novo || !novo.trim()) {
        return c.json({ erro: 'Novo nome do cargo é obrigatório.' }, 400);
    }

    const novoFormatado = novo.toUpperCase().trim();
    if (antigo === novoFormatado) return c.json({ sucesso: true });

    // Bloqueia renomear cargos protegidos
    if (['ADMIN', 'TODOS'].includes(antigo)) {
        return c.json({ erro: 'Cargos do sistema não podem ser renomeados.' }, 403);
    }

    try {
        // 1. Busca a matriz de permissões
        const resConfig = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?')
            .bind('permissoes_roles')
            .first();
        const config = resConfig as any;

        if (!config) {
            return c.json({ erro: 'Matriz de permissões não encontrada.' }, 404);
        }

        const permissoesRolesOriginais = JSON.parse(config.valor);

        if (!permissoesRolesOriginais[antigo]) {
            return c.json({ erro: 'Cargo original não encontrado na matriz.' }, 404);
        }

        if (permissoesRolesOriginais[novoFormatado]) {
            return c.json({ erro: 'Já existe um cargo com este nome.' }, 409);
        }

        // 2. Transfere permissões e deleta antiga (Clone para o log)
        const permissoesRolesNovas = JSON.parse(JSON.stringify(permissoesRolesOriginais));
        permissoesRolesNovas[novoFormatado] = permissoesRolesNovas[antigo];
        delete permissoesRolesNovas[antigo];

        // 3. Execução em Batch para atomicidade (Atualizar Config + Atualizar Usuários)
        await DB.batch([
            DB.prepare('UPDATE configuracoes_sistema SET valor = ? WHERE chave = ?')
                .bind(JSON.stringify(permissoesRolesNovas), 'permissoes_roles'),
            DB.prepare('UPDATE usuarios SET role = ? WHERE role = ?')
                .bind(novoFormatado, antigo)
        ]);

        const usuario = c.get('usuario');
        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            usuarioRole: usuario.role,
            acao: 'CARGO_RENOMEADO',
            modulo: 'ADMIN',
            descricao: `Cargo "${antigo}" renomeado para "${novoFormatado}".`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            dadosAnteriores: { role: antigo, permissoes: permissoesRolesOriginais[antigo] },
            dadosNovos: { role: novoFormatado, permissoes: permissoesRolesNovas[novoFormatado] }
        });

        return c.json({ sucesso: true });
    } catch (e: any) {
        console.error('[CONFIGS] Erro ao renomear cargo:', e);
        return c.json({ erro: 'Falha ao renomear cargo.', detalhe: e.message }, 500);
    }
});

export default rotasConfiguracoes;
