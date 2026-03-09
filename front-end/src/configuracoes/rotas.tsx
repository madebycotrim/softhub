import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msal';
import { ProvedorAutenticacao } from '../contexto/ContextoAutenticacao';
import { ProvedorTema } from '../contexto/ContextoTema';
import { RotaProtegida } from './RotaProtegida';
import TelaLogin from '../funcionalidades/autenticacao/TelaLogin';
import { LayoutPrincipal } from '../compartilhado/componentes/LayoutPrincipal';

import { QuadroKanban } from '../funcionalidades/kanban/QuadroKanban';
import { BaterPonto } from '../funcionalidades/ponto/BaterPonto';
import { DiretorioMembros } from '../funcionalidades/membros/DiretorioMembros';
import { PerfilMembro } from '../funcionalidades/membros/PerfilMembro';
import { MuralAvisos } from '../funcionalidades/avisos/MuralAvisos';
import { PaginaDashboard } from '../funcionalidades/dashboard/PaginaDashboard';
import { PainelLogs } from '../funcionalidades/admin/PainelLogs';
import { PainelJustificativas } from '../funcionalidades/admin/PainelJustificativas';
import { GerenciarMembros } from '../funcionalidades/admin/GerenciarMembros';

import { PaginaConfiguracoes } from '../funcionalidades/admin/PaginaConfiguracoes';
import PaginaRelatorios from '../funcionalidades/admin/PaginaRelatorios';
import { GerenciarOrganizacao } from '../funcionalidades/admin/GerenciarOrganizacao';

/**
 * Layout raiz — renderizado em TODAS as rotas.
 * MsalProvider, ProvedorTema e ProvedorAutenticacao ficam aqui.
 */
function LayoutRaiz() {
    return (
        <ProvedorTema>
            <MsalProvider instance={msalInstance}>
                <ProvedorAutenticacao>
                    <Outlet />
                </ProvedorAutenticacao>
            </MsalProvider>
        </ProvedorTema>
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
            { path: '/app/admin/logs', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><PainelLogs /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/membros', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><GerenciarMembros /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/justificativas', element: <RotaProtegida roleMinimo="SUBLIDER"><LayoutPrincipal><PainelJustificativas /></LayoutPrincipal></RotaProtegida> },

            { path: '/app/admin/relatorios', element: <RotaProtegida roleMinimo="SUBLIDER"><LayoutPrincipal><PaginaRelatorios /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/organizacao', element: <RotaProtegida roleMinimo="LIDER"><LayoutPrincipal><GerenciarOrganizacao /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/configuracoes', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><PaginaConfiguracoes /></LayoutPrincipal></RotaProtegida> },
            { path: '*', element: <div className="p-6 text-destructive text-center text-xl font-bold">404 - Página não encontrada</div> },
        ],
    },
]);
