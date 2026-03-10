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

const HIERARQUIA_ROLES = ['MEMBRO', 'SUBLIDER', 'LIDER', 'GESTOR', 'COORDENADOR', 'ADMIN'] as const;

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
let fetchPromise: Promise<PermissoesAPI> | null = null;
let ultimaBusca = 0;

/**
 * Hook utilitário para checar uma permissão específica ativada na Matriz de Controle de Acesso.
 * @example const podeCriarTarefa = usarPermissaoAcesso('tarefas:criar');
 */
export function usarPermissaoAcesso(chavePermissao: string): boolean {
    const { usuario } = usarAutenticacaoContexto();
    const role = (usuario?.role || 'MEMBRO').toUpperCase();
    
    // Estado pessimista: inicia oculto (exceto para ADMIN)
    const [permissoesAtivas, setPermissoesAtivas] = useState<boolean>(() => {
        if (usuario?.role === 'ADMIN') return true;
        
        // Se já tiver cache, usa imediatamente para evitar flicker
        if (configuracoesCache) {
            const universal = configuracoesCache.permissoes_roles?.['TODOS']?.[chavePermissao] === true;
            return universal || (configuracoesCache.permissoes_roles?.[role]?.[chavePermissao] === true);
        }
        return false;
    });

    useEffect(() => {
        if (usuario?.role === 'ADMIN') return;

        const atualizarEstado = () => {
            if (configuracoesCache) {
                const universal = configuracoesCache.permissoes_roles?.['TODOS']?.[chavePermissao] === true;
                const temRole = configuracoesCache.permissoes_roles?.[role]?.[chavePermissao] === true;
                setPermissoesAtivas(universal || temRole);
            }
        };

        const carregar = async () => {
            const agora = Date.now();
            
            // 1. Cache válido (1 min)
            if (configuracoesCache && (agora - ultimaBusca < 60000)) {
                atualizarEstado();
                return;
            }

            // 2. Já existe uma busca em andamento? Espera ela.
            if (fetchPromise) {
                await fetchPromise;
                atualizarEstado();
                return;
            }

            // 3. Inicia a busca (Singleton Promise)
            try {
                fetchPromise = api.get('/api/configuracoes/publico/permissoes').then(res => res.data);
                const data = await fetchPromise;
                
                configuracoesCache = data;
                ultimaBusca = Date.now();
                
                // Notifica outros hooks que o cache chegou
                window.dispatchEvent(new CustomEvent('permissoes_carregadas'));
                atualizarEstado();
            } catch (e) {
                console.warn('[usarPermissaoAcesso] Erro:', e);
                setPermissoesAtivas(false);
            } finally {
                fetchPromise = null;
            }
        };

        carregar();

        // Escuta atualizações do cache (para quando outro hook terminar a busca)
        window.addEventListener('permissoes_carregadas', atualizarEstado);
        return () => window.removeEventListener('permissoes_carregadas', atualizarEstado);
    }, [usuario, role, chavePermissao]);

    return usuario?.role === 'ADMIN' ? true : permissoesAtivas;
}