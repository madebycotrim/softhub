import { CheckCircle2, Clock, ListChecks, AlertCircle, Megaphone, ChevronRight } from 'lucide-react';
import { usarDashboard } from './usarDashboard';
import { GraficoBurndown } from './GraficoBurndown';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { LayoutDashboard } from 'lucide-react';

/**
 * Dashboard principal (Página inicial logada).
 */
export function PaginaDashboard() {
    // Simulando que selecionamos o prejeto atual do contexto (fora do escopo dessa etapa)
    const projetoId = 'p1';
    const { metricas, burndown, avisos, minhasTarefas, carregando, erro } = usarDashboard(projetoId);

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-red-400 text-center py-8">{erro}</p>;
    if (!metricas) return <EstadoVazio titulo="Nenhuma sprint ativa" descricao="Inicie uma sprint para visualizar as métricas do dashboard." />;

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header do Hub com Saudação e busca já no header global */}
            <CabecalhoFuncionalidade
                titulo="Centro de Operações"
                subtitulo="Status em tempo real da Sprint Atual."
                icone={LayoutDashboard}
                variante="destaque"
            />

            {/* Grid Principal do Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Coluna da Esquerda (8 colunas): Operação e Dados */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Widget: Mural de Avisos Críticos (Top Prioridade) */}
                    {avisos.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <Megaphone className="w-4 h-4 text-primary" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Comunicados Prioritários</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {avisos.filter(a => a.prioridade === 'urgente' || a.prioridade === 'importante').slice(0, 2).map(aviso => (
                                    <div key={aviso.id} className="relative group overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-lg transition-all hover:border-primary/30">
                                        <div className={`absolute top-0 left-0 w-1 h-full \${aviso.prioridade === 'urgente' ? 'bg-destructive' : 'bg-primary'}`} />
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md \${aviso.prioridade === 'urgente' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
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

                    {/* Grid de Métricas Compactas */}
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Progresso */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2 bg-primary/5 text-primary rounded-2xl"><ListChecks className="w-4 h-4" /></span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progresso</span>
                            </div>
                            <p className="text-2xl font-black text-foreground">{metricas.progressoSprint}%</p>
                            <div className="w-full bg-accent/20 rounded-full h-1 mt-3">
                                <div className="bg-primary h-1 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${metricas.progressoSprint}%` }} />
                            </div>
                        </div>

                        {/* Entregas */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-emerald-500/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2 bg-emerald-500/5 text-emerald-500 rounded-2xl"><CheckCircle2 className="w-4 h-4" /></span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entregas</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-black text-foreground">{metricas.tarefasConcluidas}</p>
                                <span className="text-xs text-muted-foreground font-medium">/ {metricas.totalTarefas}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wide">Tarefas finalizadas</p>
                        </div>

                        {/* Tempo */}
                        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-amber-500/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-2 bg-amber-500/5 text-amber-500 rounded-2xl"><Clock className="w-4 h-4" /></span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cronômetro</span>
                            </div>
                            <p className="text-2xl font-black text-foreground">{metricas.diasRestantesSprint}d</p>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wide">Restantes na sprint</p>
                        </div>
                    </section>

                    {/* Gráfico de Burndown (Foco Central) */}
                    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">Queima de Pontos</h2>
                                <p className="text-xs text-muted-foreground font-medium">Ritmo de produtividade da equipe.</p>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Planejado</div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Realizado</div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full pt-4">
                            {burndown.length > 0 ? (
                                <GraficoBurndown dados={burndown} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-accent/5">
                                    <AlertCircle className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-xs text-muted-foreground uppercase font-black tracking-widest font-mono">Debug: Sem dados de burndown</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Coluna da Direita (4 colunas): Pessoal e Social */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Widget: Minhas Próximas Tarefas */}
                    <section className="bg-sidebar border border-sidebar-border/10 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-sidebar-border/10 bg-sidebar-accent/5 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Minhas Tarefas</h2>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{minhasTarefas.length}</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {minhasTarefas.slice(0, 4).map(tarefa => (
                                <button key={tarefa.id} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-accent/20 transition-all text-left group">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{tarefa.titulo}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full \${
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
                        <button className="w-full p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary border-t border-border transition-colors">
                            Ver Kanban Completo
                        </button>
                    </section>

                    {/* Widget: Mural de Informações Complementares (Opcional) */}
                    <div className="bg-card/30 border border-border border-dashed rounded-2xl h-40 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground font-medium italic">Espaço para métricas futuras.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
