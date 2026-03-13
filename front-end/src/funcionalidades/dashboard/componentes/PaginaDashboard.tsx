import { memo } from 'react';
import { LayoutDashboard } from 'lucide-react';
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

    if (!carregandoProjetos && projetos.length === 0) {
        return <DashboardVazio podeGerenciarProjetos={podeGerenciarProjetos} />;
    }

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Centro de Operações"
                subtitulo="Visão geral e status em tempo real do projeto."
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

            {carregando && !metricas ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <Carregando Centralizar={false} tamanho="lg" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Consolidando Métricas</span>
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
