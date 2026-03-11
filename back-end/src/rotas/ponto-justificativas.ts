import { Hono, Context } from 'hono';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const rotasPontoJustificativas = new Hono<{ Bindings: Env, Variables: { usuario: any } }>();

// ==========================================
// WORKFLOW 24: Justificativas de Ponto
// ==========================================

// 1. Membro enviando justificativa
const JustificativaSchema = z.object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tipo: z.enum(['esquecimento', 'falta', 'atestado', 'outro']),
    motivo: z.string().min(5)
});

rotasPontoJustificativas.post('/justificativas', autenticacaoRequerida(), verificarPermissao('ponto:justificar'), zValidator('json', JustificativaSchema), async (c: Context) => {
    const { DB } = c.env;
    const { data, tipo, motivo } = (c.req as any).valid('json');
    const usuario = c.get('usuario') as any;

    // Blindagem: Data no Futuro
    const dataBrasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
    const [diaB, mesB, anoB] = dataBrasilia.split('/');
    const hojeBrasiliaIso = `${anoB}-${mesB}-${diaB}`;

    if (data > hojeBrasiliaIso) {
        return c.json({ erro: 'Não é permitido enviar justificativas para o futuro.' }, 400);
    }

    try {
        // Regra de Duplicata
        const ext = await DB.prepare(`SELECT id FROM justificativas_ponto WHERE usuario_id = ? AND data = ?`)
            .bind(usuario.id, data).first();

        if (ext) {
            return c.json({ erro: 'Já existe uma justificativa pendente para esta data.' }, 400);
        }

        const justId = crypto.randomUUID();
        await DB.prepare(`
            INSERT INTO justificativas_ponto (id, usuario_id, data, tipo, motivo)
            VALUES (?, ?, ?, ?, ?)
        `).bind(justId, usuario.id, data, tipo, motivo).run();

        // Notificar quem possui permissão de aprovação (Dinâmico)
        const resPerms = await DB.prepare("SELECT valor FROM configuracoes_sistema WHERE chave = 'permissoes_roles'").first();
        const permissoesRoles = JSON.parse((resPerms as any)?.valor || '{}');
        const rolesComAcesso = Object.keys(permissoesRoles).filter(r => permissoesRoles[r]?.['ponto:aprovar_justificativa'] === true);
        
        // ADMIN sempre incluído
        if (!rolesComAcesso.includes('ADMIN')) rolesComAcesso.push('ADMIN');

        const lideresRes = await DB.prepare(`
            SELECT id FROM usuarios WHERE role IN (${rolesComAcesso.map(() => '?').join(',')}) AND ativo = 1
        `).bind(...rolesComAcesso).all();
        
        const resultadosLideres = lideresRes.results as any[];
        
        if (resultadosLideres.length > 0) {
            await criarNotificacoes(DB, {
                usuariosIds: resultadosLideres.map((l: any) => l.id),
                tipo: 'sistema',
                titulo: 'Nova justificativa de ponto',
                mensagem: `${usuario.nome} enviou uma justificativa para ${data}.`,
                link: '/app/admin/justificativas'
            });
        }

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_ENVIADA',
            modulo: 'ponto',
            descricao: `Justificativa enviada para o dia ${data}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: justId
        });

        return c.json({ id: justId }, 201);
    } catch (e) {
        console.error('ERRO POST /justificativas', e);
        return c.json({ erro: 'Falha ao enviar justificativa' }, 500);
    }
});

// 1.1. Membro editando justificativa pendente
rotasPontoJustificativas.patch('/justificativas/:id', autenticacaoRequerida(), verificarPermissao('ponto:justificar'), zValidator('json', JustificativaSchema), async (c: Context) => {
    const { DB } = c.env;
    const { data, tipo, motivo } = (c.req as any).valid('json');
    const usuario = c.get('usuario') as any;
    const id = c.req.param('id');

    const atualRes = await DB.prepare(`SELECT * FROM justificativas_ponto WHERE id = ? AND usuario_id = ?`).bind(id, usuario.id).first();
    if (!atualRes) return c.json({ erro: 'Justificativa não encontrada.' }, 404);
    
    const atual = atualRes as any;
    if (atual.status !== 'pendente') return c.json({ erro: 'Apenas justificativas pendentes podem ser editadas.' }, 400);

    // Blindagem: Data no Futuro
    const dataBrasilia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
    const [diaB, mesB, anoB] = dataBrasilia.split('/');
    const hojeBrasiliaIso = `${anoB}-${mesB}-${diaB}`;

    if (data > hojeBrasiliaIso) {
        return c.json({ erro: 'Não é permitido enviar justificativas para o futuro.' }, 400);
    }

    // Validação de duplicata se a data mudou
    if (data !== atual.data) {
        const ext = await DB.prepare(`SELECT id FROM justificativas_ponto WHERE usuario_id = ? AND data = ?`).bind(usuario.id, data).first();
        if (ext) return c.json({ erro: 'Já existe uma justificativa pendente para esta data.' }, 400);
    }

    try {
        await DB.prepare(`
            UPDATE justificativas_ponto
            SET data = ?, tipo = ?, motivo = ?
            WHERE id = ?
        `).bind(data, tipo, motivo, id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_EDITADA',
            modulo: 'ponto',
            descricao: `Editou a justificativa original da data ${atual.data}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: id
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao editar justificativa' }, 500);
    }
});

