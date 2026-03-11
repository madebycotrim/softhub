import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
const rotasLogs = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// Listar logs paginados
rotasLogs.get('/', autenticacaoRequerida(), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;

    const pagina = Number(c.req.query('pagina') ?? 1);
    const itensPorPagina = Math.min(Number(c.req.query('itensPorPagina') ?? 20), 100);
    const offset = (pagina - 1) * itensPorPagina;

    const filtroModulo = c.req.query('modulo');
    const filtroAcao = c.req.query('acao');
    const busca = c.req.query('busca');
    const dataInicio = c.req.query('dataInicio');
    const dataFim = c.req.query('dataFim');
    const apenasMeus = c.req.query('meus') === 'true';

    // ── Validação de Permissão Manual ─────────────────────────────────────────
    let temPermissaoGeral = usuarioLogado.role === 'ADMIN';
    let temPermissaoProprios = usuarioLogado.role === 'ADMIN';
    
    if (!temPermissaoGeral) {
        try {
            const resConfig = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?')
                .bind('permissoes_roles')
                .first();
            if (resConfig) {
                const permissoesRoles = JSON.parse((resConfig as any).valor);
                const role = usuarioLogado.role;
                
                const univGeral = permissoesRoles['TODOS']?.['logs:visualizar'] === true;
                const roleGeral = permissoesRoles[role]?.['logs:visualizar'] === true;
                temPermissaoGeral = univGeral || roleGeral;

                const univProprio = permissoesRoles['TODOS']?.['logs:visualizar_proprios'] === true;
                const roleProprio = permissoesRoles[role]?.['logs:visualizar_proprios'] === true;
                temPermissaoProprios = univProprio || roleProprio;
            }
        } catch (e) {
            console.error('[LOGS] Erro ao validar permissão:', e);
        }
    }

    // Se não tem permissão geral E não tem permissão de ver os próprios -> Bloqueia
    if (!temPermissaoGeral && !temPermissaoProprios) {
        return c.json({ erro: 'Você não tem permissão para visualizar logs.' }, 403);
    }

    let whereClause = 'WHERE 1=1';
    const bParams: any[] = [];

    // Se NÃO tem permissão geral OU se pediu explicitamente apenas os seus
    // (Lembrando que se chegou aqui e não tem geral, ele OBRIGATORIAMENTE tem a de próprios)
    if (!temPermissaoGeral || apenasMeus) {
        whereClause += ' AND usuario_id = ?';
        bParams.push(usuarioLogado.id);
    }

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
        const resCount = await (bParams.length > 0 ? stmtCount.bind(...bParams) : stmtCount).all();
        const resultsCount = resCount.results as any;
        const total = resultsCount && resultsCount[0] ? resultsCount[0].total : 0;

        const querySelect = `
            SELECT id, usuario_id, usuario_nome as nome, usuario_email as email, usuario_role as role, 
                   acao, modulo, descricao, ip, entidade_tipo, entidade_id, 
                   dados_anteriores, dados_novos, criado_em
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

rotasLogs.get('/estatisticas', autenticacaoRequerida(), verificarPermissao('logs:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    
    try {
        const resModulos = await DB.prepare(`
            SELECT modulo, COUNT(*) as quantidade 
            FROM logs 
            GROUP BY modulo 
            ORDER BY quantidade DESC
        `).all();

        return c.json({
            modulos: resModulos.results || [],
        });
    } catch (erro) {
        console.error('[ERRO DB] GET /logs/estatisticas', erro);
        return c.json({ erro: 'Falha ao gerar estatísticas' }, 500);
    }
});

export default rotasLogs;
