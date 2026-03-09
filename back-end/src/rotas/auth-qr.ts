import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { Env } from '../index';
import { registrarLog } from '../servicos/servico-logs';
import { autenticacaoRequerida } from '../middleware/auth';

const rotasAuthQr = new Hono<{ Bindings: Env }>();

// ── QR Code: Gerar Sessão ─────────────────────────────────────────────────────
rotasAuthQr.post('/qr/gerar', async (c) => {
    const { DB } = c.env;
    const sessaoId = crypto.randomUUID();
    const expiraEm = new Date(Date.now() + 1000 * 30).toISOString(); // 30 segundos

    try {
        await DB.prepare(
            'INSERT INTO sessoes_qr (id, status, expira_em, ip_origem, user_agent) VALUES (?, ?, ?, ?, ?)'
        )
            .bind(
                sessaoId,
                'pendente',
                expiraEm,
                c.req.header('CF-Connecting-IP') ?? 'desconhecido',
                c.req.header('User-Agent') ?? 'desconhecido'
            )
            .run();

        return c.json({ sessaoId, expiraEm });
    } catch (err: any) {
        console.error('[QR] Erro ao gerar sessão:', err);
        return c.json({ erro: 'Erro ao gerar sessão de login.' }, 500);
    }
});

// ── QR Code: Verificar Status ─────────────────────────────────────────────────
rotasAuthQr.get('/qr/verificar/:id', async (c) => {
    const { DB } = c.env;
    const id = c.req.param('id');

    try {
        const sessao = await DB.prepare(
            'SELECT * FROM sessoes_qr WHERE id = ?'
        )
            .bind(id)
            .first<{ status: string; expira_em: string; usuario_id: string; token_acesso: string }>();

        if (!sessao) {
            return c.json({ erro: 'Sessão não encontrada.' }, 404);
        }

        // Verifica expiração
        const agora = new Date().toISOString();
        if (sessao.status === 'pendente' && sessao.expira_em < agora) {
            await DB.prepare('UPDATE sessoes_qr SET status = ? WHERE id = ?')
                .bind('expirado', id)
                .run();
            return c.json({ status: 'expirado' });
        }

        if (sessao.status === 'identificado' && sessao.usuario_id) {
            const usuario = await DB.prepare(
                'SELECT id, nome, email, role, foto_perfil FROM usuarios WHERE id = ?'
            )
                .bind(sessao.usuario_id)
                .first();

            return c.json({
                status: 'identificado',
                usuario
            });
        }

        if (sessao.status === 'autorizado' && sessao.usuario_id) {
            const usuario = await DB.prepare(
                'SELECT id, nome, email, role, foto_perfil FROM usuarios WHERE id = ?'
            )
                .bind(sessao.usuario_id)
                .first();

            // Consome a sessão para não permitir reuso do mesmo token via poll
            await DB.prepare('UPDATE sessoes_qr SET status = ? WHERE id = ?')
                .bind('consumido', id)
                .run();

            return c.json({
                status: 'autorizado',
                token: sessao.token_acesso,
                usuario
            });
        }

        return c.json({ status: sessao.status });
    } catch (err: any) {
        console.error('[QR] Erro ao verificar status:', err);
        return c.json({ erro: 'Erro ao verificar status da sessão.' }, 500);
    }
});

// ── QR Code: Identificar (Chamado ao ESCANEAR) ───────────────────────────────
rotasAuthQr.post('/qr/identificar', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario' as any) as any;

    try {
        const { sessaoId } = await c.req.json();
        if (!sessaoId) return c.json({ erro: 'ID da sessão ausente.' }, 400);

        const sessao = await DB.prepare('SELECT status FROM sessoes_qr WHERE id = ?')
            .bind(sessaoId)
            .first<{ status: string }>();

        if (!sessao) return c.json({ erro: 'Sessão não encontrada.' }, 404);
        if (sessao.status !== 'pendente') return c.json({ erro: 'Sessão não está mais disponível.' }, 400);

        // Apenas marca como identificado e vincula o usuário para o polling mostrar no desktop
        await DB.prepare(
            'UPDATE sessoes_qr SET status = ?, usuario_id = ? WHERE id = ?'
        )
            .bind('identificado', usuario.id, sessaoId)
            .run();

        return c.json({ sucesso: true });
    } catch (err: any) {
        return c.json({ erro: 'Erro ao identificar.' }, 500);
    }
});

// ── QR Code: Autorizar (Chamado ao CONFIRMAR) ────────────────────────────────
rotasAuthQr.post('/qr/autorizar', autenticacaoRequerida(), async (c) => {
    const { DB, JWT_SECRET } = c.env;
    const usuario = c.get('usuario' as any) as any;

    try {
        const { sessaoId } = await c.req.json();
        if (!sessaoId) return c.json({ erro: 'ID da sessão ausente.' }, 400);

        const sessao = await DB.prepare('SELECT status, expira_em FROM sessoes_qr WHERE id = ?')
            .bind(sessaoId)
            .first<{ status: string; expira_em: string }>();

        if (!sessao) return c.json({ erro: 'Sessão não encontrada.' }, 404);
        
        // Pode autorizar se estiver pendente OU já identificado
        if (sessao.status !== 'pendente' && sessao.status !== 'identificado') {
            return c.json({ erro: 'Sessão inválida.' }, 400);
        }

        const agora = new Date().toISOString();
        if (sessao.expira_em < agora) {
            await DB.prepare('UPDATE sessoes_qr SET status = ? WHERE id = ?').bind('expirado', sessaoId).run();
            return c.json({ erro: 'Sessão expirada.' }, 400);
        }

        // Incrementa a versão do token para desconectar outras sessões (Regra: Nova conexão desconecta anterior)
        const resVersao = await DB.prepare(
            'UPDATE usuarios SET versao_token = versao_token + 1 WHERE id = ? RETURNING versao_token'
        ).bind(usuario.id).first<{ versao_token: number }>();
        
        const novaVersao = resVersao?.versao_token || 1;

        // Gera novo token para o desktop com a NOVA versão
        const tokenDesktop = await sign(
            {
                id: usuario.id,
                role: usuario.role,
                email: usuario.email,
                versao_token: novaVersao,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 dias
            },
            JWT_SECRET,
        );

        await DB.prepare(
            'UPDATE sessoes_qr SET status = ?, usuario_id = ?, token_acesso = ? WHERE id = ?'
        )
            .bind('autorizado', usuario.id, tokenDesktop, sessaoId)
            .run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            acao: 'LOGIN_QR_AUTORIZADO',
            modulo: 'auth',
            descricao: `Login via QR Code autorizado pelo celular para o ID: ${sessaoId}`,
            ip: c.req.header('CF-Connecting-IP') ?? ''
        });

        return c.json({ sucesso: true });
    } catch (err: any) {
        console.error('[QR] Erro ao autenticar:', err);
        return c.json({ erro: 'Erro ao processar autenticação QR.' }, 500);
    }
});

export default rotasAuthQr;
