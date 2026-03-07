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

/**
 * Middleware que valida o JWT INTERNO gerado pela rota /api/auth/msal.
 *
 * Fluxo completo:
 * 1. Frontend → loginPopup MSAL → idToken da Microsoft
 * 2. Frontend → POST /api/auth/msal com idToken
 * 3. Backend valida idToken com JWKS da Microsoft → gera JWT interno (HS256)
 * 4. Frontend salva JWT interno no localStorage
 * 5. Em toda requisição protegida → Authorization: Bearer <jwt-interno>
 * 6. ESTE MIDDLEWARE valida o JWT interno com JWT_SECRET
 * 7. Busca usuário no banco (garante que role alterado pelo ADMIN vale imediatamente)
 * 8. Expõe { id, role, email, nome } em c.get('usuario') para os handlers
 */
export function autenticacaoRequerida() {
    return async (c: Context<HonoEnv>, next: Next) => {

        // ── Passo 1: Extrai o token do header ─────────────────────────────────
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({ erro: 'Token de autenticação ausente.' }, 401);
        }
        const token = authHeader.slice(7);

        // ── Passo 2: Verifica JWT_SECRET ──────────────────────────────────────
        const segredo = c.env.JWT_SECRET;
        if (!segredo) {
            console.error('[Auth Middleware] JWT_SECRET não definido.');
            return c.json({ erro: 'Erro interno de configuração.' }, 500);
        }

        // ── Passo 3: Verifica assinatura do JWT interno ───────────────────────
        // O algoritmo HS256 é fixado — o mesmo usado no sign() da rota /msal.
        let payload: { id: string; role: string; email: string; exp: number };
        try {
            payload = await verify(token, segredo, 'HS256') as typeof payload;
        } catch {
            return c.json({ erro: 'Token inválido ou expirado.' }, 401);
        }

        // ── Passo 4: Valida payload mínimo ────────────────────────────────────
        if (!payload.id || !payload.role) {
            return c.json({ erro: 'Token com payload inválido.' }, 401);
        }

        // ── Passo 5: Busca usuário no banco ───────────────────────────────────
        // Garante que: usuário ainda existe, está ativo, e usa o role ATUAL do banco.
        // Se um ADMIN alterou o role após o login, a mudança vale imediatamente.
        const usuario = await c.env.DB
            .prepare('SELECT id, nome, email, role, ativo FROM usuarios WHERE id = ?')
            .bind(payload.id)
            .first<{ id: string; nome: string; email: string; role: string; ativo: number }>();

        if (!usuario) {
            return c.json({ erro: 'Usuário não encontrado.' }, 401);
        }

        if (usuario.ativo === 0) {
            console.warn(`[AUTH] Acesso negado: Conta desativada para usuário ${usuario.id}`);
            return c.json({ erro: 'Conta desativada. Contate o suporte.' }, 403);
        }

        console.log(`[AUTH] Usuário autenticado: ${usuario.nome} (${usuario.role})`);

        // ── Passo 6: Expõe dados reais do banco para os handlers ──────────────
        c.set('usuario', {
            id: usuario.id,
            role: usuario.role,
            email: usuario.email,
            nome: usuario.nome,
        });

        await next();
    };
}