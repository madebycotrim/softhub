import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
import { sugerirPrioridade, resumirTarefa, analisarJustificativa, formatarAviso } from '../servicos/servico-ai';

const rotasIA = new Hono<{ Bindings: Env }>();

// Todas as rotas de IA exigem autenticação
rotasIA.use('*', autenticacaoRequerida());

/**
 * POST /api/ia/prioridade
 * Sugere prioridade com base no texto
 */
rotasIA.post('/prioridade', async (c) => {
    const { AI } = c.env;
    const { texto } = await c.req.json();
    
    if (!texto) return c.json({ erro: 'Texto é necessário.' }, 400);

    try {
        const sugestao = await sugerirPrioridade(AI, texto);
        return c.json(sugestao);
    } catch (e: any) {
        return c.json({ erro: 'IA temporariamente indisponível.', detalhe: e.message }, 500);
    }
});

/**
 * POST /api/ia/justificativa
 * Analisa justificativa de ponto
 */
rotasIA.post('/analisar-justificativa', async (c) => {
    const { AI } = c.env;
    const { motivo } = await c.req.json();

    if (!motivo) return c.json({ erro: 'Motivo é necessário.' }, 400);

    try {
        const analise = await analisarJustificativa(AI, motivo);
        return c.json(analise);
    } catch (e: any) {
        return c.json({ erro: 'IA temporariamente indisponível.' }, 500);
    }
});

/**
 * POST /api/ia/refinar-aviso
 * Transforma rascunho em aviso oficial
 */
rotasIA.post('/refinar-aviso', async (c) => {
    const { AI } = c.env;
    const { rascunho } = await c.req.json();

    if (!rascunho) return c.json({ erro: 'Rascunho é necessário.' }, 400);

    try {
        const aviso = await formatarAviso(AI, rascunho);
        return c.json(aviso);
    } catch (e: any) {
        return c.json({ erro: 'IA temporariamente indisponível.' }, 500);
    }
});

export default rotasIA;
