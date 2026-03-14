import { Hono, Context } from 'hono';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { Env } from '../index';

const rotasConfiguracoes = new Hono<{ Bindings: Env }>();

/**
 * Lista todas as configurações do sistema.
 * Requer permissão 'configuracoes:visualizar'.
 */
rotasConfiguracoes.get('/', autenticacaoRequerida(), verificarPermissao('configuracoes:visualizar'), async (c) => {
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

/**
 * Endpoint público que retorna configurações essenciais (domínios, permissões, etc).
 * Acessível sem autenticação.
 */
rotasConfiguracoes.get('/publico', async (c: Context) => {
    const { DB, softhub_kv } = c.env;
    const CHAVE_CACHE = 'configs_publicas';

    try {
        // 1. Tenta buscar no cache KV primeiro
        if (softhub_kv) {
            const cache = await softhub_kv.get(CHAVE_CACHE);
            if (cache) return c.json(JSON.parse(cache));
        }

        const { results } = await DB.prepare('SELECT chave, valor FROM configuracoes_sistema WHERE chave IN (?, ?, ?, ?, ?, ?)')
            .bind('permissoes_roles', 'hierarquia_roles', 'dominios_autorizados', 'modo_manutencao', 'hora_inicio_ponto', 'hora_fim_ponto')
            .all();

        const config: Record<string, any> = {
            permissoes_roles: {},
            hierarquia_roles: [],
            dominios_autorizados: ['unieuro.com.br'],
            modo_manutencao: false,
            hora_inicio_ponto: '13:00',
            hora_fim_ponto: '17:00'
        };

        if (results) {
            results.forEach((row: any) => {
                try {
                    config[row.chave] = JSON.parse(row.valor);
                } catch {
                    config[row.chave] = row.valor === 'true' ? true : row.valor === 'false' ? false : row.valor;
                }
            });
        }

        // 2. Salva no KV por 1 hora
        if (softhub_kv) {
            await softhub_kv.put(CHAVE_CACHE, JSON.stringify(config), { expirationTtl: 3600 });
        }

        return c.json(config);
    } catch (e: any) {
        return c.json({ erro: 'Falha ao buscar configurações públicas', detalhe: e.message }, 500);
    }
});

/**
 * Atualiza múltiplas configurações do sistema em lote.
 * Requer permissão 'configuracoes:editar'.
 */
rotasConfiguracoes.post('/', autenticacaoRequerida(), verificarPermissao('configuracoes:editar'), async (c) => {
    const { DB, softhub_kv } = c.env;
    const body = await c.req.json();

    if (!body || typeof body !== 'object') {
        return c.json({ erro: 'Corpo da requisição inválido' }, 400);
    }

    const transacoes = Object.entries(body).map(([chave, valor]) => {
        const valorFinal = valor === undefined ? null : valor;
        return DB.prepare(`
            INSERT INTO configuracoes_sistema (id, chave, valor) 
            VALUES (?, ?, ?) 
            ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
        `).bind(crypto.randomUUID(), chave, JSON.stringify(valorFinal));
    });

    try {
        await DB.batch(transacoes);
        
        // Limpa cache KV de forma resiliente
        if (softhub_kv) {
            await softhub_kv.delete('configs_publicas');
            for (const chave of Object.keys(body)) {
                try {
                    await softhub_kv.delete(chave);
                } catch (kvErro) {
                    console.error(`[CONFIG] Falha ao limpar KV para ${chave}:`, kvErro);
                }
            }
        }
        
        return c.json({ sucesso: true, mensagem: 'Configurações salvas com sucesso.' });
    } catch (e: any) {
        console.error('[CONFIG] Erro no batch POST /:', e);
        return c.json({ erro: 'Falha ao salvar configurações', detalhe: e.message }, 500);
    }
});

/**
 * Atualiza uma configuração específica identificada pela chave.
 * Possui travas de segurança para configurações críticas como 'permissoes_roles'.
 */
rotasConfiguracoes.patch('/:chave', autenticacaoRequerida(), verificarPermissao('configuracoes:editar'), async (c) => {
    const { DB, softhub_kv } = c.env;
    const usuario = c.get('usuario');
    const isAdmin = usuario.role === 'ADMIN';
    const chave = c.req.param('chave');
    const { valor } = await c.req.json();

    if (!chave) return c.json({ erro: 'Chave não especificada.' }, 400);

    // ─── TRAVA DE SEGURANÇA: Matriz de Governança ───
    if (chave === 'permissoes_roles' && !isAdmin) {
        try {
            const resAtual = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('permissoes_roles').first<{ valor: string }>();
            const permissoesAtuais = resAtual ? JSON.parse(resAtual.valor) : {};
            const permissoesNovas = valor;

            // Percorre todas as roles para ver se houve tentativa de mudar 'configuracoes:matriz_governanca'
            const roles = new Set([...Object.keys(permissoesAtuais), ...Object.keys(permissoesNovas)]);
            
            for (const role of roles) {
                const atualv = permissoesAtuais[role]?.['configuracoes:matriz_governanca'];
                const novov = permissoesNovas[role]?.['configuracoes:matriz_governanca'];
                
                if (atualv !== novov) {
                    return c.json({ erro: 'Apenas o Administrador pode delegar ou revogar permissões de Governança Crítica.' }, 403);
                }
            }
        } catch (e) {
            console.error('[CONFIG] Erro ao validar trava de governança:', e);
            return c.json({ erro: 'Falha na validação de segurança.' }, 500);
        }
    }

    try {
        const valorFinal = valor === undefined ? null : valor;
        await DB.prepare(`
            INSERT INTO configuracoes_sistema (id, chave, valor) 
            VALUES (?, ?, ?) 
            ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
        `)
            .bind(crypto.randomUUID(), chave, JSON.stringify(valorFinal))
            .run();
        
        // Limpa cache no KV de forma resiliente
        if (softhub_kv) {
            try {
                await softhub_kv.delete('configs_publicas');
                await softhub_kv.delete(chave);
            } catch (kvErro) {
                console.error(`[CONFIG] Falha ao limpar KV para ${chave}:`, kvErro);
            }
        }
        
        return c.json({ sucesso: true, mensagem: `Configuração ${chave} atualizada.` });
    } catch (e: any) {
        console.error(`[CONFIG] Erro ao atualizar ${chave}:`, e);
        return c.json({ erro: 'Falha ao atualizar configuração', detalhe: e.message }, 500);
    }
});

/**
 * Renomeia um cargo (role) em todo o sistema.
 * Atualiza permissões, hierarquia e todos os usuários vinculados.
 * Requer permissão de 'ADMIN'.
 */
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
        if (softhub_kv) {
            await softhub_kv.delete('configs_publicas');
            await softhub_kv.delete('permissoes_roles');
            await softhub_kv.delete('hierarquia_roles');
        }
        
        // Nota: usuários logados podem precisar de novo token se a role for validada no JWT, 
        // mas aqui a role é buscada no banco por ID no middleware autenticacaoRequerida, então será imediato.

        return c.json({ sucesso: true, mensagem: `Cargo renomeado de '${antigo}' para '${novo}' com sucesso.` });
    } catch (e: any) {
        return c.json({ erro: 'Falha crítica ao renomear cargo', detalhe: e.message }, 500);
    }
});

export default rotasConfiguracoes;