
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { MsalProvider } from '@azure/msal-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { msalInstance } from './msal';
import { ProvedorAutenticacao } from '../contexto/ContextoAutenticacao';
import { ProvedorTema } from '../contexto/ContextoTema';
import { ProvedorToast } from '../contexto/ContextoToast';
import { RotaProtegida } from './RotaProtegida';
import { LayoutPrincipal } from '../compartilhado/componentes/LayoutPrincipal';
import { ErrorBoundary } from '../compartilhado/componentes/ErrorBoundary';
import { Carregando } from '../compartilhado/componentes/Carregando';
import { PerfilProvider } from '@/funcionalidades/perfil/contexto/PerfilContexto';


// Configuração do React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutos
        },
    },
});

// --- Lazy Loading das Páginas ---
// As páginas agora são carregadas sob demanda, melhorando o tempo de carregamento inicial.
const TelaLogin = lazy(() => import('../funcionalidades/autenticacao/componentes/TelaLogin'));
const PaginaDashboard = lazy(() => import('../funcionalidades/dashboard/componentes/PaginaDashboard'));
const PaginaBacklog = lazy(() => import('../funcionalidades/backlog/componentes/PaginaBacklog'));
const QuadroKanban = lazy(() => import('../funcionalidades/kanban/componentes/QuadroKanban'));
const PaginaVisaoProjeto = lazy(() => import('../funcionalidades/projetos/componentes/PaginaVisaoProjeto'));
const PaginaPortfolio = lazy(() => import('../funcionalidades/portfolio/componentes/PaginaPortfolio'));
const BaterPonto = lazy(() => import('../funcionalidades/ponto/componentes/BaterPonto'));
const MuralAvisos = lazy(() => import('../funcionalidades/avisos/componentes/MuralAvisos'));

// Páginas de Administração
const PainelLogs = lazy(() => import('../funcionalidades/admin/componentes/PainelLogs'));
const GerenciarMembros = lazy(() => import('../funcionalidades/admin/componentes/GerenciarMembros'));
const PainelJustificativas = lazy(() => import('../funcionalidades/admin/componentes/PainelJustificativas'));
const PaginaRelatorios = lazy(() => import('../funcionalidades/admin/componentes/PaginaRelatorios'));
const GerenciarEquipes = lazy(() => import('../funcionalidades/admin/componentes/GerenciarEquipes'));
const GerenciarProjetos = lazy(() => import('../funcionalidades/admin/componentes/GerenciarProjetos'));
const PaginaConfiguracoes = lazy(() => import('../funcionalidades/admin/componentes/PaginaConfiguracoes'));

/**
 * Layout raiz — renderizado em TODAS as rotas.
 * Contém os provedores globais e o Suspense para o lazy loading.
 */
function LayoutRaiz() {
    return (
        <QueryClientProvider client={queryClient}>
            <ProvedorTema>
                <MsalProvider instance={msalInstance}>
                    <ProvedorAutenticacao>
                        <ProvedorToast>
                            <PerfilProvider>
                                <ErrorBoundary modulo="Sistema Geral">
                                    <Suspense fallback={<Carregando Centralizar={true} />}>
                                        <Outlet />
                                    </Suspense>
                                </ErrorBoundary>
                            </PerfilProvider>
                        </ProvedorToast>
                    </ProvedorAutenticacao>
                </MsalProvider>
            </ProvedorTema>
        </QueryClientProvider>
    );
}

// Definição das rotas da aplicação
export const rotas = createBrowserRouter([
    {
        element: <LayoutRaiz />,
        children: [
            { path: '/login', element: <TelaLogin /> },
            { path: '/portfolio', element: <PaginaPortfolio /> },
            { path: '/', element: <Navigate to="/app/dashboard" replace /> },
            {
                path: '/app',
                element: <RotaProtegida><LayoutPrincipal><div className="flex w-full h-full items-center justify-center text-muted-foreground">Selecione uma opção no menu lateral</div></LayoutPrincipal></RotaProtegida>,
            },
            { path: '/app/dashboard', element: <RotaProtegida><LayoutPrincipal><PaginaDashboard /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/backlog', element: <RotaProtegida><LayoutPrincipal><PaginaBacklog /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/projeto', element: <RotaProtegida><LayoutPrincipal><PaginaVisaoProjeto /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/kanban', element: <RotaProtegida><LayoutPrincipal><QuadroKanban /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/ponto', element: <RotaProtegida><LayoutPrincipal><BaterPonto /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/avisos', element: <RotaProtegida><LayoutPrincipal><MuralAvisos /></LayoutPrincipal></RotaProtegida> },
            // Rotas de Admin
            { path: '/app/admin/logs', element: <RotaProtegida><LayoutPrincipal><PainelLogs /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/membros', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><GerenciarMembros /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/justificativas', element: <RotaProtegida roleMinimo="SUBLIDER"><LayoutPrincipal><PainelJustificativas /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/relatorios', element: <RotaProtegida roleMinimo="SUBLIDER"><LayoutPrincipal><PaginaRelatorios /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/equipes', element: <RotaProtegida roleMinimo="LIDER"><LayoutPrincipal><GerenciarEquipes /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/projetos', element: <RotaProtegida roleMinimo="GESTOR"><LayoutPrincipal><GerenciarProjetos /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/configuracoes', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><PaginaConfiguracoes /></LayoutPrincipal></RotaProtegida> },
            // Rota de fallback
            { path: '*', element: <div className="p-6 text-destructive text-center text-xl font-bold">404 - Página não encontrada</div> },
        ],
    },
]);
