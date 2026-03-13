import { Hono, Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { validarRedeLocal } from '../middleware/rede'; // Importando o middleware de rede
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';

const rotasPonto = new Hono<{ Bindings: Env, Variables: { usuario: any } }>({ strict: false });

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
        const { DB, softhub_kv } = c.env;
        const { tipo } = (c.req as any).valid('json');

        // 1. Buscar Janela de Trabalho na Governança
        let horaInicio = '13:00';
        let horaFim = '17:00';

        try {
            const chaves = ['hora_inicio_ponto', 'hora_fim_ponto'];
            const configs: Record<string, string> = {};

            for (const k of chaves) {
                let v = await softhub_kv?.get(k);
                if (!v) {
                    const row = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind(k).first() as any;
                    if (row) {
                        v = row.valor;
                        if (softhub_kv) await softhub_kv.put(k, v!, { expirationTtl: 3600 });
                    }
                }
                if (v) configs[k] = v.replace(/"/g, ''); // Limpa aspas do JSON/KV
            }

            if (configs.hora_inicio_ponto) horaInicio = configs.hora_inicio_ponto;
            if (configs.hora_fim_ponto) horaFim = configs.hora_fim_ponto;
        } catch (e) {
            console.error('[PONTO] Falha ao carregar jornada, usando padrão:', e);
        }

        // Validação de horário dinâmica
        const agora = new Date();
        const horaBrasiliaStr = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
        
        const converterParaMinutos = (h: string) => {
            const [horas, minutos] = h.split(':').map(Number);
            return horas * 60 + minutos;
        };

        const agoraMinutos = converterParaMinutos(horaBrasiliaStr);
        const inicioMinutos = converterParaMinutos(horaInicio);
        const fimMinutos = converterParaMinutos(horaFim);

        if (agoraMinutos < inicioMinutos || agoraMinutos > fimMinutos) {
            return c.json({ 
                erro: 'Fora do horário permitido.', 
                detalhe: `O registro de ponto está autorizado apenas entre ${horaInicio} e ${horaFim}.` 
            }, 403);
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

// RODOVIA DE TESTE: Registro de ponto sem travas (Somente ADMIN)
rotasPonto.post('/teste', 
    autenticacaoRequerida('ADMIN'), 
    zValidator('json', BaterPontoSchema), 
    async (c: Context) => {
        const { DB } = c.env;
        const { tipo } = (c.req as any).valid('json');

        try {
            const usuario = c.get('usuario') as any;
            const ipOrigem = c.req.header('CF-Connecting-IP') || '127.0.0.1';

            // Registra sem validar horário ou IP
            await DB.prepare(`INSERT INTO ponto_registros (id, usuario_id, tipo, ip_origem) VALUES (?, ?, ?, ?)`).bind(crypto.randomUUID(), usuario.id, tipo, ipOrigem).run();

            await registrarLog(DB, {
                usuarioId: usuario.id,
                acao: tipo === 'entrada' ? 'PONTO_ENTRADA_TESTE' : 'PONTO_SAIDA_TESTE',
                modulo: 'ponto',
                descricao: `[TESTE] Batida de ${tipo} registrada via endpoint de bypass`,
                ip: ipOrigem,
                entidadeTipo: 'ponto_registros'
            });

            return c.json({ sucesso: true, mensagem: `[TESTE] ${tipo} registrado com sucesso.` });
        } catch (erro) {
            console.error("[ERRO-TESTE] POST /api/ponto/teste", erro);
            return c.json({ erro: 'Falha ao registrar ponto de teste' }, 500);
        }
    });

export default rotasPonto;