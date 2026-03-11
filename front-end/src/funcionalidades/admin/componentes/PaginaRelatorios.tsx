import { useState } from 'react';
import { 
    FileText, 
    Users, 
    Download, 
    Network,
    Search,
    Calendar
} from 'lucide-react';
import { usarRelatorios } from '@/funcionalidades/admin/hooks/usarRelatorios';
import type { RelatorioFrequenciaMembro } from '@/funcionalidades/admin/hooks/usarRelatorios';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatarDataHora } from '@/utilitarios/formatadores';

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PaginaRelatorios() {
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    
    const { 
        equipesRelatorio, 
        frequenciaGeral, 
        frequenciaMembros, 
        carregando, 
        erro 
    } = usarRelatorios(dataInicio, dataFim);

    const [abaAtiva, setAbaAtiva] = useState<'geral' | 'equipes' | 'membros'>('geral');
    const [busca, setBusca] = useState('');

    const membrosFiltrados = (frequenciaMembros || []).filter(m => 
        m.nome.toLowerCase().includes(busca.toLowerCase()) || 
        m.email.toLowerCase().includes(busca.toLowerCase())
    );


    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700 pb-20">
                <CabecalhoFuncionalidade 
                    titulo="Relatórios Completos"
                    subtitulo="Análise estratégica de estrutura, frequência e engajamento."
                    icone={FileText}
                >
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all justify-center"
                    >
                        <Download className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Exportar / Imprimir</span>
                    </button>
                </CabecalhoFuncionalidade>

                {/* ── ACTION BAR (FILTROS E NAVEGAÇÃO COMPACTA) ── */}
                <div className="flex flex-col lg:flex-row items-center gap-3 bg-card p-2 border border-border rounded-[2rem] shadow-sm mb-6 w-full max-w-full overflow-x-auto">
                    {/* Pesquisa */}
                    <div className="flex-1 min-w-[200px] w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/30 rounded-full transition-colors border border-transparent hover:border-border/30">
                        <Search className="text-muted-foreground w-4 h-4 shrink-0" />
                        <input
                            type="text"
                            placeholder="Pesquisa global em relatórios..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            disabled={abaAtiva === 'geral'}
                            className="bg-transparent text-[13px] font-medium text-foreground w-full focus:outline-none placeholder:text-muted-foreground/40 disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                    </div>
                    
                    <div className="h-6 w-px bg-border/50 hidden lg:block shrink-0" />

                    {/* Datas */}
                    <div className="flex items-center justify-center gap-2 px-4 py-2 border border-border/40 bg-muted/10 rounded-full hover:bg-muted/30 transition-colors w-full lg:w-auto shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input 
                            type="date" 
                            title="Data Início"
                            value={dataInicio}
                            tabIndex={-1}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="bg-transparent text-[12px] font-bold text-muted-foreground hover:text-foreground focus:outline-none w-[105px] cursor-pointer color-scheme-dark"
                        />
                        <span className="text-[10px] font-black uppercase text-muted-foreground/30 mx-1">até</span>
                        <input 
                            type="date"
                            title="Data Fim"
                            value={dataFim}
                            tabIndex={-1}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="bg-transparent text-[12px] font-bold text-muted-foreground hover:text-foreground focus:outline-none w-[105px] cursor-pointer color-scheme-dark"
                        />
                    </div>

                    <div className="h-6 w-px bg-border/50 hidden lg:block shrink-0" />

                    {/* Tabs / Navegação Interna */}
                    <div className="flex p-1 bg-muted/30 border border-border/40 rounded-full shadow-inner shrink-0 w-full lg:w-auto overflow-x-auto custom-scrollbar">
                        {[
                            { id: 'geral', label: 'Visão Geral' },
                            { id: 'equipes', label: 'Equipes' },
                            { id: 'membros', label: 'Membros' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setAbaAtiva(tab.id as any)}
                                className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    abaAtiva === tab.id 
                                    ? 'bg-foreground text-background shadow-md scale-100' 
                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 scale-95 hover:scale-100'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {carregando && frequenciaMembros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] w-full mt-4">
                        <Carregando Centralizar={false} tamanho="lg" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Processando Estratégia...</span>
                    </div>
                ) : (
                    <>

                {erro && (
                    <Alerta tipo="erro" mensagem={erro} className="mb-4" />
                )}

                {/* ── SEÇÃO: GERAL ── */}
                {abaAtiva === 'geral' && frequenciaGeral && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Gráfico de Tendência */}
                        <div className="lg:col-span-8 bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-8">Tendência de Presença (30 dias)</h3>
                            <div className="h-[300px] w-full min-w-0">
                                {frequenciaGeral.tendencia && frequenciaGeral.tendencia.length > 0 ? (
                                    <ResponsiveContainer width="99%" height="100%">
                                        <LineChart data={frequenciaGeral.tendencia}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                            <XAxis 
                                                dataKey="data" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fontSize: 10, fill: '#64748b' }}
                                                tickFormatter={(val) => val.split('-')[2]} 
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }}
                                                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="total_presentes" 
                                                name="Presentes"
                                                stroke="#3b82f6" 
                                                strokeWidth={3}
                                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }} 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 border border-dashed border-border/20 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Sem registros no período.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Justificativas */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Status Justificativas</h3>
                                <div className="space-y-4">
                                    {frequenciaGeral.statusJustificativas.map((status, i) => (
                                        <div key={status.status} className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                                                <span className="text-xs font-bold uppercase tracking-wide text-foreground/80">{status.status}</span>
                                            </div>
                                            <span className="text-sm font-black">{status.total}</span>
                                        </div>
                                    ))}
                                    {frequenciaGeral.statusJustificativas.length === 0 && (
                                        <div className="text-center text-muted-foreground italic text-xs py-4 border border-border/10 rounded-2xl">Sem registros no período.</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Motivos de Ausência (Aprovados)</h3>
                                <div className="space-y-4">
                                    {frequenciaGeral.tiposJustificativas.map((tipo, i) => (
                                        <div key={tipo.tipo} className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border/10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CORES[(i + 3) % CORES.length] }} />
                                                <span className="text-xs font-bold uppercase tracking-wide text-foreground/80">{tipo.tipo}</span>
                                            </div>
                                            <span className="text-sm font-black">{tipo.total}</span>
                                        </div>
                                    ))}
                                    {frequenciaGeral.tiposJustificativas.length === 0 && (
                                        <div className="text-center text-muted-foreground italic text-xs py-4 border border-border/10 rounded-2xl">Sem justificativas aprovadas.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEÇÃO: EQUIPES ── */}
                {abaAtiva === 'equipes' && equipesRelatorio && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm relative">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                    <Network size={22} className="opacity-80"/>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Equipes Ativas</h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Estrutura organizacional (Nível 1)</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {equipesRelatorio.equipes.map((equipe) => (
                                    <div key={equipe.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 border border-border/40 rounded-2xl hover:bg-muted/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase tracking-widest text-xs">
                                                {equipe.nome.substring(0,2)}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-foreground leading-none mb-1.5">{equipe.nome}</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                    Líder: <span className="text-foreground/70">{equipe.lider_nome || 'Não definido'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center sm:justify-end gap-3 px-2 sm:px-0">
                                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background border border-border/30 w-16">
                                                <span className="text-sm font-black text-foreground leading-none mb-1">{equipe.total_membros}</span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Membros</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {equipesRelatorio.equipes.length === 0 && (
                                    <div className="py-8 text-center text-muted-foreground text-sm italic">Nenhuma equipe cadastrada.</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm relative">
                             <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                                    <Users size={22} className="opacity-80"/>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Grupos Internos</h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Subdivisões operacionais (Nível 2)</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {equipesRelatorio.grupos.map((grupo) => (
                                    <div key={grupo.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 border border-border/40 rounded-2xl hover:bg-muted/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 font-black uppercase tracking-widest text-xs">
                                                {grupo.nome.substring(0,2)}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-foreground leading-none mb-1.5">{grupo.nome}</p>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                                    Equipe: <span className="text-foreground/70">{grupo.equipe_nome || 'Não vinculado'}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center sm:justify-end px-2 sm:px-0">
                                            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background border border-border/30 w-16">
                                                <span className="text-sm font-black text-foreground leading-none mb-1">{grupo.total_membros}</span>
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Membros</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {equipesRelatorio.grupos.length === 0 && (
                                    <div className="py-8 text-center text-muted-foreground text-sm italic">Nenhum grupo cadastrado.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SEÇÃO: MEMBROS ── */}
                {abaAtiva === 'membros' && frequenciaMembros && (
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-8 shadow-sm overflow-hidden space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Análise de Frequência Individual</h3>

                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30">
                                        <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Membro</th>
                                        <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Alocação</th>
                                        <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Dias Presentes</th>
                                        <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Justificativas</th>
                                        <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Última Atividade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {membrosFiltrados.map((m: RelatorioFrequenciaMembro) => (
                                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary shrink-0">
                                                        {m.nome.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-bold text-foreground truncate max-w-[160px]">{m.nome}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[160px]">{m.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-[11px] font-black uppercase text-primary/60">{m.equipe_nome || 'Sem Equipe'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[150px]">{m.grupo_nome || 'Sem Grupo'}</p>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-lg text-xs font-black text-primary">
                                                    {m.dias_presentes}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className={`px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs font-black ${m.justificativas_aprovadas > 3 ? 'text-red-400' : 'text-amber-500'}`}>
                                                    {m.justificativas_aprovadas}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-right">
                                                <p className="text-xs font-bold text-foreground/70">
                                                    {m.ultima_batida ? formatarDataHora(m.ultima_batida) : 'Nenhum registro'}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    );
}
