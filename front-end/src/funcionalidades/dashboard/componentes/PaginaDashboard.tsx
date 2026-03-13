import { memo } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, ListChecks, Megaphone, ChevronRight, LayoutDashboard } from 'lucide-react';
import { usarDashboard } from '@/funcionalidades/dashboard/hooks/usarDashboard';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { PROJETO_PADRAO_ID } from '@/utilitarios/constantes';

/**
 * Dashboard principal (Página inicial logada).
 * Focado na operação geral do projeto, sem terminologia de Sprints.
 */
export const PaginaDashboard = memo(() => {
    const projetoId = PROJETO_PADRAO_ID;
    const { metricas, avisos, minhasTarefas, carregando, erro } = usarDashboard(projetoId);

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Centro de Operações"
                subtitulo="Visão geral e status em tempo real do projeto."
                icone={LayoutDashboard}
                variante="destaque"
            >
                {carregando && metricas && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse transition-all">
                        <Carregando Centralizar={false} tamanho="sm" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Atualizando...</span>
                    </div>
                )}
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
                    {avisos.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <Megaphone className="w-4 h-4 text-primary" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Comunicados Prioritários</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {avisos.filter(a => a.prioridade === 'urgente' || a.prioridade === 'importante').slice(0, 2).map(aviso => (
                                    <div key={aviso.id} className="relative group overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-lg transition-all hover:border-primary/30">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${aviso.prioridade === 'urgente' ? 'bg-destructive' : 'bg-primary'}`} />
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-2xl ${aviso.prioridade === 'urgente' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                                        {aviso.prioridade}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{formatarDataHora(aviso.criado_em)}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">{aviso.titulo}</h3>
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{aviso.conteudo}</p>
                                            </div>
                                            <Avatar nome={aviso.criado_por.nome} fotoPerfil={aviso.criado_por.foto || null} tamanho="md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2 bg-primary/5 text-primary rounded-2xl"><ListChecks className="w-4 h-4" /></span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progresso do Projeto</span>
                            </div>
                            <p className="text-2xl font-black text-foreground">{metricas.progressoGeral}%</p>
                            <div className="w-full bg-accent/20 rounded-full h-1 mt-3">
                                <div className="bg-primary h-1 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${metricas.progressoGeral}%` }} />
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-emerald-500/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2 bg-emerald-500/5 text-emerald-500 rounded-2xl"><CheckCircle2 className="w-4 h-4" /></span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entregas</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-black text-foreground">{metricas.tarefasConcluidas}</p>
                                <span className="text-xs text-muted-foreground font-medium">/ {metricas.totalTarefas}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wide">Tarefas finalizadas no total</p>
                        </div>
                    </section>
                </div>

                {/* Coluna da Direita: Minhas Tarefas */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-sidebar border border-sidebar-border/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-sidebar-border/10 bg-sidebar-accent/5 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Minhas Tarefas</h2>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-2xl font-bold">{minhasTarefas.length}</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {minhasTarefas.slice(0, 6).map(tarefa => (
                                <button key={tarefa.id} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-accent/20 transition-all text-left group">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{tarefa.titulo}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                tarefa.prioridade === 'urgente' ? 'bg-destructive' : 
                                                tarefa.prioridade === 'alta' ? 'bg-orange-500' : 
                                                tarefa.prioridade === 'media' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{tarefa.prioridade}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                            {minhasTarefas.length === 0 && (
                                <div className="p-8 text-center">
                                    <p className="text-xs text-muted-foreground font-medium italic">Nenhuma tarefa pendente.</p>
                                </div>
                            )}
                        </div>
                        <Link to="/app/kanban" className="block w-full p-4 text-[10px] text-center font-black uppercase tracking-widest text-muted-foreground hover:text-primary border-t border-border transition-colors">
                            Ver Kanban Completo
                        </Link>
                    </section>
                </div>
                </div>
            )}
        </div>
    );
});
 
export default PaginaDashboard;
