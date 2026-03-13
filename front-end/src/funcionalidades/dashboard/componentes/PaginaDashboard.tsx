import { memo } from 'react';
import { LayoutDashboard, Folders } from 'lucide-react';
import { usarDashboard } from '@/funcionalidades/dashboard/hooks/usarDashboard';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
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

    if (carregandoProjetos) {
        return (
            <div className="flex-1 py-40 flex items-center justify-center">
                <Carregando Centralizar={false} tamanho="lg" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Painel de Controle"
                subtitulo="Suas métricas pessoais e status operacional da Fábrica."
                icone={LayoutDashboard}
                variante="destaque"
            >
                <div className="flex items-center gap-4">
                    {carregando && metricas && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all">
                            <Carregando Centralizar={false} tamanho="sm" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Atualizando...</span>
                        </div>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            {/* Seção Exclusiva e Pessoal do Usuário */}
            <ResumoPessoalDashboard />

            {!carregandoProjetos && projetos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 rounded-[32px] bg-muted/30 border border-border flex items-center justify-center mb-8 shadow-2xl shadow-primary/5">
                        <Folders size={40} className="text-muted-foreground/20" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-3">Nenhum Projeto Ativo</h2>
                    <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
                        A Fábrica está pronta, mas ainda não há projetos cadastrados no seu radar.
                    </p>
                    {podeGerenciarProjetos && (
                        <a href="/app/admin/projetos" className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center">
                            Gerenciar Projetos
                        </a>
                    )}
                </div>
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
            )}
        </div>
    );
});

export default PaginaDashboard;
