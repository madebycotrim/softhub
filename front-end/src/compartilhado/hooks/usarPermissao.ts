import { useMemo } from 'react';
// 🔴 CORRIGIDO: importava de '../../contexto/ContextoAutenticacao' diretamente (path frágil).
// Agora importa do hook centralizado no próprio contexto, garantindo caminho único.
import { usarAutenticacaoContexto } from '../../contexto/ContextoAutenticacao';

/**
 * Hook utilitário APENAS para UX (mostrar/esconder botões e seções).
 *
 * ⚠️  SEGURANÇA REAL É SEMPRE FEITA NO BACKEND — este hook é somente para UI.
 *
 * Hierarquia de roles (REGRA 12):
 * VISITANTE < MEMBRO < LIDER_EQUIPE < LIDER_GRUPO < ADMIN
 *
 * Uso: const podeEditar = usarPermissao('LIDER_EQUIPE');
 */

const HIERARQUIA_ROLES = ['VISITANTE', 'MEMBRO', 'LIDER_EQUIPE', 'LIDER_GRUPO', 'ADMIN'] as const;

export function usarPermissao(roleMinimoRequerido: string | null): boolean {
    const { usuario } = usarAutenticacaoContexto();

    return useMemo(() => {
        // Sem role mínimo requerido — qualquer autenticado tem acesso
        if (!roleMinimoRequerido) return true;

        // Sem usuário ou sem role — nega
        if (!usuario?.role) return false;

        const indiceUsuario  = HIERARQUIA_ROLES.indexOf(usuario.role as typeof HIERARQUIA_ROLES[number]);
        const indiceRequerido = HIERARQUIA_ROLES.indexOf(roleMinimoRequerido as typeof HIERARQUIA_ROLES[number]);

        // Role inválido (não existe na hierarquia) — nega por segurança
        if (indiceUsuario === -1 || indiceRequerido === -1) return false;

        return indiceUsuario >= indiceRequerido;
    }, [usuario, roleMinimoRequerido]);
}