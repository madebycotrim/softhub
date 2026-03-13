import {
    ListTodo,
    Plus,
    ChevronRight,
    User,
    FolderKanban
} from 'lucide-react';
import { usarBacklog } from '../hooks/usarBacklog';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { LABELS_PRIORIDADE, LABELS_STATUS } from '@/utilitarios/constantes';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { useState, useCallback, memo } from 'react';
import { ModalCriarTarefa } from './ModalCriarTarefa';
import { BarraFiltros, FiltroPills } from '@/compartilhado/componentes/BarraFiltros';

const PaginaBacklog = memo(() => {
    const { projetoAtivoId } = usarAutenticacao();
    const { projetos, carregando: carregandoProjetos } = usarProjetos();
    const podeGerenciarProjetos = usarPermissaoAcesso('projetos:visualizar');

    const [modalCriarAberto, setModalCriarAberto] = useState(false);
    const [busca, setBusca] = useState('');
    const [statusFiltro, setStatusFiltro] = useState<string[]>([]);
    const [prioridadeFiltro, setPrioridadeFiltro] = useState<string[]>([]);

    const {
        tarefas,
        carregando,
        erro,
        criarTarefa
    } = usarBacklog(projetoAtivoId, {
        busca,
        status: statusFiltro.length > 0 ? statusFiltro : undefined,
        prioridades: prioridadeFiltro.length > 0 ? prioridadeFiltro : undefined
    });

    const toggleStatus = useCallback((s: string) => {
        setStatusFiltro(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    }, []);

    const togglePrioridade = useCallback((p: string) => {
        setPrioridadeFiltro(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    }, []);

    const podeCriar = usarPermissaoAcesso('tarefas:criar');

    if (carregandoProjetos) {
        return (
            <div className="flex-1 py-40 flex items-center justify-center">
                <Carregando Centralizar={false} tamanho="lg" />
            </div>
        );
    }

    if (!carregandoProjetos && projetos.length === 0) {
        return (
            <div className="flex flex-col gap-10">
                <CabecalhoFuncionalidade
                    titulo="Backlog de Demandas"
                    subtitulo="Visão detalhada e gestão completa de todas as tarefas."
                    icone={ListTodo}
                />
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 rounded-[32px] bg-muted/30 border border-border flex items-center justify-center mb-8 shadow-2xl shadow-primary/5">
                        <FolderKanban className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-3">Fábrica Vazia</h2>
                    <p className="text-muted-foreground text-sm max-w-sm mb-8 leading-relaxed">
                        Ainda não existem projetos cadastrados. Você precisa de um projeto para gerenciar o backlog.
                    </p>
                    {podeGerenciarProjetos ? (
                        <a href="/app/admin/projetos" className="h-12 px-8 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center">
                            Criar Primeiro Projeto
                        </a>
                    ) : (
                        <p className="text-[10px] font-black uppercase tracking-widest text-destructive/60 bg-destructive/5 px-4 py-2 rounded-xl border border-destructive/10">
                            Contate um administrador para criar projetos
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700 pb-20">
            <CabecalhoFuncionalidade
                titulo="Backlog de Demandas"
                subtitulo="Visão detalhada e gestão completa de todas as tarefas do projeto."
                icone={ListTodo}
            >
                <div className="flex items-center gap-4">
                    {projetoAtivoId && podeCriar && (
                        <button
                            onClick={() => setModalCriarAberto(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> Nova Tarefa
                        </button>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <BarraFiltros
                busca={busca}
                aoMudarBusca={setBusca}
                placeholderBusca="Buscar demanda pelo título ou descrição..."
                temFiltrosAtivos={busca !== '' || statusFiltro.length > 0 || prioridadeFiltro.length > 0}
                aoLimparFiltros={() => {
                    setBusca('');
                    setStatusFiltro([]);
                    setPrioridadeFiltro([]);
                }}
            >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    <FiltroPills 
                        label="Prioridade" 
                        opcoes={LABELS_PRIORIDADE} 
                        valoresAtivos={prioridadeFiltro} 
                        aoToggle={togglePrioridade} 
                        variante="primary"
                    />
                    
                    <div className="h-6 w-px bg-white/5 hidden lg:block" />

                    <FiltroPills 
                        label="Status" 
                        opcoes={LABELS_STATUS} 
                        valoresAtivos={statusFiltro} 
                        aoToggle={toggleStatus} 
                    />
                </div>
            </BarraFiltros>

            {/* Listagem */}
            {carregando ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                        <Carregando Centralizar={false} tamanho="lg" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-8 animate-pulse">Sincronizando Ecossistema</span>
                </div>
            ) : erro ? (
                <div className="py-12 max-w-lg mx-auto w-full animate-in slide-in-from-bottom-4 duration-500">
                    <EstadoErro titulo="Erro no Backlog" mensagem={erro} />
                </div>
            ) : tarefas.length === 0 ? (
                <EstadoVazio
                    titulo="Backlog Vazio"
                    descricao="Nenhuma tarefa corresponde aos filtros selecionados. Limpe os filtros ou crie uma nova demanda."
                />
            ) : (
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-8 py-6 text-left text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Título da Demanda</th>
                                    <th className="px-4 py-6 text-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Prioridade</th>
                                    <th className="px-4 py-6 text-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Status Atual</th>
                                    <th className="px-4 py-6 text-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Time Alocado</th>
                                    <th className="px-8 py-6 text-right text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Gerir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tarefas.map(tarefa => (
                                    <tr key={tarefa.id} className="group hover:bg-white/[0.03] transition-all duration-300 cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-sm font-bold text-white/90 group-hover:text-primary transition-colors duration-300 tracking-tight">{tarefa.titulo}</span>
                                                <span className="text-[11px] text-muted-foreground/40 line-clamp-1 max-w-xl font-medium leading-relaxed group-hover:text-muted-foreground/60 transition-colors">
                                                    {tarefa.descricao || "Sem detalhes adicionais fornecidos via IA ou manualmente."}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <Emblema
                                                texto={LABELS_PRIORIDADE[tarefa.prioridade]}
                                                variante={
                                                    tarefa.prioridade === 'urgente' ? 'vermelho' :
                                                        tarefa.prioridade === 'alta' ? 'amarelo' :
                                                            tarefa.prioridade === 'media' ? 'azul' : 'cinza'
                                                }
                                                className="shadow-lg group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <Emblema
                                                texto={LABELS_STATUS[tarefa.status]}
                                                variante={
                                                    tarefa.status === 'concluida' ? 'verde' :
                                                    tarefa.status === 'in_progress' ? 'azul' :
                                                    tarefa.status === 'em_revisao' ? 'roxo' :
                                                    tarefa.status === 'todo' ? 'alerta' : 'cinza'
                                                }
                                                className="!bg-white/5 !text-white/60 !border-white/10 group-hover:!bg-white/10 transition-colors"
                                            />
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="flex items-center justify-center -space-x-2.5">
                                                {tarefa.responsaveis && tarefa.responsaveis.length > 0 ? (
                                                    tarefa.responsaveis.map(resp => (
                                                        <div key={resp.id} className="relative group/avatar">
                                                            <Avatar
                                                                nome={resp.nome}
                                                                fotoPerfil={resp.foto || null}
                                                                tamanho="sm"
                                                                className="ring-2 ring-slate-950 group-hover/avatar:ring-primary/50 group-hover/avatar:scale-110 transition-all z-0 hover:z-10"
                                                            />
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[9px] font-bold text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                                                {resp.nome}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center text-muted-foreground/20 group-hover:border-primary/20 group-hover:text-primary/30 transition-all">
                                                        <User size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-3 bg-white/5 hover:bg-primary text-white/40 hover:text-white rounded-2xl transition-all duration-300 shadow-xl hover:shadow-primary/40 group-hover:translate-x-1">
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

            <ModalCriarTarefa 
                aberto={modalCriarAberto} 
                aoFechar={() => setModalCriarAberto(false)} 
                aoCriar={async (dados) => {
                    await criarTarefa(dados);
                }}
            />
        </div>
    );
});

export default PaginaBacklog;
