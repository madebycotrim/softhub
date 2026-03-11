import { useContext } from 'react';
import { ContextoAutenticacao } from '@/contexto/ContextoAutenticacao';

/**
 * Hook para acessar o contexto global de autenticação.
 * Retorna { usuario, token, estaAutenticado, entrar, sair }
 */
export function usarAutenticacao() {
    const contexto = useContext(ContextoAutenticacao);

    if (!contexto) {
        throw new Error('usarAutenticacao deve ser usado dentro de um ProvedorAutenticacao');
    }

    return contexto;
}
