import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';

const rotasRelatorios = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

/**
 * 📊 RELATÓRIO DE ESTRUTURA DE EQUIPES
 * Retorna contagem de membros por grupo e equipe, além de lideranças.
 */
rotasRelatorios.get('/equipes', autenticacaoRequerida(), verificarPermissao('relatorios:visualizar'), async (c: Context) => {
    const { DB } = c.env;

    try {
        // 1. Resumo de Grupos
        const gruposResumo = await DB.prepare(`
            SELECT 
                g.id,
                g.nome,
                g.ativo,
                (SELECT nome FROM usuarios WHERE id = g.lider_id) as lider_nome,
                (SELECT COUNT(*) FROM equipes WHERE id IN (SELECT id FROM equipes WHERE id IN (SELECT equipe_id FROM usuarios WHERE grupo_id = g.id))) as total_equipes,
                (SELECT COUNT(*) FROM usuarios WHERE grupo_id = g.id AND ativo = 1) as total_membros
            FROM grupos g
            WHERE g.ativo = 1
        `).all();

        // 2. Resumo de Equipes
        const equipesResumo = await DB.prepare(`
            SELECT 
                e.id,
                e.nome,
                e.ativo,
                (SELECT nome FROM usuarios WHERE id = e.lider_id) as lider_nome,
                (SELECT g.nome FROM grupos g WHERE g.id IN (SELECT grupo_id FROM usuarios WHERE equipe_id = e.id LIMIT 1)) as grupo_nome,
                (SELECT COUNT(*) FROM usuarios WHERE equipe_id = e.id AND ativo = 1) as total_membros
            FROM equipes e
            WHERE e.ativo = 1
        `).all();

        return c.json({
            grupos: gruposResumo.results,
            equipes: equipesResumo.results
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /relatorios/equipes', erro);
        return c.json({ erro: 'Falha ao gerar relatório de equipes' }, 500);
    }
});

/**
 * 📅 RELATÓRIO GERAL DE FREQUÊNCIA
 * Retorna métricas agregadas de presença e justificativas.
 */
rotasRelatorios.get('/frequencia/geral', autenticacaoRequerida(), verificarPermissao('relatorios:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    const { data_inicio, data_fim } = c.req.query();

    const filtroData = data_inicio && data_fim 
        ? `AND registrado_em BETWEEN '${data_inicio}' AND '${data_fim}'`
        : `AND registrado_em >= date('now', '-30 days')`;

    const filtroDataJustificativa = data_inicio && data_fim 
        ? `AND criado_em BETWEEN '${data_inicio}' AND '${data_fim}'`
        : '';

    try {
        // Presenças diárias no período
        const presencasDiarias = await DB.prepare(`
            SELECT 
                date(registrado_em) as data,
                COUNT(DISTINCT usuario_id) as total_presentes
            FROM ponto_registros
            WHERE tipo = 'ENTRADA'
            ${filtroData}
            GROUP BY date(registrado_em)
            ORDER BY data ASC
        `).all();

        // Status das justificativas no período
        const justificativasStatus = await DB.prepare(`
            SELECT 
                status,
                COUNT(*) as total
            FROM justificativas_ponto
            WHERE ativo = 1
            ${filtroDataJustificativa}
            GROUP BY status
        `).all();

        // Tipos de justificativas mais comuns no período
        const justificativasTipos = await DB.prepare(`
            SELECT 
                tipo,
                COUNT(*) as total
            FROM justificativas_ponto
            WHERE ativo = 1 AND status = 'aprovada'
            ${filtroDataJustificativa}
            GROUP BY tipo
        `).all();

        return c.json({
            tendencia: presencasDiarias.results,
            statusJustificativas: justificativasStatus.results,
            tiposJustificativas: justificativasTipos.results
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /relatorios/frequencia/geral', erro);
        return c.json({ erro: 'Falha ao gerar relatório de frequência geral' }, 500);
    }
});

/**
 * 👤 RELATÓRIO DE FREQUÊNCIA POR MEMBRO
 * Retorna o histórico resumido de cada membro com base no período.
 */
rotasRelatorios.get('/frequencia/membros', autenticacaoRequerida(), verificarPermissao('relatorios:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    const { data_inicio, data_fim } = c.req.query();

    const subFiltroPonto = data_inicio && data_fim 
        ? `AND registrado_em BETWEEN '${data_inicio}' AND '${data_fim}'`
        : "";

    const subFiltroJustificativa = data_inicio && data_fim 
        ? `AND criado_em BETWEEN '${data_inicio}' AND '${data_fim}'`
        : "";

    try {
        const membrosFrequencia = await DB.prepare(`
            SELECT 
                u.id, 
                u.nome,
                u.email,
                e.nome as equipe_nome,
                g.nome as grupo_nome,
                (SELECT COUNT(DISTINCT date(registrado_em)) FROM ponto_registros WHERE usuario_id = u.id AND tipo = 'ENTRADA' ${subFiltroPonto}) as dias_presentes,
                (SELECT COUNT(*) FROM justificativas_ponto WHERE usuario_id = u.id AND status = 'aprovada' ${subFiltroJustificativa}) as justificativas_aprovadas,
                (SELECT MAX(registrado_em) FROM ponto_registros WHERE usuario_id = u.id) as ultima_batida
            FROM usuarios u
            LEFT JOIN equipes e ON u.equipe_id = e.id
            LEFT JOIN grupos g ON u.grupo_id = g.id
            WHERE u.ativo = 1
            ORDER BY u.nome ASC
        `).all();

        return c.json({
            membros: membrosFrequencia.results
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /relatorios/frequencia/membros', erro);
        return c.json({ erro: 'Falha ao gerar relatório de frequência por membro' }, 500);
    }
});


export default rotasRelatorios;
