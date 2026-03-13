import { ShieldAlert, Activity, FileText, FolderKanban, Clock, Users, Key, Settings } from 'lucide-react';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Paginacao } from '@/compartilhado/componentes/Paginacao';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { usarLogs } from '@/funcionalidades/admin/hooks/usarLogs';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { Emblema } from '@/compartilhado/componentes/Emblema';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { useState, Fragment } from 'react';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { BarraFiltros, FiltroSelect, FiltroDataRange, FiltroToggle } from '@/compartilhado/componentes/BarraFiltros';

/** Painel de auditoria com tabela semântica padronizada. */
export function PainelLogs() {
    const {
        logs, carregando, erro, pagina, setPagina, totalPaginas, totalRegistros,
        itensPorPagina, setItensPorPagina,
        filtroModulo, setFiltroModulo, filtroAcao, setFiltroAcao,
        busca, setBusca, dataInicio, setDataInicio, dataFim, setDataFim,
        modoVisualizacao, setModoVisualizacao
    } = usarLogs();

    const [expandidoId, setExpandidoId] = useState<string | null>(null);

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

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
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
                aoMudarBusca={(v: string) => { setBusca(v); setPagina(1); }}
                placeholderBusca="Localizar registro..."
                temFiltrosAtivos={!!(busca || filtroModulo || filtroAcao || dataInicio || dataFim)}
                aoLimparFiltros={() => {
                    setBusca('');
                    setFiltroModulo('');
                    setFiltroAcao('');
                    setDataInicio('');
                    setDataFim('');
                    setPagina(1);
                }}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <FiltroSelect 
                        valor={filtroModulo} 
                        aoMudar={(v: string) => { setFiltroModulo(v); setPagina(1); }}
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
                        aoMudar={(v: string) => { setFiltroAcao(v); setPagina(1); }}
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
                                        <tr 
                                            className={`hover:bg-muted/5 cursor-pointer transition-all border-b border-border/10 last:border-none ${expandidoId === log.id ? 'bg-primary/5' : ''}`}
                                            onClick={() => setExpandidoId(expandidoId === log.id ? null : log.id)}
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
                                                    {(() => {
                                                        const info = getModuloInfo(log.modulo);
                                                        const Icone = info.icone;
                                                        return (
                                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${info.bg} ${info.borda} ${info.cor}`}>
                                                                <Icone size={12} strokeWidth={3} />
                                                                <span className="text-[9px] font-black uppercase tracking-[0.15em]">{info.label}</span>
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    <div className={`p-1.5 rounded-lg transition-all ${expandidoId === log.id ? 'rotate-180 bg-primary/20 text-primary' : 'text-muted-foreground/30 hover:bg-muted/40'}`}>
                                                        <Activity size={12} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandidoId === log.id && (
                                            <tr className="bg-muted/5 animate-in slide-in-from-top-2 duration-300">
                                                <td colSpan={5} className="px-8 py-8">
                                                    <div className="flex flex-col gap-8 max-w-6xl">
                                                        {/* Comparação De/Para (Visual) */}
                                                        {(log.dados_anteriores || log.dados_novos) && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 px-1">
                                                                        <div className="w-1.5 h-3 bg-muted-foreground/20 rounded-full" />
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">ESTADO ANTERIOR</span>
                                                                    </div>
                                                                    <div className="bg-background border border-border rounded-2xl p-5 min-h-[100px] shadow-inner font-mono">
                                                                        {log.dados_anteriores ? (
                                                                            <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                                                                                {(() => {
                                                                                    try {
                                                                                        return JSON.stringify(JSON.parse(log.dados_anteriores), null, 2);
                                                                                    } catch {
                                                                                        return log.dados_anteriores;
                                                                                    }
                                                                                })()}
                                                                            </pre>
                                                                        ) : (
                                                                            <div className="h-full flex items-center justify-center italic text-muted-foreground/20 text-[11px]">
                                                                                Nenhum dado prévio registrado (Seed/Create)
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 px-1">
                                                                        <div className="w-1.5 h-3 bg-primary rounded-full" />
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">ESTADO ATUALIZADO</span>
                                                                    </div>
                                                                    <div className="bg-primary/[0.03] border border-primary/20 rounded-2xl p-5 min-h-[100px] shadow-sm font-mono">
                                                                        {log.dados_novos ? (
                                                                            <pre className="text-[11px] text-foreground font-mono whitespace-pre-wrap leading-relaxed font-semibold">
                                                                                {(() => {
                                                                                    try {
                                                                                        return JSON.stringify(JSON.parse(log.dados_novos), null, 2);
                                                                                    } catch {
                                                                                        return log.dados_novos;
                                                                                    }
                                                                                })()}
                                                                            </pre>
                                                                        ) : (
                                                                            <div className="h-full flex items-center justify-center italic text-muted-foreground/20 text-[11px]">
                                                                                Registro removido da base de dados (Delete)
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* JSON Completo (Debug) */}
                                                        <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                                                            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">DATA_PAYLOAD_TERMINAL</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <button 
                                                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 4))}
                                                                        className="text-[10px] font-black text-muted-foreground/40 hover:text-white transition-all uppercase tracking-tighter bg-white/5 px-3 py-1 rounded-lg"
                                                                    >
                                                                        COPIAR OBJETO
                                                                    </button>
                                                                    <span className="text-[10px] font-mono text-muted-foreground/20 select-all">LOG_UUID: {log.id}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-6 max-h-[350px] overflow-auto custom-scrollbar">
                                                                <pre className="text-emerald-400 font-mono text-[12px] leading-relaxed selection:bg-emerald-500/20">
                                                                    {JSON.stringify(log, null, 4)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </div>
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
                    aoMudarItensPorPagina={(num) => { setItensPorPagina(num); setPagina(1); }}
                    desabilitado={carregando}
                />
            </div>
        </div>
    );
}
