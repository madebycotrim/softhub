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

import { useState, useEffect } from 'react';
import { api } from '../servicos/api';

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

/**
 * Interface simplificada das configurações de permissões
 */
interface PermissoesAPI {
    permissoes_roles: Record<string, Record<string, boolean>>;
}

/** Cache global síncrono para as configurações, evitando re-renders desnecessários */
let configuracoesCache: PermissoesAPI | null = null;
let buscandoConfiguracoes = false;
let ultimaBusca = 0;

/**
 * Hook utilitário para checar uma permissão específica ativada na Matriz de Controle de Acesso.
 * @example const podeCriarTarefa = usarPermissaoAcesso('tarefas:criar');
 */
export function usarPermissaoAcesso(chavePermissao: string): boolean {
    const { usuario } = usarAutenticacaoContexto();
    const [permissoesAtivas, setPermissoesAtivas] = useState<boolean>(true); // Optimistic true

    useEffect(() => {
        // Se ADMIN, sempre tem acesso (bypass)
        if (usuario?.role === 'ADMIN') {
            setPermissoesAtivas(true);
            return;
        }

        const role = usuario?.role || 'MEMBRO';

        const carregar = async () => {
            const agora = Date.now();
            
            // Cache válido por 1 minuto para evitar spam na API (60000ms)
            if (configuracoesCache && (agora - ultimaBusca < 60000)) {
                setPermissoesAtivas(configuracoesCache.permissoes_roles?.[role]?.[chavePermissao] ?? false);
                return;
            }

            if (buscandoConfiguracoes) return;

            try {
                buscandoConfiguracoes = true;
                const res = await api.get('/api/configuracoes');
                
                // Tratar a chave do sistema
                const configRecord = res.data.find((c: any) => c.chave === 'sistema');
                if (configRecord) {
                    configuracoesCache = configRecord.valor;
                    ultimaBusca = agora;
                    setPermissoesAtivas(configuracoesCache?.permissoes_roles?.[role]?.[chavePermissao] ?? false);
                }
            } catch (e) {
                console.warn('[usarPermissaoAcesso] Falha ao buscar permissões:', e);
            } finally {
                buscandoConfiguracoes = false;
            }
        };

        carregar();
    }, [usuario, chavePermissao]);

    // Fast-path para admins
    if (usuario?.role === 'ADMIN') return true;
    
    return permissoesAtivas;
}