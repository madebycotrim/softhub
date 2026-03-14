import { memo } from 'react';
import { usarDashboard } from '@/funcionalidades/dashboard/hooks/usarDashboard';
import { usarPerfil } from '@/funcionalidades/perfil/hooks/usarPerfil';
import { RadarCompetencias } from '@/funcionalidades/perfil/componentes/RadarCompetencias';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { DashboardVazio } from './DashboardVazio';
import { ComunicadosPrioritarios } from './ComunicadosPrioritarios';
import { MinhasTarefasLista } from './MinhasTarefasLista';
import { ResumoPessoalDashboard } from './ResumoPessoalDashboard';
import { Skeleton, SkeletonCard, SkeletonRow } from '@/compartilhado/componentes/Skeleton';
import { GraficoBurndown } from './GraficoBurndown';
import { CabecalhoDashboard } from './CabecalhoDashboard';

/**
 * Dashboard principal (Página inicial logada).
 * Focado na operação geral do projeto, com saudação personalizada e métricas rápidas.
 */
export const PaginaDashboard = memo(() => {
    const { projetoAtivoId, usuario } = usarAutenticacao();
    const { projetos, carregando: carregandoProjetos } = usarProjetos();
    const podeGerenciarProjetos = usarPermissaoAcesso('projetos:visualizar');
    const { metricas, avisos, minhasTarefas, projetosAtivos, carregando, erro } = usarDashboard(projetoAtivoId);
    const { radar } = usarPerfil();

    return (
        <div className="w-full animate-in fade-in duration-700 max-w-[1600px] mx-auto">

            {/* Título Básico Reemplazando CabocalhoDashboard */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-foreground tracking-tighter">Dashboard</h1>
                <p className="text-muted-foreground text-sm">Resumo operacional do seu ecossistema.</p>
            </div>

            {!carregandoProjetos && projetos.length === 0 ? (
                <DashboardVazio podeGerenciarProjetos={podeGerenciarProjetos} />
            ) : carregando && !metricas ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <Skeleton className="h-[200px] w-full rounded-[48px]" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <div className="bg-card border border-border/60 rounded-[48px] p-8 space-y-6">
                            <Skeleton className="h-4 w-1/2" />
                            <div className="space-y-4">
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </div>
                        </div>
                    </div>
                </div>
            ) : erro ? (
                <div className="py-24 max-w-lg mx-auto">
                    <EstadoErro titulo="Processamento Interrompido" mensagem={erro} />
                </div>
            ) : !metricas ? (
                <EstadoVazio
                    titulo="Operação Silenciosa"
                    descricao="Ainda não temos dados suficientes para gerar as métricas de performance. Comece a movimentar tarefas no Kanban!"
                />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Coluna Central: Operações e Feed (SPAN 8) */}
                    <div className="xl:col-span-8 space-y-8">
                        <div>
                            <GraficoBurndown projetoId={projetoAtivoId} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                             <ComunicadosPrioritarios avisos={avisos} />
                             <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Sua Performance</h3>
                                </div>
                                <ResumoPessoalDashboard />
                             </div>
                        </div>
                    </div>

                    {/* Coluna Lateral: Radar e Backdrop (SPAN 4) */}
                    <div className="xl:col-span-4 space-y-8 xl:sticky xl:top-6">
                        <div className="card-glass card-glass-hover p-5">
                            <RadarCompetencias dados={radar || []} />
                        </div>
                        
                        <MinhasTarefasLista minhasTarefas={minhasTarefas} />
                        
                        <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-[32px] overflow-hidden relative">
                             <div className="relative z-10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Dica de Produtividade</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">Foque nas tarefas de prioridade <span className="text-rose-500 font-bold">Urgente</span> para manter o Burndown saudável.</p>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default PaginaDashboard;
