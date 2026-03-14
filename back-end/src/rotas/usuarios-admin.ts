import { Hono, Context } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../index';
import { autenticacaoRequerida, verificarPermissao } from '../middleware/auth';
import { registrarLog } from '../servicos/servico-logs';
import { criarNotificacoes } from '../servicos/servico-notificacoes';
import { obterConfiguracao } from '../servicos/servico-configuracoes';

const rotasAdmin = new Hono<{ Bindings: Env; Variables: { usuario: any } }>();

const RoleSchema = z.object({
    role: z.enum(['ADMIN', 'COORDENADOR', 'GESTOR', 'LIDER', 'SUBLIDER', 'MEMBRO']),
});

/**
 * Altera a role (cargo) de um membro.
 */
rotasAdmin.patch('/:id/role', autenticacaoRequerida(), verificarPermissao('membros:alterar_role'), zValidator('json', RoleSchema), async (c: Context) => {
    const { DB, softhub_kv } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');
    const { role } = (c.req as any).valid('json');

    try {
        const atual = await DB.prepare('SELECT role FROM usuarios WHERE id = ?').bind(id).first() as any;
        if (!atual) return c.json({ erro: 'Usuário não encontrado.' }, 404);

        await DB.prepare('UPDATE usuarios SET role = ? WHERE id = ?').bind(role, id).run();

        // Invalida cache de sessão
        if (softhub_kv) await softhub_kv.delete(`sessao:${id}`);

        await criarNotificacoes(DB, {
            usuarioId: id,
            tipo: 'sistema',
            titulo: 'Cargo Atualizado',
            mensagem: `Seu cargo foi atualizado para ${role} pela administração.`,
            link: '/app/membros'
        }, softhub_kv);

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBRO_ROLE_ALTERADA',
            modulo: 'admin',
            descricao: `Role do membro ${id} alterada de ${atual.role} para ${role}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO] PATCH /api/usuarios/:id/role', erro);
        return c.json({ erro: 'Erro ao alterar cargo.' }, 500);
    }
});

/**
 * Remove um membro permanentemente.
 */
rotasAdmin.delete('/:id', autenticacaoRequerida(), verificarPermissao('membros:desativar'), async (c: Context) => {
    const { DB } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const id = c.req.param('id');

    if (usuarioLogado.id === id) return c.json({ erro: 'Não é possível excluir a própria conta.' }, 400);

    try {
        const atual = await DB.prepare('SELECT nome FROM usuarios WHERE id = ?').bind(id).first() as any;
        if (!atual) return c.json({ erro: 'Não encontrado.' }, 404);

        await DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
        
        // Invalida cache de sessão
        const { softhub_kv } = c.env;
        if (softhub_kv) await softhub_kv.delete(`sessao:${id}`);
        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBRO_REMOVIDO_HARD',
            modulo: 'admin',
            descricao: `Membro ${atual.nome} removido permanentemente`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: id
        });

        return c.json({ sucesso: true });
    } catch (erro) {
        console.error('[ERRO] DELETE /api/usuarios/:id', erro);
        return c.json({ erro: 'Erro ao remover membro.' }, 500);
    }
});

const PreCadastroSchema = z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'COORDENADOR', 'GESTOR', 'LIDER', 'SUBLIDER', 'MEMBRO'])
});

/**
 * Pré-cadastro de membro individual.
 */
rotasAdmin.post('/', autenticacaoRequerida(), verificarPermissao('membros:gerenciar'), zValidator('json', PreCadastroSchema), async (c: Context) => {
    const { DB, BOOTSTRAP_ADMIN_EMAIL } = c.env;
    const usuarioLogado = c.get('usuario') as any;
    const { email, role } = (c.req as any).valid('json');
    const emailLimpo = email.toLowerCase().trim();

    try {
        // Validação de domínios via serviço centralizado
        const dominios = await obterConfiguracao(c.env, 'dominios_autorizados') || ['unieuro.com.br', 'unieuro.edu.br'];
        
        if (!dominios.some((d: string) => emailLimpo.endsWith(`@${d}`))) {
            return c.json({ erro: 'Domínio de e-mail não autorizado.' }, 400);
        }

        const isBootstrap = (BOOTSTRAP_ADMIN_EMAIL || '').toLowerCase().split(',').includes(emailLimpo);
        const roleFinal = isBootstrap ? 'ADMIN' : role;

        const existe = await DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(emailLimpo).first();
        if (existe) return c.json({ erro: 'E-mail já cadastrado.' }, 409);

        const novoId = crypto.randomUUID();
        await DB.prepare('INSERT INTO usuarios (id, nome, email, role) VALUES (?, ?, ?, ?)')
            .bind(novoId, emailLimpo.split('@')[0], emailLimpo, roleFinal).run();

        await registrarLog(DB, {
            usuarioId: usuarioLogado.id,
            acao: 'MEMBRO_PRE_CADASTRADO',
            modulo: 'admin',
            descricao: `Pré-cadastro de ${emailLimpo} como ${roleFinal}`,
            ip: c.req.header('CF-Connecting-IP') ?? '',
            entidadeTipo: 'usuarios',
            entidadeId: novoId
        });

        return c.json({ sucesso: true, id: novoId }, 201);
    } catch (erro) {
        console.error('[ERRO] POST /api/usuarios', erro);
        return c.json({ erro: 'Falha no cadastro.' }, 500);
    }
});

export default rotasAdmin;
