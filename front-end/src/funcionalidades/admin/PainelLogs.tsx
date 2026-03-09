import { ShieldAlert, Activity, FileText, Search, Calendar, X } from 'lucide-react';
import { Paginacao } from '../../compartilhado/componentes/Paginacao';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { usarLogs } from './usarLogs';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { useState } from 'react';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '../../compartilhado/componentes/Modal';
import type { LogSistema } from './usarLogs';

/** Painel de auditoria com tabela semântica padronizada. */
export function PainelLogs() {
    const {
        logs, carregando, pagina, setPagina, totalPaginas, totalRegistros,
        itensPorPagina, setItensPorPagina,
        filtroModulo, setFiltroModulo, filtroAcao, setFiltroAcao,
        busca, setBusca, dataInicio, setDataInicio, dataFim, setDataFim
    } = usarLogs();

    const [modalInspecao, setModalInspecao] = useState<LogSistema | null>(null);

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

            {/* Barra de Filtros */}
            <div className="bg-card border border-border p-3 rounded-2xl shadow-sm">
                <div className="flex flex-col xl:flex-row items-end gap-3">
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

                    <div className="flex flex-wrap lg:flex-nowrap items-end gap-3 w-full xl:w-auto">
                        <div className="min-w-[140px] flex-1 lg:flex-none">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1 block">Módulo</label>
                            <select
                                value={filtroModulo}
                                onChange={e => { setFiltroModulo(e.target.value); setPagina(1); }}
                                className="w-full h-10 bg-background border border-border rounded-2xl px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer hover:border-primary/40 transition-colors"
                            >
                                <option value="">Todos Módulos</option>
                                <option value="kanban">Kanban</option>
                                <option value="ponto">Ponto</option>
                                <option value="autenticacao">Autenticação</option>
                                <option value="membros">Membros</option>
                                <option value="admin">Administração</option>
                            </select>
                        </div>

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

            {/* Tabela Semântica */}
            <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden">
                <div className="flex-1 overflow-auto">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Activity className="w-12 h-12 mb-4 opacity-30" />
                            <p>Nenhum log encontrado nesta página.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30 sticky top-0 z-10">
                                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[14%]">
                                        Data / Hora
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[12%]">
                                        Ação
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[22%]">
                                        Usuário
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[34%]">
                                        Detalhes
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[18%]">
                                        Ref / Tabela
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                            {formatarDataHora(log.criado_em)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Emblema texto={log.acao} variante={getVarianteAcao(log.acao)} />
                                        </td>
                                        <td className="px-3 py-3">
                                            {log.usuario_id || log.email ? (
                                                <div>
                                                    <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                                                        {log.nome || 'Usuário Deletado'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                        {log.email}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Sistema/Anônimo</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-sm text-muted-foreground truncate max-w-[280px]" title={log.descricao}>
                                            {log.descricao}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono truncate">
                                                    {log.entidade_tipo ? (
                                                        <>
                                                            <FileText className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate" title={`${log.entidade_tipo} → ${log.entidade_id}`}>
                                                                {log.entidade_tipo}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="italic">—</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setModalInspecao(log)}
                                                    className="shrink-0 bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                                                >
                                                    JSON
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Paginacao
                    paginaAtual={pagina}
                    totalPaginas={totalPaginas}
                    totalRegistros={totalRegistros}
                    itensPorPagina={itensPorPagina}
                    itensListados={logs.length}
                    aoMudarPagina={setPagina}
                    aoMudarItensPorPagina={(num) => { setItensPorPagina(num); setPagina(1); }}
                    desabilitado={carregando}
                />
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
