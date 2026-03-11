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
    // Captura com fallback para os nomes salvos no dashboard (VITE_)
    const MSAL_TENANT_ID = c.env.MSAL_TENANT_ID || (c.env as any).VITE_MSAL_TENANT_ID;
    const MSAL_CLIENT_ID = c.env.MSAL_CLIENT_ID || (c.env as any).VITE_MSAL_CLIENT_ID;
    const { DB, JWT_SECRET, DOMINIO_INSTITUCIONAL, BOOTSTRAP_ADMIN_EMAIL } = c.env;
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
            if (!MSAL_TENANT_ID) throw new Error('MSAL_TENANT_ID não configurado no ambiente.');

            // Tenta primeiro com o Tenant específico (Geralmente falha em cross-domain)
            try {
                const rawPayload = await verifyWithJwks(idToken, {
                    jwks_uri: getJwksUri(MSAL_TENANT_ID),
                    allowedAlgorithms: ['RS256']
                });
                payload = rawPayload as unknown as AzureAdClaims;
            } catch (e: any) {
                // Se falhou, tenta com o endpoint GLOBAL (Resolve o Token Inválido)
                console.warn('[Auth] Tentando validação via Common JWKS...');
                const rawPayload = await verifyWithJwks(idToken, {
                    jwks_uri: getJwksUri('common'),
                    allowedAlgorithms: ['RS256']
                });
                payload = rawPayload as unknown as AzureAdClaims;
            }
        } catch (e: any) {
            console.error('[Auth] ❌ FALHA DE ASSINATURA FINAL:', e.message);
            return c.json({
                erro: 'Assinatura do Token não pôde ser validada pela Microsoft.',
                detalhe: e.message
            }, 401);
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

        // 4. Verificação de DB
        if (!DB) {
            console.error('[Auth] Erro: Binding "DB" não encontrado.');
            return c.json({ erro: 'Erro interno: Banco de dados não configurado.' }, 500);
        }

        // 5. Upsert do usuário (Whitelist - Regra 13)
        let usuario;
        try {
            const resUsuario = await DB
                .prepare('SELECT id, nome, email, role, versao_token FROM usuarios WHERE email = ?')
                .bind(email)
                .first();
            usuario = resUsuario as any;
        } catch (e: any) {
            console.error('[Auth] Erro ao consultar banco:', e.message);
            return c.json({
                erro: 'Erro ao consultar banco de dados. Verifique se o SCHEMA.sql foi executado.',
                detalhe: e.message
            }, 500);
        }

        // 5. Verificação de Bootstrap (Regra 13 - Admin via env)
        const listaBootstrap = (BOOTSTRAP_ADMIN_EMAIL || '').toLowerCase().split(',').map(e => e.trim());
        // Adiciona seu email de desenvolvedor/mentor na lista de permissão direta
        const emailsAutorizadosDireto = ['mateus099803@unieuro.com.br', 'mateus099803@unieuro.edu.br'];
        const isBootstrapAdmin = listaBootstrap.includes(email) || emailsAutorizadosDireto.includes(email);

        let isNew = false;

        if (!usuario) {
            if (isBootstrapAdmin) {
                // Novo usuário via bootstrap é ADMIN
                const novoId = crypto.randomUUID();
                try {
                    await DB.prepare('INSERT INTO usuarios (id, nome, email, role, versao_token) VALUES (?, ?, ?, "ADMIN", 1)')
                        .bind(novoId, nome, email)
                        .run();
                } catch (e: any) {
                    return c.json({ erro: 'Falha ao criar usuário de bootstrap.', detalhe: e.message }, 500);
                }

                usuario = { id: novoId, nome, email, role: 'ADMIN', versao_token: 1 };
                isNew = true;
            } else {
                // Acesso negado se não estiver pré-cadastrado
                return c.json({
                    erro: 'Acesso negado: email não autorizado.',
                    detalhe: `O email ${email} não está na lista de membros e não consta na lista de bootstrap.`
                }, 403);
            }
        } else {
            // Se já existe mas está na lista de bootstrap, garante que seja ADMIN
            if (isBootstrapAdmin && usuario.role !== 'ADMIN') {
                try {
                    await DB.prepare('UPDATE usuarios SET role = "ADMIN", nome = ? WHERE id = ?')
                        .bind(nome, usuario.id)
                        .run();
                    usuario.role = 'ADMIN';
                    usuario.nome = nome;
                } catch (e: any) {
                    console.warn('[Auth] Falha ao elevar cargo para ADMIN via bootstrap:', e.message);
                }
            } else {
                // Atualiza nome se mudou no Azure
                try {
                    await DB.prepare('UPDATE usuarios SET nome = ? WHERE id = ?').bind(nome, usuario.id).run();
                    usuario.nome = nome;
                } catch (e: any) {
                    console.warn('[Auth] Falha ao atualizar nome do usuário:', e.message);
                }
            }
        }



        // 5. Gerar JWT Interno
        if (!JWT_SECRET) {
            console.error('[Auth] JWT_SECRET não definido.');
            return c.json({ erro: 'Erro interno de configuração: JWT_SECRET ausente.' }, 500);
        }

        const tokenLocal = await sign(
            {
                id: usuario.id,
                role: usuario.role,
                email: usuario.email,
                versao_token: usuario.versao_token || 1,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 dias (Estratégia PWA)
            },
            JWT_SECRET
        );

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: isNew ? 'CADASTRO_MSAL' : 'LOGIN_MSAL',
            modulo: 'auth',
            descricao: `Login realizado via Microsoft: ${email}`,
            ip
        });

        return c.json({ token: tokenLocal, usuario });

    } catch (e: any) {
        console.error('[Auth] Erro crítico inesperado:', e);
        return c.json({ erro: 'Erro interno crítico: ' + (e.message || 'Erro desconhecido') }, 500);
    }
});

export default rotasAuth;