// 1.2. Membro apagando justificativa pendente (soft delete)
rotasPontoJustificativas.delete('/justificativas/:id', autenticacaoRequerida(), verificarPermissao('ponto:justificar'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;
    const id = c.req.param('id');

    const atualRes = await DB.prepare(`SELECT * FROM justificativas_ponto WHERE id = ? AND usuario_id = ?`).bind(id, usuario.id).first();
    if (!atualRes) return c.json({ erro: 'Justificativa não encontrada.' }, 404);
    
    const atual = atualRes as any;
    if (atual.status !== 'pendente') return c.json({ erro: 'Apenas justificativas pendentes podem ser apagadas.' }, 400);

    try {
        await DB.prepare(`DELETE FROM justificativas_ponto WHERE id = ?`).bind(id).run();

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_EXCLUIDA',
            modulo: 'ponto',
            descricao: `Excluiu a justificativa do dia ${atual.data}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: id
        });
        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha ao excluir justificativa' }, 500);
    }
});


// 2. Membro buscando suas próprias justificativas
rotasPontoJustificativas.get('/justificativas', autenticacaoRequerida(), verificarPermissao('ponto:visualizar'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    const pagina = Number(c.req.query('pagina') ?? 1);
    const limite = 20;
    const offset = (pagina - 1) * limite;

    try {
        const resContagem = await DB.prepare(`SELECT COUNT(*) as total FROM justificativas_ponto WHERE usuario_id = ?`)
            .bind(usuario.id).first();
        const total = (resContagem as any)?.total || 0;

        const { results } = await DB.prepare(`
            SELECT * FROM justificativas_ponto 
            WHERE usuario_id = ?
            ORDER BY criado_em DESC LIMIT ? OFFSET ?
        `).bind(usuario.id, limite, offset).all();

        return c.json({
            dados: results,
            paginacao: { total, pagina, totalPaginas: Math.ceil(total / limite) }
        });
    } catch (e) {
        return c.json({ erro: 'Falha ao buscar justificativas' }, 500);
    }
});

// 3. Admin listando todas as justificativas pendentes ou filtradas
rotasPontoJustificativas.get('/admin/justificativas', autenticacaoRequerida(), verificarPermissao('ponto:aprovar_justificativa'), async (c: Context) => {
    const { DB } = c.env;
    const { results } = await DB.prepare(`
        SELECT j.*, u.nome as usuario_nome, u.email as usuario_email, u.foto_perfil as usuario_foto 
        FROM justificativas_ponto j
        JOIN usuarios u ON j.usuario_id = u.id
        ORDER BY j.status DESC, j.criado_em DESC
        LIMIT 100
    `).all();

    return c.json(results);
});

// 4. Admin Aprovando Justificativa
rotasPontoJustificativas.patch('/admin/justificativas/:id/aprovar', autenticacaoRequerida(), verificarPermissao('ponto:aprovar_justificativa'), async (c: Context) => {
    const { DB } = c.env;
    const justificativaId = c.req.param('id');
    const usuario = c.get('usuario') as any;

    const resAlvar = await DB.prepare(`SELECT * FROM justificativas_ponto WHERE id = ?`).bind(justificativaId).first();
    const alvar = resAlvar as any;
    if (!alvar) return c.json({ erro: 'Justificativa não encontrada.' }, 404);
    if (alvar.status !== 'pendente') return c.json({ erro: 'Justificativa já foi processada.' }, 400);

    try {
        await DB.prepare(`
            UPDATE justificativas_ponto 
            SET status = 'aprovada', avaliado_por = ?, avaliado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') 
            WHERE id = ?
        `).bind(usuario.id, justificativaId).run();

        await criarNotificacoes(DB, {
            usuarioId: alvar.usuario_id,
            tipo: 'sistema',
            titulo: 'Justificativa aprovada',
            mensagem: `Sua justificativa para ${alvar.data} foi aprovada.`,
            link: '/app/ponto'
        });

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_APROVADA',
            modulo: 'ponto',
            descricao: `Aprovada justificativa ID: ${justificativaId} do usuário ${alvar.usuario_id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: justificativaId,
            dadosAnteriores: { status: alvar.status, avaliado_por: alvar.avaliado_por, avaliado_em: alvar.avaliado_em },
            dadosNovos: { status: 'aprovada', avaliado_por: usuario.id, avaliado_em: new Date().toISOString() }
        });

        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha interna' }, 500);
    }
});

