import { ShieldAlert, Activity, ChevronLeft, ChevronRight, FileText, Search, Calendar, X } from 'lucide-react';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { usarLogs } from './usarLogs';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { useState } from 'react';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '../../compartilhado/componentes/Modal';
import type { LogSistema } from './usarLogs';

export function PainelLogs() {
    const {
        logs, carregando, pagina, setPagina, totalPaginas,
        filtroModulo, setFiltroModulo, filtroAcao, setFiltroAcao,
        busca, setBusca, dataInicio, setDataInicio, dataFim, setDataFim
    } = usarLogs();

    const [modalInspecao, setModalInspecao] = useState<LogSistema | null>(null);

    // Função helper para colorir tags de ação
    const getVarianteAcao = (acao: string) => {
        if (acao.includes('DELETAR') || acao.includes('REMOVER')) return 'vermelho';
        if (acao.includes('CRIAR') || acao.includes('NOVO')) return 'verde';
        if (acao.includes('LOGIN') || acao.includes('LOGOUT')) return 'azul';
        return 'cinza';
    };

    if (carregando) return <Carregando />;

    return (
        <div className="space-y-10 flex flex-col h-full bg-background animate-in fade-in duration-500 pb-10">
            <CabecalhoFuncionalidade
                titulo="Logs de Auditoria"
                subtitulo="Registros imutáveis de ações do sistema."
                icone={ShieldAlert}
                variante="perigo"
            />


            {/* Barra de Filtros Compacta - Linha Única */}
            <div className="bg-card border border-border p-3 rounded-2xl shadow-sm">
                <div className="flex flex-col xl:flex-row items-end gap-3">

                    {/* Busca Textual - Ganha mais espaço */}
                    <div className="flex-1 w-full relative group">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-2 mb-1 block">Pesquisa Global</label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Descrição, usuário ou e-mail..."
                                value={busca}
                                onChange={e => { setBusca(e.target.value); setPagina(1); }}
                                className="w-full h-10 bg-background border border-border rounded-2xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Controles Menores */}
                    <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 w-full xl:w-auto">

                        {/* Módulo */}
                        <div className="min-w-[140px] flex-1 lg:flex-none">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1 block">Módulo</label>
                            <select
                                value={filtroModulo}
                                onChange={e => { setFiltroModulo(e.target.value); setPagina(1); }}
                                className="w-full h-10 bg-background border border-border rounded-2xl px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer hover:border-primary/40 transition-colors"
                            >
                                <option value="">Todos Módulos</option>
                                <option value="backlog">Backlog</option>
                                <option value="kanban">Kanban</option>
                                <option value="ponto">Ponto</option>
                                <option value="autenticacao">Autenticação</option>
                                <option value="membros">Membros</option>
                                <option value="admin">Administração</option>
                            </select>
                        </div>

                        {/* Ação em Lista (Refinamento) */}
                        <div className="min-w-[140px] flex-1 lg:flex-none">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1 block">Ação</label>
                            <select
                                value={filtroAcao}
                                onChange={e => { setFiltroAcao(e.target.value); setPagina(1); }}
                                className="w-full h-10 bg-background border border-border rounded-2xl px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer hover:border-primary/40 transition-colors"
                            >
                                <option value="">Todas Ações</option>
                                <option value="LOGIN">Entrada (Login)</option>
                                <option value="LOGOUT">Saída (Logout)</option>
                                <option value="CRIAR">Criação</option>
                                <option value="ATUALIZAR">Atualização</option>
                                <option value="DELETAR">Exclusão</option>
                                <option value="MOVER">Movimentação</option>
                                <option value="ROLE">Permissões</option>
                                <option value="STATUS">Status</option>
                                <option value="PRE_CADASTRO">Whitelist</option>
                            </select>
                        </div>

                        {/* Datas */}
                        <div className="flex items-center gap-2 flex-1 lg:flex-none">
                            <div className="min-w-[130px]">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1 block">Início</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={e => { setDataInicio(e.target.value); setPagina(1); }}
                                        className="w-full h-10 bg-background border border-border rounded-2xl pl-9 pr-2 text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 hover:border-primary/40 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="min-w-[130px]">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1 block">Fim</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                    <input
                                        type="date"
                                        value={dataFim}
                                        onChange={e => { setDataFim(e.target.value); setPagina(1); }}
                                        className="w-full h-10 bg-background border border-border rounded-2xl pl-9 pr-2 text-[11px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 hover:border-primary/40 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botão de Reset (Mais discreto) */}
                        {(busca || filtroModulo || filtroAcao || dataInicio || dataFim) && (
                            <button
                                onClick={() => {
                                    setBusca('');
                                    setFiltroModulo('');
                                    setFiltroAcao('');
                                    setDataInicio('');
                                    setDataFim('');
                                    setPagina(1);
                                }}
                                className="h-10 px-3 flex items-center justify-center text-primary hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/20"
                                title="Limpar todos os filtros"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden">

                {/* Header Table */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/80 text-xs font-bold text-muted-foreground uppercase tracking-widest sticky top-0 z-10">
                    <div className="col-span-2">Data/Hora</div>
                    <div className="col-span-2">Ação</div>
                    <div className="col-span-3">Usuário</div>
                    <div className="col-span-3">Detalhes</div>
                    <div className="col-span-2">Ref/Tabela</div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {carregando ? (
                        <div className="py-12"><Carregando /></div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Activity className="w-12 h-12 mb-4 opacity-30" />
                            <p>Nenhum log encontrado nesta página.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {logs.map(log => (
                                <div key={log.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-accent/50 transition-colors text-sm">
                                    <div className="col-span-2 text-muted-foreground font-mono text-xs">
                                        {formatarDataHora(log.criado_em)}
                                    </div>
                                    <div className="col-span-2">
                                        <Emblema texto={log.acao} variante={getVarianteAcao(log.acao)} />
                                    </div>
                                    <div className="col-span-3">
                                        {log.usuario_id || log.email ? (
                                            <div>
                                                <p className="font-medium text-foreground truncate">{log.nome || 'Usuário Deletado'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{log.email}</p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic">Sistema/Anônimo</span>
                                        )}
                                    </div>
                                    <div className="col-span-3 text-muted-foreground truncate pr-4" title={log.descricao}>
                                        {log.descricao}
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between text-muted-foreground text-xs font-mono truncate">
                                        <div className="flex items-center gap-2 truncate">
                                            {log.entidade_tipo ? (
                                                <>
                                                    <FileText className="w-3.5 h-3.5" />
                                                    <span className="truncate" title={`${log.entidade_tipo} -> ${log.entidade_id}`}>{log.entidade_tipo}</span>
                                                </>
                                            ) : (
                                                <span className="italic">—</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setModalInspecao(log)}
                                            className="ml-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2 py-1 rounded"
                                        >
                                            Ver JSON
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Paginação */}
                <div className="p-4 border-t border-border bg-muted/80 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Página <span className="font-medium text-foreground">{pagina}</span> de <span className="font-medium text-foreground">{totalPaginas}</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagina === 1 || carregando}
                            onClick={() => setPagina(p => p - 1)}
                            className="p-2 rounded-xl border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
                            title="Página Anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={pagina === totalPaginas || carregando}
                            onClick={() => setPagina(p => p + 1)}
                            className="p-2 rounded-xl border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
                            title="Próxima Página"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Modal de Detalhes JSON */}
            {modalInspecao && (
                <Modal
                    titulo="Detalhes do Log"
                    aberto={!!modalInspecao}
                    aoFechar={() => setModalInspecao(null)}
                    largura="lg"
                >
                    <div className="bg-background p-4 rounded-2xl border border-border overflow-x-auto">
                        <pre className="text-emerald-500 text-xs font-mono">
                            {JSON.stringify(modalInspecao, null, 2)}
                        </pre>
                    </div>
                </Modal>
            )}

        </div>
    );
}
