import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { validarRedeLocal } from '../middleware/rede';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasPonto = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar histórico de ponto do usuário
rotasPonto.get('/', autenticacaoRequerida(), verificarPermissao('ponto:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    try {
        const agora = new Date();
        const horaBrasilia = (agora.getUTCHours() - 3 + 24) % 24;
        const hojeIso = agora.toISOString().split('T')[0];

        // Busca batida mais recente de hoje
        const ultimo = await DB.prepare(`
            SELECT * FROM ponto_registros 
            WHERE usuario_id = ? AND date(registrado_em) = date('now')
            ORDER BY registrado_em DESC LIMIT 1
        `).bind(usuario.id).first() as any;

        // REGRA: Se tiver entrada aberta e passou das 17h, encerra automaticamente
        if (ultimo?.tipo === 'entrada' && horaBrasilia >= 17) {
            const dataSaidaAuto = `${hojeIso}T20:00:00Z`; // 17h Brasília = 20h UTC
            
            await DB.prepare(`
                INSERT INTO ponto_registros (id, usuario_id, tipo, registrado_em, ip_origem)
                VALUES (?, ?, ?, ?, ?)
            `).bind(crypto.randomUUID(), usuario.id, 'saida', dataSaidaAuto, 'SISTEMA_AUTO').run();

            await registrarLog(DB, {
                usuarioId: usuario.id,
                usuarioNome: usuario.nome,
                usuarioEmail: usuario.email,
                usuarioRole: usuario.role,
                acao: 'PONTO_SAIDA_AUTO',
                modulo: 'ponto',
                descricao: `Saída automática processada às 17h (usuário esqueceu de bater)`,
                ip: '127.0.0.1',
                entidadeTipo: 'ponto_registros'
            });
        }

        // Busca batidas de hoje (atualizado)
        const hoje = await DB.prepare(`
            SELECT * FROM ponto_registros 
            WHERE usuario_id = ? AND date(registrado_em) = date('now')
            ORDER BY registrado_em ASC
        `).bind(usuario.id).all();

        // Busca histórico Geral (20 últimos)
        const historico = await DB.prepare(`
            SELECT * FROM ponto_registros 
            WHERE usuario_id = ? 
            ORDER BY registrado_em DESC LIMIT 20
        `).bind(usuario.id).all();

        return c.json({
            hoje: hoje.results || [],
            historico: historico.results || []
        });
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar histórico de ponto' }, 500);
    }
});

// Bater ponto - Requer Rede Local (Workflow 9)
rotasPonto.post('/', autenticacaoRequerida(), verificarPermissao('ponto:registrar'), validarRedeLocal, async (c: Context) => {
    const { DB } = c.env;
    const { tipo } = await c.req.json();

    // Validação de horário: 13:00 às 17:00 (Brasília - UTC-3)
    const agora = new Date();
    const horaBrasilia = (agora.getUTCHours() - 3 + 24) % 24;

    if (horaBrasilia < 13 || horaBrasilia >= 17) {
        return c.json({ erro: 'O sistema de ponto só funciona das 13:00 às 17:00.' }, 403);
    }

    try {
        const usuario = c.get('usuario') as any;
        const ipOrigem = c.req.header('CF-Connecting-IP') || '127.0.0.1';

        // Workflow 9 - Verificar sequência
        const ultimo = await DB.prepare(`
            SELECT tipo FROM ponto_registros
            WHERE usuario_id = ? AND DATE(registrado_em) = DATE('now')
            ORDER BY registrado_em DESC LIMIT 1
        `).bind(usuario.id).first() as any;

        if (ultimo?.tipo === tipo) {
            return c.json({ erro: `Você já registrou sua ${tipo}.` }, 400);
        }

        // Inserção no banco provisória para Etapa 5
        await DB.prepare(`
      INSERT INTO ponto_registros (id, usuario_id, tipo, ip_origem)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), usuario.id, tipo, ipOrigem).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            usuarioNome: usuario.nome,
            usuarioEmail: usuario.email,
            usuarioRole: usuario.role,
            acao: tipo === 'entrada' ? 'PONTO_ENTRADA' : 'PONTO_SAIDA',
            modulo: 'ponto',
            descricao: `Batida de ${tipo} registrada IP: ${ipOrigem}`,
            ip: ipOrigem,
            entidadeTipo: 'ponto_registros'
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        return c.json({ erro: 'Falha ao registrar ponto' }, 500);
    }
});

export default rotasPonto;