// 5. Admin Rejeitando Justificativa
const RejeicaoSchema = z.object({
    motivoRejeicao: z.string().min(3)
});

rotasPontoJustificativas.patch('/admin/justificativas/:id/rejeitar', autenticacaoRequerida(), verificarPermissao('ponto:aprovar_justificativa'), zValidator('json', RejeicaoSchema), async (c: Context) => {
    const { DB } = c.env;
    const justificativaId = c.req.param('id');
    const { motivoRejeicao } = (c.req as any).valid('json');
    const usuario = c.get('usuario') as any;

    const resAlvar = await DB.prepare(`SELECT * FROM justificativas_ponto WHERE id = ?`).bind(justificativaId).first();
    const alvar = resAlvar as any;
    if (!alvar) return c.json({ erro: 'Justificativa não encontrada.' }, 404);
    if (alvar.status !== 'pendente') return c.json({ erro: 'Justificativa já foi processada.' }, 400);

    try {
        await DB.prepare(`
            UPDATE justificativas_ponto 
            SET status = 'rejeitada', motivo_rejeicao = ?, avaliado_por = ?, avaliado_em = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') 
            WHERE id = ?
        `).bind(motivoRejeicao, usuario.id, justificativaId).run();

        await criarNotificacoes(DB, {
            usuarioId: alvar.usuario_id,
            tipo: 'sistema',
            titulo: 'Justificativa rejeitada',
            mensagem: `Sua justificativa para ${alvar.data} foi rejeitada. Motivo: ${motivoRejeicao}`,
            link: '/app/ponto'
        });

        await registrarLog(DB, {
            usuarioId: usuario.id,
            acao: 'PONTO_JUSTIFICATIVA_REJEITADA',
            modulo: 'ponto',
            descricao: `Rejeitada justificativa ID: ${justificativaId} do usuário ${alvar.usuario_id}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'justificativas_ponto',
            entidadeId: justificativaId,
            dadosAnteriores: { status: alvar.status, motivo_rejeicao: alvar.motivo_rejeicao, avaliado_por: alvar.avaliado_por },
            dadosNovos: { status: 'rejeitada', motivo_rejeicao: motivoRejeicao, avaliado_por: usuario.id }
        });

        return c.json({ sucesso: true });
    } catch (e) {
        return c.json({ erro: 'Falha interna' }, 500);
    }
});

// 6. Exportação de Relatório CSV (Workflow 30)
rotasPontoJustificativas.get('/exportar', autenticacaoRequerida(), verificarPermissao('ponto:exportar_csv'), async (c: Context) => {
    const { DB } = c.env;
    const usuario = c.get('usuario') as any;

    const { dataInicio, dataFim, usuarioId, equipeId } = c.req.query();

    if (!dataInicio || !dataFim) {
        return c.json({ erro: 'Data de início e fim são obrigatórias.' }, 400);
    }

    // Validação de período (máx 31 dias)
    const dIni = new Date(dataInicio);
    const dFim = new Date(dataFim);
    const diffDias = Math.ceil(Math.abs(dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias > 31) {
        return c.json({ erro: 'O período máximo para exportação é de 31 dias.' }, 400);
    }

    try {
        // Query base para registros
        let queryRegistros = `
            SELECT u.nome, u.email, p.registrado_em, p.tipo, p.usuario_id
            FROM ponto_registros p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE date(p.registrado_em) BETWEEN date(?) AND date(?)
        `;
        const params: any[] = [dataInicio, dataFim];

        if (usuarioId) {
            queryRegistros += ` AND p.usuario_id = ?`;
            params.push(usuarioId);
        } else if (equipeId) {
            queryRegistros += ` AND p.usuario_id IN (SELECT usuario_id FROM usuarios_organizacao WHERE equipe_id = ?)`;
            params.push(equipeId);
        }

        queryRegistros += ` ORDER BY u.nome ASC, p.registrado_em ASC`;

        const { results: registros } = await DB.prepare(queryRegistros).bind(...params).all();

        // Busca justificativas aprovadas
        let queryJust = `
            SELECT u.nome, u.email, j.data, j.motivo
            FROM justificativas_ponto j
            JOIN usuarios u ON j.usuario_id = u.id
            WHERE j.status = 'aprovada' AND date(j.data) BETWEEN date(?) AND date(?)
        `;
        const paramsJust: any[] = [dataInicio, dataFim];

        if (usuarioId) {
            queryJust += ` AND j.usuario_id = ?`;
            paramsJust.push(usuarioId);
        } else if (equipeId) {
            queryJust += ` AND j.usuario_id IN (SELECT usuario_id FROM usuarios_organizacao WHERE equipe_id = ?)`;
            paramsJust.push(equipeId);
        }

        const { results: justificativas } = await DB.prepare(queryJust).bind(...paramsJust).all();

        // Processamento dos dados para CSV
        const linhas: string[] = ['Nome,Email,Data,Entrada,Saída,Horas Trabalhadas,Observação'];

        // Agrupar por usuário e data
        const mapa: Record<string, any> = {};

        registros.forEach((r: any) => {
            const dia = r.registrado_em.split('T')[0];
            const chave = `${r.usuario_id}_${dia}`;
            if (!mapa[chave]) {
                mapa[chave] = { nome: r.nome, email: r.email, data: dia, entrada: null, saida: null, obs: '' };
            }
            if (r.tipo === 'entrada' && !mapa[chave].entrada) mapa[chave].entrada = r.registrado_em;
            if (r.tipo === 'saída' || r.tipo === 'saida') mapa[chave].saida = r.registrado_em;
        });

        justificativas.forEach((j: any) => {
            const chave = `${j.usuario_id || ''}_${j.data}`; // Ajuste caso falte o ID na query de j
            // Como a query de j não tem usuario_id, vamos usar email para o mapa se necessário
            // Mas melhor ajustar a query de justificativas para ter o usuario_id
        });

        // Re-buscando justificativas com ID
        const { results: justComId } = await DB.prepare(`
            SELECT usuario_id, data, motivo FROM justificativas_ponto 
            WHERE status = 'aprovada' AND date(data) BETWEEN date(?) AND date(?)
        `).bind(dataInicio, dataFim).all();

        justComId.forEach((j: any) => {
            const chave = `${j.usuario_id}_${j.data}`;
            if (mapa[chave]) {
                mapa[chave].obs = `Justificativa: ${j.motivo}`;
            }
        });

        // Montar linhas do CSV
        Object.values(mapa).forEach((v: any) => {
            let horas = '0h 0min';
            if (v.entrada && v.saida) {
                const diff = new Date(v.saida).getTime() - new Date(v.entrada).getTime();
                const totalMin = Math.floor(diff / (1000 * 60));
                const h = Math.floor(totalMin / 60);
                const m = Math.floor(totalMin % 60);
                horas = `${h}h ${m}min`;
            }

            // Exibir no fuso da Fábrica (Brasília)
            const opcoes: Intl.DateTimeFormatOptions = { 
                hour: '2-digit', 
                minute: '2-digit', 
                timeZone: 'America/Sao_Paulo' 
            };

            const entradaFmt = v.entrada ? new Date(v.entrada).toLocaleTimeString('pt-BR', opcoes) : '';
            const saidaFmt = v.saida ? new Date(v.saida).toLocaleTimeString('pt-BR', opcoes) : '';
            const dataFmt = v.data.split('-').reverse().join('/');

            linhas.push(`"${v.nome}","${v.email}","${dataFmt}","${entradaFmt}","${saidaFmt}","${horas}","${v.obs}"`);
        });

        const csvContent = linhas.join('\n');

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="ponto_${dataInicio}_${dataFim}.csv"`
            }
        });

    } catch (e) {
        console.error('ERRO EXPORTAR CSV', e);
        return c.json({ erro: 'Falha ao gerar relatório CSV' }, 500);
    }
});

export default rotasPontoJustificativas;
