import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router';
import { useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msal';
import { ProvedorAutenticacao } from '../contexto/ContextoAutenticacao';
import { ProvedorTema } from '../contexto/ContextoTema';
import { RotaProtegida } from './RotaProtegida';
import TelaLogin from '../funcionalidades/autenticacao/TelaLogin';
import { LayoutPrincipal } from '../compartilhado/componentes/LayoutPrincipal';

import { QuadroKanban } from '../funcionalidades/kanban/QuadroKanban';
import { PainelSprints } from '../funcionalidades/backlog/PainelSprints';
import { ListaBacklog } from '../funcionalidades/backlog/ListaBacklog';
import { FormularioCriarTarefa } from '../funcionalidades/backlog/FormularioCriarTarefa';
import { FormularioCriarSprint } from '../funcionalidades/backlog/FormularioCriarSprint';
import { FormularioRetrospectiva } from '../funcionalidades/backlog/FormularioRetrospectiva';
import { usarBacklog, type Sprint } from '../funcionalidades/backlog/usarBacklog';
import { Modal } from '../compartilhado/componentes/Modal';
import { Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CabecalhoFuncionalidade } from '../compartilhado/componentes/CabecalhoFuncionalidade';
import { BaterPonto } from '../funcionalidades/ponto/BaterPonto';
import { DiretorioMembros } from '../funcionalidades/membros/DiretorioMembros';
import { PerfilMembro } from '../funcionalidades/membros/PerfilMembro';
import { MuralAvisos } from '../funcionalidades/avisos/MuralAvisos';
import { PaginaDashboard } from '../funcionalidades/dashboard/PaginaDashboard';
import { PainelLogs } from '../funcionalidades/admin/PainelLogs';
import { PainelJustificativas } from '../funcionalidades/admin/PainelJustificativas';
import { GerenciarMembros } from '../funcionalidades/admin/GerenciarMembros';
import PainelEquipes from '../funcionalidades/admin/PainelEquipes';

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

function VisualizacaoBacklog() {
    const { sprints, backlog, encerrarSprintLocal, criarTarefa, criarSprint, salvarRetrospectiva } = usarBacklog('p1');
    const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
    const [modalSprintAberto, setModalSprintAberto] = useState(false);
    const [modalRetroAberto, setModalRetroAberto] = useState(false);
    const [sprintAlvoRetro, setSprintAlvoRetro] = useState<Sprint | null>(null);

    const handleSalvarTarefa = async (dados: any) => { await criarTarefa(dados); setModalTarefaAberto(false); };
    const handleSalvarSprint = async (dados: any) => { await criarSprint(dados); setModalSprintAberto(false); };
    const handleSalvarRetro = async (sprintId: string, dados: any) => { await salvarRetrospectiva(sprintId, dados); };
    const abrirEdicaoRetro = (sprint: Sprint) => { setSprintAlvoRetro(sprint); setModalRetroAberto(true); };

    return (
        <div className="flex flex-col gap-6 h-full">
            <CabecalhoFuncionalidade
                titulo="Gestão de Backlog"
                subtitulo="Planeje sprints e gerencie o estoque de tarefas do projeto."
                icone={Layers}
            />

            <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 overflow-hidden">
                <div className="flex-1 w-full bg-card border border-border p-6 rounded-2xl flex flex-col gap-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <h3 className="text-lg font-bold text-foreground">Sprints</h3>
                        <Button onClick={() => setModalSprintAberto(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                            <Plus className="w-4 h-4" /> Nova Sprint
                        </Button>
                    </div>
                    <PainelSprints sprints={sprints} aoEncerrar={encerrarSprintLocal} aoEditarRetrospectiva={abrirEdicaoRetro} />
                </div>
                <div className="w-full lg:w-96 shrink-0 bg-card border border-border p-4 rounded-2xl flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Backlog</h2>
                        <Button onClick={() => setModalTarefaAberto(true)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                            <Plus className="w-4 h-4" /> Nova Tarefa
                        </Button>
                    </div>
                    <ListaBacklog tarefas={backlog} />
                </div>
                <Modal aberto={modalTarefaAberto} aoFechar={() => setModalTarefaAberto(false)} titulo="Criar Nova Tarefa">
                    <FormularioCriarTarefa aoSalvar={handleSalvarTarefa} aoCancelar={() => setModalTarefaAberto(false)} />
                </Modal>
                <Modal aberto={modalSprintAberto} aoFechar={() => setModalSprintAberto(false)} titulo="Criar Nova Sprint">
                    <FormularioCriarSprint aoSalvar={handleSalvarSprint} aoCancelar={() => setModalSprintAberto(false)} />
                </Modal>
                <FormularioRetrospectiva aberto={modalRetroAberto} aoFechar={setModalRetroAberto} sprintAlvo={sprintAlvoRetro} aoSalvar={handleSalvarRetro} />
            </div>
        </div>
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
            { path: '/app/backlog', element: <RotaProtegida><LayoutPrincipal><VisualizacaoBacklog /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/ponto', element: <RotaProtegida><LayoutPrincipal><BaterPonto /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/membros', element: <RotaProtegida><LayoutPrincipal><DiretorioMembros /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/membro/:id', element: <RotaProtegida><LayoutPrincipal><PerfilDinamico /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/avisos', element: <RotaProtegida><LayoutPrincipal><MuralAvisos /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/logs', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><PainelLogs /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/membros', element: <RotaProtegida roleMinimo="ADMIN"><LayoutPrincipal><GerenciarMembros /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/justificativas', element: <RotaProtegida roleMinimo="LIDER_EQUIPE"><LayoutPrincipal><PainelJustificativas /></LayoutPrincipal></RotaProtegida> },
            { path: '/app/admin/organizacao', element: <RotaProtegida roleMinimo="LIDER_GRUPO"><LayoutPrincipal><PainelEquipes /></LayoutPrincipal></RotaProtegida> },
            { path: '*', element: <div className="p-6 text-destructive text-center text-xl font-bold">404 - Página não encontrada</div> },
        ],
    },
]);
