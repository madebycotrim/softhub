import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { usarAutenticacaoContexto } from '../contexto/ContextoAutenticacao';
import { usarPermissao } from '../compartilhado/hooks/usarPermissao';

interface RotaProtegidaProps {
    children: ReactNode;
    roleMinimo?: string;
}

/**
 * Guarda de rota que garante:
 * 1. Sessão restaurada do localStorage antes de tomar qualquer decisão
 * 2. Usuário autenticado — senão redireciona para /login guardando intenção original
 * 3. Role suficiente — senão redireciona para /app/dashboard
 */
export function RotaProtegida({ children, roleMinimo }: RotaProtegidaProps) {
    const { estaAutenticado, carregando } = usarAutenticacaoContexto();
    const location = useLocation();
    const temPermissao = usarPermissao(roleMinimo ?? null);

    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (!estaAutenticado) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roleMinimo && !temPermissao) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return <>{children}</>;
}