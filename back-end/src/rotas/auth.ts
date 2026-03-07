import { Hono } from 'hono';
import { verifyWithJwks, sign } from 'hono/jwt';
import { Env } from '../index';
import { registrarLog } from '../servicos/servico-logs';
import { AzureAdClaims, getJwksUri, validarClaims } from '../servicos/servico-msal';

/**
 * Rota de Autenticação - Fluxo MSAL (Regra 13)
 * Integração com Azure AD da Unieuro
 */
const rotasAuth = new Hono<{ Bindings: Env }>();

rotasAuth.post('/msal', async (c) => {
    const { DB, JWT_SECRET, MSAL_TENANT_ID, MSAL_CLIENT_ID, DOMINIO_INSTITUCIONAL, BOOTSTRAP_ADMIN_EMAIL } = c.env;
    const ip = c.req.header('CF-Connecting-IP') ?? 'desconhecido';

    try {
        const body = await c.req.json();
        const idToken = body.idToken;

        if (!idToken) {
            return c.json({ erro: 'idToken ausente.' }, 400);
        }

        // 1. Validar assinatura RS256 com JWKS da Microsoft
        let payload: AzureAdClaims;
        try {
            const rawPayload = await verifyWithJwks(idToken, {
                jwks_uri: getJwksUri(MSAL_TENANT_ID),
                allowedAlgorithms: ['RS256']
            });
            payload = rawPayload as unknown as AzureAdClaims;
        } catch (e) {
            console.warn('[Auth] Falha na verificação do idToken:', e);
            return c.json({ erro: 'Token inválido ou expirado.' }, 401);
        }

        // 2. Validar claims de negócio
        const erroValidacao = validarClaims(payload, MSAL_TENANT_ID, MSAL_CLIENT_ID, DOMINIO_INSTITUCIONAL);
        if (erroValidacao) {
            console.warn('[Auth] Claims inválidas:', erroValidacao);
            return c.json({
                erro: 'Rejeitado por validação de domínio/segurança.',
                detalhe: erroValidacao
            }, 403);
        }

        // 3. Extrair dados
        const email = (payload.upn || payload.preferred_username || '').toLowerCase();
        const nome = payload.name || email;

        // 4. Upsert do usuário (Whitelist - Regra 13)
        let usuario = await DB
            .prepare('SELECT id, nome, email, role, ativo FROM usuarios WHERE email = ?')
            .bind(email)
            .first<{ id: string; nome: string; email: string; role: string; ativo: number }>();

        let isNew = false;

        if (!usuario) {
            const bootstrapEmail = BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();

            if (bootstrapEmail && email === bootstrapEmail) {
                // Primeiro Admin via bootstrap
                const novoId = crypto.randomUUID();
                await DB.prepare('INSERT INTO usuarios (id, nome, email, role, ativo) VALUES (?, ?, ?, "ADMIN", 1)')
                    .bind(novoId, nome, email)
                    .run();

                usuario = { id: novoId, nome, email, role: 'ADMIN', ativo: 1 };
                isNew = true;
            } else {
                // Acesso negado se não estiver pré-cadastrado
                return c.json({
                    erro: 'Acesso negado: email não autorizado.',
                    detalhe: `O email ${email} não está na lista de membros e não é o email de bootstrap (${BOOTSTRAP_ADMIN_EMAIL}).`
                }, 403);
            }
        } else {
            // Atualiza nome se mudou no Azure
            await DB.prepare('UPDATE usuarios SET nome = ? WHERE id = ?').bind(nome, usuario.id).run();
            usuario.nome = nome;
        }

        if (usuario.ativo === 0) {
            return c.json({ erro: 'Conta desativada. Contate o suporte.' }, 403);
        }

        // 5. Gerar JWT Interno
        if (!JWT_SECRET) {
            console.error('[Auth] JWT_SECRET não definido.');
            return c.json({ erro: 'Erro interno de configuração.' }, 500);
        }

        const tokenLocal = await sign(
            {
                id: usuario.id,
                role: usuario.role,
                email: usuario.email,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 dias
            },
            JWT_SECRET
        );

        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            acao: isNew ? 'CADASTRO_MSAL' : 'LOGIN_MSAL',
            modulo: 'auth',
            descricao: `Login realizado via Microsoft: ${email}`,
            ip
        });

        return c.json({ token: tokenLocal, usuario });

    } catch (e: any) {
        console.error('[Auth] Erro crítico:', e);
        return c.json({ erro: 'Erro interno ao processar login: ' + e.message }, 500);
    }
});

export default rotasAuth;