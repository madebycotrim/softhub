import { Hono, Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { validarRedeLocal } from '../middleware/rede'; // Importando o middleware de rede
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasPonto = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar registros do usuário (Hoje e Histórico)
rotasPonto.get('/', autenticacaoRequerida(), verificarPermissao('ponto:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    try {
        // ... (código para buscar registros)
        const { results: hoje } = await DB.prepare(`SELECT id, tipo, registrado_em, ip_origem FROM ponto_registros WHERE usuario_id = ? AND DATE(registrado_em, '-3 hours') = DATE('now', '-3 hours') ORDER BY registrado_em DESC`).bind(usuario.id).all();
        const { results: historico } = await DB.prepare(`SELECT id, tipo, registrado_em, ip_origem FROM ponto_registros WHERE usuario_id = ? ORDER BY registrado_em DESC LIMIT 50`).bind(usuario.id).all();
        return c.json({ hoje, historico });
    } catch (erro: any) {
        console.error('[ERRO] GET /api/ponto:', erro);
        return c.json({ erro: 'Falha ao buscar registros de ponto', detalhe: erro.message }, 500);
    }
});

// Bater ponto - Requer presença na Rede UNIEURO
const BaterPontoSchema = z.object({
    tipo: z.enum(['entrada', 'saida'])
});

rotasPonto.post('/', 
    autenticacaoRequerida(), 
    verificarPermissao('ponto:registrar'), 
    validarRedeLocal, // <-- Validação de rede aplicada aqui!
    zValidator('json', BaterPontoSchema), 
    async (c: Context) => {
        const { DB } = c.env;
        const { tipo } = (c.req as any).valid('json');

        // Validação de horário
        const agora = new Date();
        const horaBrasilia = (agora.getUTCHours() - 3 + 24) % 24;
        if (horaBrasilia < 13 || horaBrasilia >= 17) {
            return c.json({ erro: 'O sistema de ponto só funciona das 13:00 às 17:00.' }, 403);
        }

        try {
            const usuario = c.get('usuario') as any;
            const ipOrigem = c.req.header('CF-Connecting-IP') || '127.0.0.1';

            // Validação de sequência
            const ultimo = await DB.prepare(`SELECT tipo FROM ponto_registros WHERE usuario_id = ? AND DATE(registrado_em) = DATE('now', '-3 hours') ORDER BY registrado_em DESC LIMIT 1`).bind(usuario.id).first() as any;
            if (ultimo?.tipo === tipo) {
                return c.json({ erro: `Você já registrou sua ${tipo} hoje.` }, 400);
            }

            // Inserção no banco
            await DB.prepare(`INSERT INTO ponto_registros (id, usuario_id, tipo, ip_origem) VALUES (?, ?, ?, ?)`).bind(crypto.randomUUID(), usuario.id, tipo, ipOrigem).run();

            await registrarLog(DB, {
                usuarioId: usuario.id,
                acao: tipo === 'entrada' ? 'PONTO_ENTRADA' : 'PONTO_SAIDA',
                modulo: 'ponto',
                descricao: `Batida de ${tipo} registrada IP: ${ipOrigem}`,
                ip: ipOrigem,
                entidadeTipo: 'ponto_registros'
            });

            return c.json({ sucesso: true });
        } catch (erro) {
            console.error("[ERRO] POST /api/ponto", erro);
            return c.json({ erro: 'Falha ao registrar ponto' }, 500);
        }
    });

export default rotasPonto;