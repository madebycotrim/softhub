import { ShieldAlert, Activity, FileText, FolderKanban, Clock, Users, Key, Settings } from 'lucide-react';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Paginacao } from '@/compartilhado/componentes/Paginacao';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { usarLogs } from '@/funcionalidades/admin/hooks/usarLogs';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { useState, Fragment, memo, useMemo, useCallback } from 'react';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { BarraFiltros, FiltroSelect, FiltroDataRange, FiltroToggle } from '@/compartilhado/componentes/BarraFiltros';

const getVarianteAcao = (acao: string) => {
    const a = acao.toUpperCase();
    if (a.includes('DELETAR') || a.includes('REMOVER') || a.includes('EXCLU') || a.includes('FALH') || a.includes('ERR') || a.includes('DESATIVAD')) return 'vermelho';
    if (a.includes('CRIAR') || a.includes('NOVO') || a.includes('CRIAD') || a.includes('ATIVAD')) return 'verde';
    if (a.includes('LOGIN') || a.includes('LOGOUT') || a.includes('ACES')) return 'azul';
    if (a.includes('ROLE') || a.includes('PERMISSÃO')) return 'roxo';
    if (a.includes('STATUS') || a.includes('MOVER') || a.includes('EDITAD') || a.includes('ATUALIZAR')) return 'amarelo';
    return 'cinza';
};

const getModuloInfo = (modulo: string) => {
    const m = modulo?.toLowerCase() || '';
    if (m.includes('kanban')) return { icone: FolderKanban, cor: 'text-blue-600', bg: 'bg-blue-100/50', borda: 'border-blue-200', label: 'Kanban' };
    if (m.includes('ponto')) return { icone: Clock, cor: 'text-amber-700', bg: 'bg-amber-100/50', borda: 'border-amber-200', label: 'Ponto' };
    if (m.includes('membros')) return { icone: Users, cor: 'text-emerald-600', bg: 'bg-emerald-100/50', borda: 'border-emerald-200', label: 'Membros' };
    if (m.includes('autenticacao')) return { icone: Key, cor: 'text-indigo-600', bg: 'bg-indigo-100/50', borda: 'border-indigo-200', label: 'Auth' };
    if (m.includes('admin')) return { icone: Settings, cor: 'text-slate-600', bg: 'bg-slate-200/50', borda: 'border-slate-300', label: 'Admin' };
    return { icone: FileText, cor: 'text-slate-400', bg: 'bg-slate-100', borda: 'border-slate-200', label: modulo || 'Geral' };
};

