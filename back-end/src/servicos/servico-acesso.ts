import { D1Database } from '@cloudflare/workers-types';

/**
 * Verifica o Nível de Acesso da Equipe do Usuário no Projeto.
 * Regra: Admin tem GESTAO total. Outros dependem do vínculo da equipe no projeto.
 * Se o projeto for público e não houver vínculo, o acesso é LEITURA.
 */
export async function obterAcessoEquipeNoProjeto(DB: D1Database, projetoId: string, usuario: any): Promise<'GESTAO' | 'EDICAO' | 'LEITURA' | 'NENHUM'> {
    if (usuario.role === 'ADMIN') return 'GESTAO';
    
    const p = await DB.prepare('SELECT publico FROM projetos WHERE id = ?').bind(projetoId).first() as { publico: number } | null;
    if (!p) return 'NENHUM';

    const { results } = await DB.prepare(`
        SELECT pe.acesso 
        FROM projetos_equipes pe
        JOIN usuarios_organizacao uo ON uo.equipe_id = pe.equipe_id
        WHERE pe.projeto_id = ? AND uo.usuario_id = ?
    `).bind(projetoId, usuario.id).all();

    if (!results || results.length === 0) {
        return p.publico === 1 ? 'LEITURA' : 'NENHUM';
    }

    const acessos = results.map((r: any) => r.acesso);
    if (acessos.includes('GESTAO')) return 'GESTAO';
    if (acessos.includes('EDICAO')) return 'EDICAO';
    if (acessos.includes('LEITURA')) return 'LEITURA';
    
    return 'NENHUM';
}
