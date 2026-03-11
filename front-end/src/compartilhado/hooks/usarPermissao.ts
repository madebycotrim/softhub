import { useMemo } from 'react';
import { usarAutenticacaoContexto } from '@/contexto/ContextoAutenticacao';
import { usarConfiguracoes } from '@/contexto/ContextoConfiguracoes';

/**
 * Hook utilitário APENAS para UX (mostrar/esconder botões e seções).
 *
 * ⚠️  SEGURANÇA REAL É SEMPRE FEITA NO BACKEND — este hook é somente para UI.
 *
 * Compara a role do usuário com uma role mínima requerida, baseado na hierarquia
 * de roles definida no banco de dados (configuracoes_sistema).
 *
 * Uso: const podeEditar = usarPermissao('LIDER');
 */
export function usarPermissao(roleMinimoRequerido: string | null): boolean {
    const { usuario } = usarAutenticacaoContexto();
    const { hierarquia_roles } = usarConfiguracoes(); // <-- Get hierarchy from context

    return useMemo(() => {
        // Sem role mínimo requerido — qualquer autenticado tem acesso
        if (!roleMinimoRequerido) return true;

        // Sem usuário ou sem role — nega
        if (!usuario?.role) return false;

        const indiceUsuario = hierarquia_roles.indexOf(usuario.role);
        const indiceRequerido = hierarquia_roles.indexOf(roleMinimoRequerido);

        // Role inválido (não existe na hierarquia) — nega por segurança
        if (indiceUsuario === -1 || indiceRequerido === -1) return false;

        return indiceUsuario >= indiceRequerido;
    }, [usuario, roleMinimoRequerido, hierarquia_roles]);
}


/**
 * Hook utilitário para checar uma permissão específica ativada na Matriz de Controle de Acesso.
 * As permissões são carregadas do contexto `ContextoConfiguracoes`.
 * @example const podeCriarTarefa = usarPermissaoAcesso('tarefas:criar');
 */
export function usarPermissaoAcesso(chavePermissao: string): boolean {
    const { usuario } = usarAutenticacaoContexto();
    const { permissoes_roles } = usarConfiguracoes(); // <-- Get permissions from context
    const role = usuario?.role || 'MEMBRO';

    // ADMIN sempre tem acesso total, independente da matriz.
    if (role === 'ADMIN') {
        return true;
    }

    // useMemo para evitar recálculos a cada renderização
    return useMemo(() => {
        if (!permissoes_roles) {
            return false; // Retorna false se as permissões ainda não foram carregadas
        }

        // Verifica se a permissão está habilitada para a role específica do usuário
        const temPermissaoRole = permissoes_roles[role]?.[chavePermissao] === true;

        // Verifica se a permissão é universal (habilitada para 'TODOS')
        const temPermissaoUniversal = permissoes_roles['TODOS']?.[chavePermissao] === true;

        return temPermissaoRole || temPermissaoUniversal;

    }, [role, chavePermissao, permissoes_roles]);
}
