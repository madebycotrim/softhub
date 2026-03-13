import { memo } from 'react';
import { usarDashboard } from '@/funcionalidades/dashboard/hooks/usarDashboard';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { DashboardVazio } from './DashboardVazio';
import { ComunicadosPrioritarios } from './ComunicadosPrioritarios';
import { MetricasProgresso } from './MetricasProgresso';
import { MinhasTarefasLista } from './MinhasTarefasLista';
import { ResumoPessoalDashboard } from './ResumoPessoalDashboard';
import { Skeleton, SkeletonCard, SkeletonRow } from '@/compartilhado/componentes/Skeleton';

/**
 * Dashboard principal (Página inicial logada).
 * Focado na operação geral do projeto, sem terminologia de Sprints.
 */
export const PaginaDashboard = memo(() => {
    const { projetoAtivoId } = usarAutenticacao();
    const { projetos, carregando: carregandoProjetos } = usarProjetos();
    const podeGerenciarProjetos = usarPermissaoAcesso('projetos:visualizar');

    const { metricas, avisos, minhasTarefas, carregando, erro } = usarDashboard(projetoAtivoId);



    return (
        <div className="w-full animate-in fade-in duration-500">
            {carregando && metricas && (
                <div className="fixed top-6 right-6 z-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all backdrop-blur-sm">
                        <Carregando Centralizar={false} tamanho="sm" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Atualizando...</span>
                    </div>
                </div>
            )}

            {/* Seção Exclusiva e Pessoal do Usuário */}
            <ResumoPessoalDashboard />

            <div className="h-px w-full bg-gradient-to-r from-transparent via-border/40 to-transparent my-10" />

            {!carregandoProjetos && projetos.length === 0 ? (
                <DashboardVazio podeGerenciarProjetos={podeGerenciarProjetos} />
            ) : carregando && !metricas ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </div>
                    <div className="lg:col-span-4">
                        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-6">
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
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Operação em Tempo Real</h3>
                    </div>
                    
                    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 transition-opacity duration-500 ${carregando ? 'opacity-70' : 'opacity-100'}`}>
                        {/* Coluna da Esquerda: Avisos e Métricas */}
                        <div className="lg:col-span-8 space-y-8">
                            <ComunicadosPrioritarios avisos={avisos} />
                            <MetricasProgresso metricas={metricas} />
                        </div>

                        {/* Coluna da Direita: Minhas Tarefas */}
                        <div className="lg:col-span-4 space-y-8">
                            <MinhasTarefasLista minhasTarefas={minhasTarefas} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default PaginaDashboard;
