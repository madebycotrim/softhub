import { ShieldAlert, Activity, FileText, Search, Calendar, X, FolderKanban, Clock, Users, Key, Settings, ChevronDown } from 'lucide-react';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';
import { Paginacao } from '../../compartilhado/componentes/Paginacao';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { usarLogs } from './usarLogs';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { useState, Fragment } from 'react';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';

/** Painel de auditoria com tabela semântica padronizada. */
export function PainelLogs() {
    const {
        logs, carregando, erro, pagina, setPagina, totalPaginas, totalRegistros,
        itensPorPagina, setItensPorPagina,
        filtroModulo, setFiltroModulo, filtroAcao, setFiltroAcao,
        busca, setBusca, dataInicio, setDataInicio, dataFim, setDataFim,
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
        if (m.includes('kanban')) return { icone: FolderKanban, cor: 'text-blue-600', bg: 'bg-blue-100', borda: 'border-blue-200', label: 'Kanban' };
        if (m.includes('ponto')) return { icone: Clock, cor: 'text-amber-700', bg: 'bg-amber-100', borda: 'border-amber-200', label: 'Ponto' };
        if (m.includes('membros')) return { icone: Users, cor: 'text-emerald-600', bg: 'bg-emerald-100', borda: 'border-emerald-200', label: 'Membros' };
        if (m.includes('autenticacao')) return { icone: Key, cor: 'text-indigo-600', bg: 'bg-indigo-100', borda: 'border-indigo-200', label: 'Auth' };
        if (m.includes('admin')) return { icone: Settings, cor: 'text-slate-600', bg: 'bg-slate-200', borda: 'border-slate-300', label: 'Admin' };
        return { icone: FileText, cor: 'text-slate-400', bg: 'bg-slate-100', borda: 'border-slate-200', label: modulo || 'Geral' };
    };

    const getCorAcaoFiltro = (filtro: string) => {
        if (!filtro) return 'bg-white border-slate-200 text-slate-500 hover:border-primary/30';
        const variante = getVarianteAcao(filtro);
        const estilos: Record<string, string> = {
            azul: 'bg-blue-100 text-blue-700 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
            verde: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
            vermelho: 'bg-rose-100 text-rose-700 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)] font-bold',
            amarelo: 'bg-amber-100 text-amber-900 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
            roxo: 'bg-violet-100 text-violet-700 border-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)] font-black italic',
            cinza: 'bg-slate-200 text-slate-700 border-slate-300',
            alerta: 'bg-orange-100 text-orange-800 border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
        };
        return estilos[variante] || 'bg-white border-slate-200 text-slate-500';
    };

    const getCorModuloFiltro = (filtro: string) => {
        if (!filtro) return 'bg-white border-slate-200 text-slate-500';
        const info = getModuloInfo(filtro);
        return `${info.bg} ${info.borda} ${info.cor}`;
    };

    if (carregando) return <Carregando />;

    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Logs de Auditoria"
                subtitulo="Registros imutáveis de todas as ações realizadas no sistema."
                icone={ShieldAlert}
                variante="perigo"
            />

            {/* Barra de Filtros */}
            <div className="bg-card my-6 border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-center gap-4 w-full">
                    <div className="flex-1 min-w-[280px]">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Pesquisa global em logs..."
                                value={busca}
                                onChange={e => { setBusca(e.target.value); setPagina(1); }}
                                className="w-full h-11 bg-white border border-slate-200 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                            <select 
                                value={filtroModulo}
                                onChange={e => { setFiltroModulo(e.target.value); setPagina(1); }}
                                className={`h-11 border rounded-2xl pl-4 pr-10 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer appearance-none min-w-[120px] focus:outline-none focus:ring-4 focus:ring-primary/5 ${getCorModuloFiltro(filtroModulo)}`}
                            >
                                <option value="" className="bg-white text-slate-500">Módulos</option>
                                <option value="kanban" className="bg-white text-slate-900">Kanban</option>
                                <option value="ponto" className="bg-white text-slate-900">Ponto</option>
                                <option value="membros" className="bg-white text-slate-900">Membros</option>
                            </select>
                            <ChevronDown size={12} className={`absolute right-4 pointer-events-none transition-colors ${filtroModulo ? 'text-current opacity-60' : 'text-slate-400'}`} />
                        </div>

                        <div className="relative flex items-center">
                            <select 
                                value={filtroAcao}
                                onChange={e => { setFiltroAcao(e.target.value); setPagina(1); }}
                                className={`h-11 border rounded-2xl pl-4 pr-10 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer appearance-none min-w-[110px] focus:outline-none focus:ring-4 focus:ring-primary/5 shadow-sm ${getCorAcaoFiltro(filtroAcao)}`}
                            >
                                <option value="" className="text-slate-500">Ações</option>
                                <option value="LOGIN" className="text-blue-600 font-bold">Acesso</option>
                                <option value="CRIAR" className="text-emerald-600 font-bold">Criação</option>
                                <option value="ATUALIZAR" className="text-slate-600 font-bold">Edição</option>
                                <option value="DELETAR" className="text-rose-600 font-bold">Exclusão</option>
                                <option value="ROLE" className="text-violet-600 font-bold">Permissões</option>
                            </select>
                            <ChevronDown size={12} className={`absolute right-4 pointer-events-none transition-colors ${filtroAcao ? 'text-current opacity-60' : 'text-slate-400'}`} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-2xl px-3 h-11 focus-within:border-primary/30 transition-all">
                            <Calendar size={14} className="text-slate-400 mr-2" />
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={e => { setDataInicio(e.target.value); setPagina(1); }}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:outline-none w-24"
                            />
                            <span className="mx-2 text-slate-300 text-xs">até</span>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={e => { setDataFim(e.target.value); setPagina(1); }}
                                className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:outline-none w-24"
                            />
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
                            className="h-11 px-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            <X size={14} />
                            Limpar
                        </button>
                    )}
                </div>
            </div>

            {erro && (
                <div className="mx-6 mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
                    <ShieldAlert size={18} />
                    <p className="text-xs font-bold uppercase tracking-widest">{erro}</p>
                </div>
            )}

            {/* Tabela Semântica */}
            <div className={`flex-1 min-h-0 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden transition-opacity ${carregando ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex-1 overflow-auto">
                    {logs.length === 0 && !carregando ? (
                        (busca || filtroModulo || filtroAcao || dataInicio || dataFim) ? (
                            <EstadoVazio 
                                tipo="pesquisa"
                                titulo="Nenhum resultado encontrado"
                                descricao="Não encontramos registros para os filtros aplicados. Tente usar termos mais genéricos ou limpar as datas."
                                compacto={true}
                                acao={{
                                    rotulo: "Limpar todos os filtros",
                                    aoClicar: () => {
                                        setBusca('');
                                        setFiltroModulo('');
                                        setFiltroAcao('');
                                        setDataInicio('');
                                        setDataFim('');
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
                            <tbody className="divide-y divide-border/40">
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
                                                            <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${info.bg} ${info.borda} ${info.cor}`}>
                                                                <Icone size={12} strokeWidth={2.5} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{info.label}</span>
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    <div className="flex-1 flex flex-col items-end">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[80px]">
                                                            {log.entidade_tipo || '—'}
                                                        </span>
                                                        <div className={`mt-1 p-1 rounded-lg transition-transform ${expandidoId === log.id ? 'rotate-180 bg-primary/10 text-primary' : 'text-slate-300'}`}>
                                                            <Activity size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandidoId === log.id && (
                                            <tr className="bg-slate-900/5 animate-in slide-in-from-top-2 duration-300">
                                                <td colSpan={5} className="px-6 py-4">
                                                    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner overflow-x-auto max-w-[calc(100vw-300px)]">
                                                        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Detalhes Técnicos (Payload)</span>
                                                            <span className="text-[10px] font-mono text-slate-600">ID: {log.id}</span>
                                                        </div>
                                                        <pre className="text-emerald-400 font-mono text-[12px] leading-relaxed selection:bg-emerald-500 selection:text-white">
                                                            {JSON.stringify(log, null, 4)}
                                                        </pre>
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
