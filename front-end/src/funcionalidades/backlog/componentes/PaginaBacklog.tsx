import { 
    ListTodo, 
    Plus, 
    Search, 
    ChevronRight, 
    User,
    AlertTriangle
} from 'lucide-react';
import { usarBacklog } from '../hooks/usarBacklog';
import { LayoutPrincipal } from '@/compartilhado/componentes/LayoutPrincipal';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { LABELS_PRIORIDADE, LABELS_STATUS } from '@/utilitarios/constantes';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { useState } from 'react';

export default function PaginaBacklog() {
    const [busca, setBusca] = useState('');
    const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
    const [prioridadeFiltro, setPrioridadeFiltro] = useState<string[]>([]);

    const { 
        tarefas, 
        carregando, 
        erro 
    } = usarBacklog('p1', {
        busca,
        status: statusFiltro.length > 0 ? statusFiltro : undefined,
        prioridades: prioridadeFiltro.length > 0 ? prioridadeFiltro : undefined
    });

    const toggleStatus = (s: string) => {
        setStatusFiltro(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const togglePrioridade = (p: string) => {
        setPrioridadeFiltro(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    return (
        <LayoutPrincipal>
            <div className="w-full space-y-6 animate-in fade-in duration-700 pb-20">
                <CabecalhoFuncionalidade 
                    titulo="Backlog de Demandas"
                    subtitulo="Visão detalhada e gestão completa de todas as tarefas do projeto."
                    icone={ListTodo}
                >
                    <button
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" /> Nova Tarefa
                    </button>
                </CabecalhoFuncionalidade>

                {/* Barra de Filtros */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-6 bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                            <input 
                                type="text"
                                placeholder="Buscar por título ou descrição..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-muted/20 border border-border/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2">Prioridade</span>
                            <div className="flex gap-1">
                                {Object.entries(LABELS_PRIORIDADE).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => togglePrioridade(key)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
                                            prioridadeFiltro.includes(key)
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2 shrink-0">Status</span>
                        {Object.entries(LABELS_STATUS).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => toggleStatus(key)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 ${
                                    statusFiltro.includes(key)
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Listagem */}
                {carregando ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-card/20 border border-border/40 rounded-[40px]">
                        <Carregando Centralizar={false} tamanho="lg" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-4 animate-pulse">Sincronizando Demandas</span>
                    </div>
                ) : erro ? (
                    <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[40px] text-center">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <p className="text-red-500 font-bold">{erro}</p>
                    </div>
                ) : tarefas.length === 0 ? (
                    <EstadoVazio 
                        titulo="Nenhuma tarefa encontrada" 
                        descricao="Tente ajustar seus filtros para encontrar o que procura."
                    />
                ) : (
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border/10 bg-muted/10">
                                        <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Tarefa</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Prioridade</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Status</th>
                                        <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Responsáveis</th>
                                        <th className="px-4 py-4 text-right text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {tarefas.map(tarefa => (
                                        <tr key={tarefa.id} className="group hover:bg-primary/[0.02] transition-colors cursor-pointer">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{tarefa.titulo}</span>
                                                    <span className="text-[11px] text-muted-foreground/60 line-clamp-1 max-w-md font-medium">
                                                        {tarefa.descricao || "Sem descrição detalhada."}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <Emblema 
                                                    texto={LABELS_PRIORIDADE[tarefa.prioridade]} 
                                                    variante={
                                                        tarefa.prioridade === 'urgente' ? 'vermelho' :
                                                        tarefa.prioridade === 'alta' ? 'amarelo' :
                                                        tarefa.prioridade === 'media' ? 'azul' : 'cinza'
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <span className="px-3 py-1 bg-muted/30 border border-border/10 rounded-lg text-[10px] font-black uppercase tracking-tight text-foreground/70">
                                                    {LABELS_STATUS[tarefa.status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center justify-center -space-x-2">
                                                    {tarefa.responsaveis && tarefa.responsaveis.length > 0 ? (
                                                        tarefa.responsaveis.map(resp => (
                                                            <Avatar 
                                                                key={resp.id}
                                                                nome={resp.nome}
                                                                fotoPerfil={resp.foto || null}
                                                                tamanho="sm"
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/30">
                                                            <User size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="p-2.5 bg-muted/20 hover:bg-primary/10 hover:text-primary rounded-xl transition-all border border-transparent hover:border-primary/20">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </LayoutPrincipal>
    );
}
