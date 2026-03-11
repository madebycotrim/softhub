import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router';
import { MsalProvider } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalInstance } from './msal';
import { ProvedorAutenticacao } from '@/contexto/ContextoAutenticacao';
import { ProvedorTema } from '@/contexto/ContextoTema';
import { RotaProtegida } from './RotaProtegida';
import TelaLogin from '@/funcionalidades/autenticacao/componentes/TelaLogin';
import { LayoutPrincipal } from '@/compartilhado/componentes/LayoutPrincipal';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutos sem refetch desnecessário
        },
    },
});

import { QuadroKanban } from '@/funcionalidades/kanban/componentes/QuadroKanban';
import { BaterPonto } from '@/funcionalidades/ponto/componentes/BaterPonto';
import { DiretorioMembros } from '@/funcionalidades/membros/componentes/DiretorioMembros';
import { PerfilMembro } from '@/funcionalidades/membros/componentes/PerfilMembro';
import { MuralAvisos } from '@/funcionalidades/avisos/componentes/MuralAvisos';
import { PaginaDashboard } from '@/funcionalidades/dashboard/componentes/PaginaDashboard';
import { PainelLogs } from '@/funcionalidades/admin/componentes/PainelLogs';
import { PainelJustificativas } from '@/funcionalidades/admin/componentes/PainelJustificativas';
import GerenciarMembros from '@/funcionalidades/admin/componentes/GerenciarMembros';

import { PaginaConfiguracoes } from '@/funcionalidades/admin/componentes/PaginaConfiguracoes';
import PaginaRelatorios from '@/funcionalidades/admin/componentes/PaginaRelatorios';
import { GerenciarEquipes } from '@/funcionalidades/admin/componentes/GerenciarEquipes';

/**
 * Layout raiz — renderizado em TODAS as rotas.
 * MsalProvider, ProvedorTema e ProvedorAutenticacao ficam aqui.
 */
function LayoutRaiz() {
    return (
        <QueryClientProvider client={queryClient}>
            <ProvedorTema>
                <MsalProvider instance={msalInstance}>
                    <ProvedorAutenticacao>
                        <Outlet />
                    </ProvedorAutenticacao>
                </MsalProvider>
            </ProvedorTema>
        </QueryClientProvider>
    );
}

function PerfilDinamico() {
    const { id } = useParams();
    return <PerfilMembro membroId={id || ''} />;
}

export const rotas = createBrowserRouter([
    {
        // Raiz — MsalProvider + ProvedorAutenticacao + ProcessadorLoginMsal
        element: <LayoutRaiz />,
        children: [
            { path: '/login', element: <TelaLogin /> },
            { path: '/', element: <Navigate to="/app/dashboard" replace /> },
            {
                path: '/app',
                element: <RotaProtegida><LayoutPrincipal><div className="flex w-full h-full items-center justify-center text-muted-foreground">Selecione uma opção no menu lateral</div></LayoutPrincipal></RotaProtegida>,
            },
            { path: '/app/dashboard', element: <RotaProtegida><LayoutPrincipal><PaginaDashboard /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/kanban', element: <RotaProtegida><LayoutPrincipal><QuadroKanban /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/ponto', element: <RotaProtegida><LayoutPrincipal><BaterPonto /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/membros', element: <RotaProtegida><LayoutPrincipal><DiretorioMembros /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/membro/:id', element: <RotaProtegida><LayoutPrincipal><PerfilDinamico /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/avisos', element: <RotaProtegida><LayoutPrincipal><MuralAvisos /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/logs', element: <RotaProtegida><LayoutPrincipal><PainelLogs /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/membros', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><GerenciarMembros /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/justificativas', element: <RotaProtegida roleMinimo="SUBLIDER"><LayoutPrincipal><PainelJustificativas /></LayoutPrincipal></RotaProtegida> },

            { path: '/app/admin/relatorios', element: <RotaProtegida roleMinimo="SUBLIDER"><LayoutPrincipal><PaginaRelatorios /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/equipes', element: <RotaProtegida roleMinimo="LIDER"><LayoutPrincipal><GerenciarEquipes /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/configuracoes', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><PaginaConfiguracoes /></LayoutPrincipal></RotaProtegida> },
            { path: '*', element: <div className="p-6 text-destructive text-center text-xl font-bold">404 - Página não encontrada</div> },
        ],
    },
]);
