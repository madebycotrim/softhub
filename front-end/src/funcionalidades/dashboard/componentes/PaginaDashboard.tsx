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
import { pluralizar } from '@/utilitarios/formatadores';

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

            {/* 1. Cabeçalho de Missão: Saudação, Perfil, Equipe e Métricas de Projeto */}
            <CabecalhoDashboard 
                nomeUsuario={usuario?.nome || ''} 
                projetosAtivos={projetosAtivos} 
                metricas={metricas}
            />

            {!carregandoProjetos && projetos.length === 0 ? (
                <DashboardVazio podeGerenciarProjetos={podeGerenciarProjetos} />
            ) : carregando && !metricas ? (
                <div className="space-y-12">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Skeleton className="h-32 rounded-[32px]" />
                        <Skeleton className="h-32 rounded-[32px]" />
                        <Skeleton className="h-32 rounded-[32px]" />
                        <Skeleton className="h-32 rounded-[32px]" />
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                            <Skeleton className="h-[300px] w-full rounded-[48px]" />
                        </div>
                        <div className="lg:col-span-4 space-y-8">
                            <Skeleton className="h-[400px] w-full rounded-[48px]" />
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
                <>
                    {/* 2. Sua Performance: Métricas Individuais (Largura Total) */}
                    <div className="mb-12 space-y-4">
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Meu Desempenho</h3>
                        </div>
                        <ResumoPessoalDashboard />
                    </div>

                    {/* 3. Painel Operacional: Tarefas, Tendências e Feedback */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                        {/* Coluna Central: Burndown e Avisos (SPAN 8) */}
                        <div className="xl:col-span-8 space-y-12">
                            {/* Tendência de Entrega (Burndown) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Rumo à Entrega (Burndown)</h3>
                                </div>
                                <GraficoBurndown projetoId={projetoAtivoId} />
                            </div>
                            
                            {/* Mural de Avisos */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Fique por dentro</h3>
                                </div>
                                <ComunicadosPrioritarios avisos={avisos} />
                            </div>
                        </div>

                        {/* Coluna Lateral: Ações e Radar (SPAN 4) */}
                        <div className="xl:col-span-4 space-y-8 xl:sticky xl:top-6">
                            {/* Minhas Tarefas (Ação Imediata) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Minhas Tarefas</h3>
                                    </div>
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/10">
                                        {minhasTarefas.length} {pluralizar(minhasTarefas.length, 'TAREFA', 'TAREFAS')}
                                    </span>
                                </div>
                                <MinhasTarefasLista minhasTarefas={minhasTarefas} />
                            </div>

                            {/* Radar de Competências (Visualização de Longo Prazo) */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Minhas Habilidades</h3>
                                </div>
                                <div className="card-glass card-glass-hover p-5">
                                    <RadarCompetencias dados={radar || []} />
                                </div>
                            </div>
                            
                            {/* Cartão de Ajuda */}
                            <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-[32px] overflow-hidden relative">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Dica de Produtividade</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Foque nas tarefas de prioridade <span className="text-rose-500 font-bold">Urgente</span> para manter o Burndown saudável.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});

export default PaginaDashboard;
