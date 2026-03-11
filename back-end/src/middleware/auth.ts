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

        const resUsuario = await c.env.DB.prepare('SELECT id, nome, email, role, versao_token FROM usuarios WHERE id = ?').bind(payload.id).first<any>();
        if (!resUsuario) {
            return c.json({ erro: 'Usuário não encontrado.' }, 401);
        }
        if (payload.versao_token !== undefined && resUsuario.versao_token !== payload.versao_token) {
            return c.json({ erro: 'Sua sessão foi encerrada porque você entrou em outro dispositivo.' }, 401);
        }

        if (roleMinimoRequerido) {
            const hierarquiaRoles = await getHierarquiaRoles(c);
            if (!hierarquiaRoles) {
                return c.json({ erro: 'Erro crítico de configuração do sistema.' }, 500);
            }
            const indiceUsuario = hierarquiaRoles.indexOf(resUsuario.role as any);
            const indiceRequerido = hierarquiaRoles.indexOf(roleMinimoRequerido as any);
            if (indiceUsuario === -1 || indiceRequerido === -1 || indiceUsuario < indiceRequerido) {
                console.warn(`[AUTH] Acesso negado: Usuário ${resUsuario.nome} tentou acessar recurso que exige ${roleMinimoRequerido}`);
                return c.json({ erro: 'Permissão insuficiente.' }, 403);
            }
        }

        c.set('usuario', { id: resUsuario.id, role: resUsuario.role, email: resUsuario.email, nome: resUsuario.nome });
        await next();
    };
}

// ─── Middleware de Verificação de Permissão Específica ──────────────────────

export function verificarPermissao(permissaoRequerida: string) {
    return async (c: Context<HonoEnv>, next: Next) => {
        const usuario = c.get('usuario');
        if (!usuario || !usuario.role) {
            return c.json({ erro: 'Usuário não autenticado ou sem role definida.' }, 401);
        }

        const permissoes_roles = await getPermissoesRoles(c);
        if (!permissoes_roles) {
            return c.json({ erro: 'Erro crítico na configuração de permissões do sistema.' }, 500);
        }

        const [modulo, acao] = permissaoRequerida.split(':');
        if (!modulo || !acao) {
             return c.json({ erro: 'Formato de permissão inválido no código.' }, 500);
        }

        const temPermissao = permissoes_roles[usuario.role]?.[modulo]?.[acao] === true;

        if (temPermissao) {
            await next();
        } else {
            console.warn(`[AUTH] Acesso negado: Usuário ${usuario.nome} (Role: ${usuario.role}) tentou realizar a ação '${permissaoRequerida}' sem permissão.`);
            return c.json({ erro: 'Você não tem permissão para realizar esta ação.' }, 403);
        }
    };
}