const DetalheLog = memo(({ log }: { log: any }) => {
    return (
        <div className="p-8 bg-slate-50/50 border-t border-border/40">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Cabeçalho do Detalhe (Inspector Header) */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/60 pb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/20">
                                LOG INSPECTOR
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground/30 select-all tracking-tighter">ID: {log.id}</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                            Auditando: <span className="text-primary">{log.acao.replace('_', ' ')}</span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                                <Clock size={12} className="text-muted-foreground/40" />
                                <span className="text-[11px] font-bold text-muted-foreground/60">{formatarDataHora(log.criado_em)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity size={12} className="text-muted-foreground/40" />
                                <span className="text-[11px] font-bold text-muted-foreground/60">IP: {log.ip || 'Local/Worker'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={12} className="text-muted-foreground/40" />
                                <span className="text-[11px] font-bold text-muted-foreground/60">{log.email || 'Automated System'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 4))}
                        className="flex items-center gap-2 bg-white border border-border shadow-sm px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                    >
                        <FileText size={14} className="text-primary" />
                        Copiar Payload Completo
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Lado Esquerdo: Mudanças Visuais (Delta) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Transformação de Dados</h5>
                            <div className="h-[1px] flex-1 bg-border/40 mx-4" />
                        </div>

                        {(log.dados_anteriores || log.dados_novos) ? (
                            <div className={`grid gap-4 ${log.dados_anteriores && log.dados_novos ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {/* Antes */}
                                {log.dados_anteriores && (
                                    <div className="group space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-red-500/30 rounded-full" />
                                            <span className="text-[10px] font-black text-red-600/50 uppercase tracking-widest">
                                                {log.dados_novos ? 'Removido / Antigo' : 'Objeto Deletado'}
                                            </span>
                                        </div>
                                        <div className="bg-white border border-red-500/10 rounded-2xl p-5 shadow-sm group-hover:border-red-500/20 transition-colors overflow-hidden">
                                            <pre className="text-[11px] text-slate-500 font-mono whitespace-pre-wrap leading-relaxed">
                                                {(() => {
                                                    try { return JSON.stringify(JSON.parse(log.dados_anteriores), null, 2); } 
                                                    catch { return log.dados_anteriores; }
                                                })()}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Depois */}
                                {log.dados_novos && (
                                    <div className="group space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                {log.dados_anteriores ? 'Atualizado / Novo' : 'Dados da Criação'}
                                            </span>
                                        </div>
                                        <div className="bg-emerald-50/30 border border-emerald-500/20 rounded-2xl p-5 shadow-sm group-hover:border-emerald-500/40 transition-colors overflow-hidden">
                                            <pre className="text-[11px] text-slate-800 font-mono font-semibold whitespace-pre-wrap leading-relaxed">
                                                {(() => {
                                                    try { return JSON.stringify(JSON.parse(log.dados_novos), null, 2); } 
                                                    catch { return log.dados_novos; }
                                                })()}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 border-2 border-dashed border-border/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
                                <Settings size={24} className="text-muted-foreground/20" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Operação sem Payload de Dados</p>
                            </div>
                        )}
                    </div>

                    {/* Lado Direito: Terminal de Contexto (Raw) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between">
                            <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Contexto do Sistema</h5>
                            <div className="h-[1px] flex-1 bg-border/40 mx-4" />
                        </div>

                        <div className="bg-[#0b0e14] rounded-[24px] border border-white/5 shadow-2xl overflow-hidden group">
                            <div className="px-5 py-3.5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                                </div>
                                <span className="text-[9px] font-mono text-white/20 tracking-widest">RAW_LOG_ENTRY</span>
                            </div>
                            <div className="p-6 max-h-[350px] overflow-auto custom-scrollbar">
                                <pre className="text-emerald-400/90 font-mono text-[11px] leading-6 selection:bg-emerald-500/20">
                                    {JSON.stringify(log, null, 4)}
                                </pre>
                            </div>
                            <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
                                <p className="text-[9px] font-mono text-white/10 uppercase tracking-tighter truncate">Source: Cloudflare D1 Edge Service</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const LinhaLog = memo(({ log, expandido, aoAlternar }: { log: any, expandido: boolean, aoAlternar: (id: string) => void }) => {
    const info = getModuloInfo(log.modulo);
    const Icone = info.icone;

    return (
        <tr 
            className={`hover:bg-muted/5 cursor-pointer transition-all border-b border-border/10 last:border-none ${expandido ? 'bg-primary/5' : ''}`}
            onClick={() => aoAlternar(log.id)}
        >
            <td className="px-5 py-5 text-muted-foreground/80 font-mono text-[10px] font-bold">
                {formatarDataHora(log.criado_em)}
            </td>
            <td className="px-3 py-5">
                <Emblema texto={log.acao} variante={getVarianteAcao(log.acao)} className="scale-90 origin-left" />
            </td>
            <td className="px-3 py-5 min-w-0">
                {log.usuario_id || log.email ? (
                    <div className="min-w-0">
                        <p className="font-black text-foreground text-[11px] uppercase tracking-wide truncate">
                            {log.nome || 'USUÁRIO EXCLUÍDO'}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground/40 truncate tracking-tighter">
                            {log.email}
                        </p>
                    </div>
                ) : (
                    <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest italic">SISTEMA CORE</span>
                )}
            </td>
            <td className="px-3 py-5">
                <p className="text-[12px] text-muted-foreground/80 font-medium truncate max-w-[400px]" title={log.descricao}>
                    {log.descricao}
                </p>
            </td>
            <td className="px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${info.bg} ${info.borda} ${info.cor}`}>
                        <Icone size={12} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em]">{info.label}</span>
                    </div>
                    
                    <div className={`p-1.5 rounded-lg transition-all ${expandido ? 'rotate-180 bg-primary/20 text-primary' : 'text-muted-foreground/30 hover:bg-muted/40'}`}>
                        <Activity size={12} strokeWidth={3} />
                    </div>
                </div>
            </td>
        </tr>
    );
});

/** Painel de auditoria com tabela semântica padronizada. */
export const PainelLogs = memo(() => {
    const {
        logs, carregando, erro, pagina, setPagina, totalPaginas, totalRegistros,
        itensPorPagina, setItensPorPagina,
        filtroModulo, setFiltroModulo, filtroAcao, setFiltroAcao,
        busca, setBusca, dataInicio, setDataInicio, dataFim, setDataFim,
        modoVisualizacao, setModoVisualizacao
    } = usarLogs();

    const [expandidoId, setExpandidoId] = useState<string | null>(null);

    const handleAlternarExpansao = useCallback((id: string) => {
        setExpandidoId(prev => prev === id ? null : id);
    }, []);

    const handleMudarBusca = useCallback((v: string) => {
        setBusca(v);
        setPagina(1);
    }, [setBusca, setPagina]);

    const handleMudarModulo = useCallback((v: string) => {
        setFiltroModulo(v);
        setPagina(1);
    }, [setFiltroModulo, setPagina]);

    const handleMudarAcao = useCallback((v: string) => {
        setFiltroAcao(v);
        setPagina(1);
    }, [setFiltroAcao, setPagina]);

    const handleLimparFiltros = useCallback(() => {
        setBusca('');
        setFiltroModulo('');
        setFiltroAcao('');
        setDataInicio('');
        setDataFim('');
        setPagina(1);
    }, [setBusca, setFiltroModulo, setFiltroAcao, setDataInicio, setDataFim, setPagina]);

    const handleMudarItensPorPagina = useCallback((num: number) => {
        setItensPorPagina(num);
        setPagina(1);
    }, [setItensPorPagina, setPagina]);



    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CabecalhoFuncionalidade
                titulo="Logs de Auditoria"
                subtitulo="Registros imutáveis de todas as operações críticas do ecossistema."
                icone={ShieldAlert}
            >
                {carregando && logs.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse">
                        <Carregando Centralizar={false} tamanho="sm" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando Auditoria</span>
                    </div>
                )}
            </CabecalhoFuncionalidade>

            <BarraFiltros
                busca={busca}
                aoMudarBusca={handleMudarBusca}
                placeholderBusca="Localizar registro..."
                temFiltrosAtivos={!!(busca || filtroModulo || filtroAcao || dataInicio || dataFim)}
                aoLimparFiltros={handleLimparFiltros}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <FiltroSelect 
                        valor={filtroModulo} 
                        aoMudar={handleMudarModulo}
                        rotuloPadrao="Todos os Módulos"
                        opcoes={[
                            { valor: "kanban", rotulo: "Quadro Kanban" },
                            { valor: "ponto", rotulo: "Ponto Eletrônico" },
                            { valor: "membros", rotulo: "Gestão de Membros" },
                            { valor: "autenticacao", rotulo: "Segurança & Auth" },
                            { valor: "admin", rotulo: "Administração" }
                        ]}
                    />

                    <FiltroSelect 
                        valor={filtroAcao} 
                        aoMudar={handleMudarAcao}
                        rotuloPadrao="Todas as Ações"
                        opcoes={[
                            { valor: "LOGIN", rotulo: "Autenticação" },
                            { valor: "CRIAR", rotulo: "Criação de Dados" },
                            { valor: "ATUALIZAR", rotulo: "Edição / Update" },
                            { valor: "DELETAR", rotulo: "Exclusão / Destruição" },
                            { valor: "ROLE", rotulo: "Controle de Acesso" }
                        ]}
                    />

                    <FiltroDataRange 
                        inicio={dataInicio} 
                        fim={dataFim} 
                        aoMudarInicio={(v: string) => { setDataInicio(v); setPagina(1); }}
                        aoMudarFim={(v: string) => { setDataFim(v); setPagina(1); }}
                        desabilitado={modoVisualizacao === 'otimizada'}
                    />

                    <FiltroToggle 
                        valorAtivo={modoVisualizacao}
                        aoMudar={(v: 'otimizada' | 'historico') => setModoVisualizacao(v)}
                        opcoes={[
                            { valor: 'otimizada', rotulo: 'Recentes' },
                            { valor: 'historico', rotulo: 'Arquivo' }
                        ]}
                    />
                </div>
            </BarraFiltros>

            {/* Tabela de Auditoria */}
            <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col shadow-sm shadow-black/5 overflow-hidden">
                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    {erro ? (
                        <div className="h-full flex items-center justify-center p-12">
                            <EstadoErro titulo="Falha na Sincronização" mensagem={erro} />
                        </div>
                    ) : carregando && logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
                             <Carregando Centralizar={false} tamanho="lg" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Indexando Registros de Auditoria</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <EstadoVazio 
                            tipo="pesquisa"
                            titulo="Nenhum registro localizado"
                            descricao="Refine seus filtros ou busque em períodos anteriores."
                        />
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="bg-muted/10 border-b border-border sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[180px]">CRONÔMETRO (UTC)</th>
                                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[120px]">OPERAÇÃO</th>
                                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[200px]">AGENTE RESPONSÁVEL</th>
                                    <th className="px-3 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">DESCRIÇÃO DO EVENTO</th>
                                    <th className="px-5 py-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 w-[220px]">MÓDULO DE ORIGEM</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y divide-border/20 transition-opacity duration-300 ${carregando ? 'opacity-50' : 'opacity-100'}`}>
                                {logs.map(log => (
                                    <Fragment key={log.id}>
                                        <LinhaLog
                                            log={log}
                                            expandido={expandidoId === log.id}
                                            aoAlternar={handleAlternarExpansao}
                                        />
                                        {expandidoId === log.id && (
                                            <tr className="bg-muted/10 animate-in slide-in-from-top-4 duration-500">
                                                <td colSpan={5} className="p-0">
                                                    <DetalheLog log={log} />
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
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
                    aoMudarItensPorPagina={handleMudarItensPorPagina}
                    desabilitado={carregando}
                />
            </div>
        </div>
    );
});
 
export default PainelLogs;
