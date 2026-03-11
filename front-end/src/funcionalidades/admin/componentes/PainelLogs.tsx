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
export function PainelLogs() {    const {
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
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Logs de Auditoria"
                subtitulo="Registros imutáveis de todas as ações realizadas no sistema."
                icone={ShieldAlert}
                variante="perigo"
            >
                {carregando && logs.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse">
                        <Carregando Centralizar={false} tamanho="sm" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
                    </div>
                )}
            </CabecalhoFuncionalidade>

            <BarraFiltros
                busca={busca}
                aoMudarBusca={(v: string) => { setBusca(v); setPagina(1); }}
                placeholderBusca="Pesquisa global em logs..."
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
                <div className="flex flex-wrap items-center gap-4">
                    <FiltroSelect 
                        valor={filtroModulo} 
                        aoMudar={(v: string) => { setFiltroModulo(v); setPagina(1); }}
                        rotuloPadrao="Módulos"
                        opcoes={[
                            { valor: "kanban", rotulo: "Kanban" },
                            { valor: "ponto", rotulo: "Ponto" },
                            { valor: "membros", rotulo: "Membros" },
                            { valor: "autenticacao", rotulo: "Auth" },
                            { valor: "admin", rotulo: "Admin" }
                        ]}
                    />

                    <FiltroSelect 
                        valor={filtroAcao} 
                        aoMudar={(v: string) => { setFiltroAcao(v); setPagina(1); }}
                        rotuloPadrao="Ações"
                        opcoes={[
                            { valor: "LOGIN", rotulo: "Acesso" },
                            { valor: "CRIAR", rotulo: "Criação" },
                            { valor: "ATUALIZAR", rotulo: "Edição" },
                            { valor: "DELETAR", rotulo: "Exclusão" },
                            { valor: "ROLE", rotulo: "Permissões" }
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
                            { valor: 'otimizada', rotulo: 'Otimizada' },
                            { valor: 'historico', rotulo: 'Histórico' }
                        ]}
                    />
                </div>
            </BarraFiltros>

            {/* Tabela Semântica */}
            <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden">
                <div className="flex-1 overflow-auto relative">
                    {erro ? (
                        <div className="h-full flex items-center justify-center p-6">
                            <EstadoErro titulo="Erro ao carregar auditoria" mensagem={erro} />
                        </div>
                    ) : carregando && logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 bg-muted/5 animate-in fade-in duration-500">
                             <Carregando Centralizar={false} tamanho="lg" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Sincronizando Auditoria</span>
                        </div>
                    ) : logs.length === 0 ? (
                        (busca || filtroModulo || filtroAcao || dataInicio || dataFim || modoVisualizacao === 'otimizada') ? (
                            <EstadoVazio 
                                tipo="pesquisa"
                                titulo="Nenhum resultado filtrado"
                                descricao={modoVisualizacao === 'otimizada' ? "Não há registros nos últimos 3 meses para os filtros atuais. Tente mudar para 'Histórico'." : "Não encontramos registros para os filtros aplicados."}
                                compacto={true}
                                acao={{
                                    rotulo: "Ver histórico completo",
                                    aoClicar: () => {
                                        setModoVisualizacao('historico');
                                        setBusca('');
                                        setPagina(1);
                                    }
                                }}
                            />
                        ) : (
                            <EstadoVazio 
                                titulo="Deserto de Auditoria"
                                descricao="Surpreendentemente, ainda não há nenhuma ação registrada no sistema. Tudo parece estar em paz absoluta."
                            />
                        )
                    ) : (
                        <table className="w-full border-collapse">
                            <thead className="bg-muted border-b border-border sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ação</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Usuário</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Histórico / Descrição</th>
                                    <th className="px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Módulo / Tabela</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y divide-border/40 transition-opacity duration-300 ${carregando ? 'opacity-50' : 'opacity-100'}`}>
                                {logs.map(log => (
                                    <Fragment key={log.id}>
                                        <tr 
                                            className={`hover:bg-muted/20 cursor-pointer transition-all ${expandidoId === log.id ? 'bg-primary/5' : ''}`}
                                            onClick={() => setExpandidoId(expandidoId === log.id ? null : log.id)}
                                        >
                                            <td className="px-4 py-4 text-muted-foreground font-mono text-[11px]">
                                                {formatarDataHora(log.criado_em)}
                                            </td>
                                            <td className="px-3 py-4">
                                                <Emblema texto={log.acao} variante={getVarianteAcao(log.acao)} className="scale-90 origin-left" />
                                            </td>
                                            <td className="px-3 py-4">
                                                {log.usuario_id || log.email ? (
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground truncate max-w-[180px]">
                                                            {log.nome || 'Usuário Deletado'}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground tracking-tight truncate max-w-[180px]">
                                                            {log.email}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-[11px]">Sistema/Anônimo</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-[13px] text-muted-foreground/80 font-medium truncate max-w-[280px]" title={log.descricao}>
                                                {log.descricao}
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    {(() => {
                                                        const info = getModuloInfo(log.modulo);
                                                        const Icone = info.icone;
                                                        return (
                                                            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-2xl border ${info.bg} ${info.borda} ${info.cor}`}>
                                                                <Icone size={12} strokeWidth={2.5} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{info.label}</span>
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    <div className="flex-1 flex flex-col items-end">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[80px]">
                                                            {log.entidade_tipo || '—'}
                                                        </span>
                                                        <div className={`mt-1 p-1 rounded-2xl transition-transform ${expandidoId === log.id ? 'rotate-180 bg-primary/10 text-primary' : 'text-slate-300'}`}>
                                                            <Activity size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandidoId === log.id && (
                                            <tr className="bg-slate-950/20 animate-in slide-in-from-top-2 duration-300">
                                                <td colSpan={5} className="px-6 py-6 border-x border-border/20">
                                                    <div className="flex flex-col gap-6">
                                                        {/* Comparação De/Para (Visual) */}
                                                        {(log.dados_anteriores || log.dados_novos) && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 px-1">
                                                                        <div className="w-1.5 h-3 bg-slate-400 rounded-full" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado Anterior</span>
                                                                    </div>
                                                                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 min-h-[80px]">
                                                                        {log.dados_anteriores ? (
                                                                            <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap">
                                                                                {JSON.stringify(JSON.parse(log.dados_anteriores), null, 2)}
                                                                            </pre>
                                                                        ) : (
                                                                            <span className="text-[11px] italic text-slate-600">Nenhum dado anterior (Criação)</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2 px-1">
                                                                        <div className="w-1.5 h-3 bg-primary rounded-full" />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80">Novos Dados</span>
                                                                    </div>
                                                                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 min-h-[80px]">
                                                                        {log.dados_novos ? (
                                                                            <pre className="text-[11px] text-primary/90 font-mono whitespace-pre-wrap">
                                                                                {JSON.stringify(JSON.parse(log.dados_novos), null, 2)}
                                                                            </pre>
                                                                        ) : (
                                                                            <span className="text-[11px] italic text-slate-600">Nenhum dado novo (Exclusão)</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* JSON Completo (Debug) */}
                                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                                            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Activity size={12} className="text-slate-500" />
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Payload Completo da Auditoria</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <button 
                                                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 4))}
                                                                        className="text-[9px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
                                                                    >
                                                                        Copiar JSON
                                                                    </button>
                                                                    <span className="text-[10px] font-mono text-slate-700">ID: {log.id}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-5 max-h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
