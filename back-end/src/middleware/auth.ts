import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { Env } from '../index';

export interface UsuarioAutenticado {
    id: string;
    role: string;
    email: string;
    nome: string;
}

type HonoEnv = { Bindings: Env; Variables: { usuario: UsuarioAutenticado } };

// ─── Funções Auxiliares (com cache) ──────────────────────────────────────────

/**
 * Recupera a hierarquia de cargos (roles) do sistema.
 * Utiliza cache no KV para performance.
 */
async function getHierarquiaRoles(c: Context<HonoEnv>): Promise<string[] | null> {
    const { DB, softhub_kv } = c.env;
    let hierarquiaJson = await softhub_kv.get('hierarquia_roles');
    if (!hierarquiaJson) {
        const resConfig = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('hierarquia_roles').first<{ valor: string }>();
        if (resConfig) {
            hierarquiaJson = resConfig.valor;
            await softhub_kv.put('hierarquia_roles', hierarquiaJson, { expirationTtl: 3600 });
        } else {
            console.error('[AUTH] CRÍTICO: hierarquia_roles não encontrada no banco de dados.');
            return null;
        }
    }
    try {
        const hierarquia = JSON.parse(hierarquiaJson);
        if (!Array.isArray(hierarquia)) throw new Error('O valor não é um array.');
        return hierarquia;
    } catch (e) {
        console.error('[AUTH] CRÍTICO: Falha ao parsear hierarquia_roles do banco.', e);
        return null;
    }
}

/**
 * Recupera o mapeamento de permissões por role.
 * Utiliza cache no KV para performance.
 */
async function getPermissoesRoles(c: Context<HonoEnv>): Promise<Record<string, any> | null> {
    const { DB, softhub_kv } = c.env;
    let permissoesJson = await softhub_kv.get('permissoes_roles');
    if (!permissoesJson) {
        const resConfig = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind('permissoes_roles').first<{ valor: string }>();
        if (resConfig) {
            permissoesJson = resConfig.valor;
            await softhub_kv.put('permissoes_roles', permissoesJson, { expirationTtl: 3600 });
        } else {
            console.error('[AUTH] CRÍTICO: permissoes_roles não encontradas no banco de dados.');
            return null;
        }
    }
    try {
        return JSON.parse(permissoesJson);
    } catch (e) {
        console.error('[AUTH] CRÍTICO: Falha ao parsear permissoes_roles do banco.', e);
        return null;
    }
}

// ─── Middleware Principal de Autenticação ───────────────────────────────────

/**
 * Middleware que exige autenticação JWT e opcionalmente um nível hierárquico mínimo.
 * @param roleMinimoRequerido Cargo mínimo para acessar a rota (ex: 'LIDER').
 */
export function autenticacaoRequerida(roleMinimoRequerido?: string) {
    return async (c: Context<HonoEnv>, next: Next) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ erro: 'Token de autenticação ausente.' }, 401);
        }
        const token = authHeader.slice(7);
        const segredo = c.env.JWT_SECRET;
        if (!segredo) {
            console.error('[Auth Middleware] JWT_SECRET não definido.');
            return c.json({ erro: 'Erro interno de configuração.' }, 500);
        }

        let payload: any;
        try {
            payload = await verify(token, segredo, 'HS256');
        } catch {
            return c.json({ erro: 'Token inválido ou expirado.' }, 401);
        }

        // ─── OTIMIZAÇÃO: Cache de Sessão no KV ───
        const chaveCache = `sessao:${payload.id}`;
        let resUsuario: any;

        if (c.env.softhub_kv) {
            const cache = await c.env.softhub_kv.get(chaveCache);
            if (cache) resUsuario = JSON.parse(cache);
        }

        if (!resUsuario) {
            resUsuario = await c.env.DB.prepare('SELECT id, nome, email, role, versao_token FROM usuarios WHERE id = ?').bind(payload.id).first<any>();
            if (!resUsuario) {
                return c.json({ erro: 'Usuário não encontrado.' }, 401);
            }
            // Salva no KV por 1 hora para evitar D1 em cada requisição
            if (c.env.softhub_kv) {
                await c.env.softhub_kv.put(chaveCache, JSON.stringify(resUsuario), { expirationTtl: 3600 });
            }
        }

        if (payload.versao_token !== undefined && resUsuario.versao_token !== payload.versao_token) {
            return c.json({ erro: 'Sua sessão foi encerrada porque você entrou em outro dispositivo.' }, 401);
        }

        c.set('usuario', { id: resUsuario.id, role: resUsuario.role, email: resUsuario.email, nome: resUsuario.nome });

        if (resUsuario.role === 'ADMIN') {
            return await next();
        }

        if (roleMinimoRequerido) {
            const hierarquiaRoles = await getHierarquiaRoles(c);
            if (!hierarquiaRoles) {
                return c.json({ erro: 'O sistema ainda não foi configurado. Contate o administrador.' }, 500);
            }
            const indiceUsuario = hierarquiaRoles.indexOf(resUsuario.role as any);
            const indiceRequerido = hierarquiaRoles.indexOf(roleMinimoRequerido as any);
            if (indiceUsuario === -1 || indiceRequerido === -1 || indiceUsuario < indiceRequerido) {
                console.warn(`[AUTH] Acesso negado: Usuário ${resUsuario.nome} tentou recurso que exige ${roleMinimoRequerido}`);
                return c.json({ erro: 'Permissão insuficiente.' }, 403);
            }
        }

        await next();
    };
}

// ─── Middleware de Verificação de Permissão Específica ──────────────────────

/**
 * Middleware para verificar se o usuário possui permissões específicas.
 * Suporta permissões simples (ex: 'tarefas:criar') ou curingas (ex: '*').
 * @param permissaoRequerida String ou Array de strings com as permissões necessárias.
 * @returns Um middleware Hono.
 */
export function verificarPermissao(permissaoRequerida: string | string[]) {
    return async (c: Context<HonoEnv>, next: Next) => {
        const usuario = c.get('usuario');
        if (!usuario || !usuario.role) {
            return c.json({ erro: 'Usuário não autenticado.' }, 401);
        }

        if (usuario.role === 'ADMIN') return await next();

        const permissoes_roles = await getPermissoesRoles(c);
        if (!permissoes_roles) {
            return c.json({ erro: 'Configurações de permissão não encontradas.' }, 500);
        }

        const permissoes = Array.isArray(permissaoRequerida) ? permissaoRequerida : [permissaoRequerida];
        const configRole = permissoes_roles[usuario.role] || {};
        const configTodos = permissoes_roles['TODOS'] || {};

        const temAcesso = permissoes.some(p => {
            const [modulo, acao] = p.split(':');
            
            // 1. Curinga
            if (configRole['*'] === true || configTodos['*'] === true) return true;

            // 2. Plano
            if (configRole[p] === true || configTodos[p] === true) return true;

            // 3. Aninhado
            if ((configRole[modulo] && typeof configRole[modulo] === 'object' && configRole[modulo][acao] === true) ||
                (configTodos[modulo] && typeof configTodos[modulo] === 'object' && configTodos[modulo][acao] === true)) {
                return true;
            }

            return false;
        });

        if (temAcesso) return await next();

        console.warn(`[AUTH] Acesso negado: Usuário ${usuario.nome} (Role: ${usuario.role}) tentou '${permissaoRequerida}'`);
        return c.json({ erro: 'Você não tem permissão para esta tela.' }, 403);
    };
}