import { Hono } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida } from '../middleware/auth';
const rotasLogs = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar logs paginados (Somente ADMIN, validação feita ou a ser feita no middleware, mock básico aqui)
rotasLogs.get('/', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    // Ideal: Validar se é ADMIN (regra 12).
    if (usuario.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado' }, 403);
    }

    const pagina = Number(c.req.query('pagina') ?? 1);
    const itensPorPagina = Math.min(Number(c.req.query('itensPorPagina') ?? 20), 100);
    const offset = (pagina - 1) * itensPorPagina;

    const filtroModulo = c.req.query('modulo');
    const filtroAcao = c.req.query('acao');
    const busca = c.req.query('busca');
    const dataInicio = c.req.query('dataInicio');
    const dataFim = c.req.query('dataFim');

    let whereClause = 'WHERE 1=1';
    const bParams: any[] = [];

    if (filtroModulo) {
        whereClause += ' AND modulo = ?';
        bParams.push(filtroModulo);
    }
    if (filtroAcao) {
        whereClause += ' AND acao LIKE ?';
        bParams.push(`%${filtroAcao}%`);
    }
    if (busca) {
        whereClause += ' AND (descricao LIKE ? OR usuario_nome LIKE ? OR usuario_email LIKE ?)';
        const searchPattern = `%${busca}%`;
        bParams.push(searchPattern, searchPattern, searchPattern);
    }
    if (dataInicio) {
        whereClause += ' AND criado_em >= ?';
        bParams.push(dataInicio);
    }
    if (dataFim) {
        whereClause += ' AND criado_em <= ?';
        bParams.push(dataFim);
    }

    try {
        const queryCount = `SELECT COUNT(*) as total FROM logs ${whereClause}`;
        const stmtCount = DB.prepare(queryCount);
        const resCount = await (bParams.length > 0 ? stmtCount.bind(...bParams) : stmtCount).all<{ total: number }>();
        const total = resCount.results && resCount.results[0] ? resCount.results[0].total : 0;

        const querySelect = `
            SELECT id, usuario_id, usuario_nome as nome, usuario_email as email, usuario_role as role, 
                   acao, modulo, descricao, ip, entidade_tipo, entidade_id, criado_em
            FROM logs 
            ${whereClause}
            ORDER BY criado_em DESC 
            LIMIT ? OFFSET ?
        `;
        const stmtSelect = DB.prepare(querySelect);
        const bindValues = [...bParams, itensPorPagina, offset];
        const resSet = await stmtSelect.bind(...bindValues).all();

        return c.json({
            dados: resSet.results,
            paginacao: {
                total,
                pagina,
                itensPorPagina,
                totalPaginas: Math.ceil(total / itensPorPagina)
            }
        });

    } catch (erro) {
        console.error('[ERRO DB] GET /logs', erro);
        return c.json({ erro: 'Falha ao buscar logs' }, 500);
    }
});

rotasLogs.get('/estatisticas', autenticacaoRequerida(), async (c) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    if (usuario.role !== 'ADMIN') {
        return c.json({ erro: 'Acesso negado' }, 403);
    }

    try {
        const resModulos = await DB.prepare(`
            SELECT modulo, COUNT(*) as quantidade 
            FROM logs 
            GROUP BY modulo 
            ORDER BY quantidade DESC
        `).all<{ modulo: string, quantidade: number }>();

        return c.json({
            modulos: resModulos.results || [],
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /logs/estatisticas', erro);
        return c.json({ erro: 'Falha ao gerar estatísticas' }, 500);
    }
});

export default rotasLogs;
