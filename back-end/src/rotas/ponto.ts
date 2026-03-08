import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { validarRedeLocal } from '../middleware/rede';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasPonto = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar histórico de ponto do usuário
rotasPonto.get('/', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    try {
        // Busca batidas de hoje
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
rotasPonto.post('/', autenticacaoRequerida(), validarRedeLocal, async (c) => {
    const { DB } = c.env;
    const { tipo } = await c.req.json();

    try {
        const usuario = c.get('usuario') as any;
        const ipOrigem = c.req.header('CF-Connecting-IP') || '127.0.0.1';

        // Workflow 9 - Verificar sequência
        const ultimo = await DB.prepare(`
            SELECT tipo FROM ponto_registros
            WHERE usuario_id = ? AND DATE(registrado_em) = DATE('now')
            ORDER BY registrado_em DESC LIMIT 1
        `).bind(usuario.id).first<{ tipo: string }>();

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
