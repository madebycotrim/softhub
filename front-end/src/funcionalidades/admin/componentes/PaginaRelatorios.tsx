import { useState, useMemo, memo } from 'react';
import { 
    FileText, 
    Network,
    Users as UsersIcon,
    Search,
    Calendar,
    Activity,
    ClipboardList,
    Printer,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    TrendingUp,
    LayoutGrid,
    ArrowUpRight,
    Zap,
    ArrowRight,
    Map,
    BarChart4,
    AlertCircle,
    UserCheck,
    FileSearch
} from 'lucide-react';
import { usarRelatorios } from '@/funcionalidades/admin/hooks/usarRelatorios';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

/**
 * Pagina de Relatórios - Versão Relatórios Essenciais e Estruturados.
 * Focada em 4 pilares fundamentais: Frequência, Justificativas, Alocação e Desempenho.
 */
const PaginaRelatorios = memo(() => {
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [abaAtiva, setAbaAtiva] = useState<'presenca' | 'justificativas' | 'equipes' | 'alunos'>('presenca');
    
    const { 
        equipesRelatorio, 
        frequenciaGeral, 
        frequenciaMembros, 
        carregando, 
        erro,
        recarregar 
    } = usarRelatorios(dataInicio, dataFim);

    const [busca, setBusca] = useState('');

    const membrosFiltrados = useMemo(() => {
        return (frequenciaMembros || []).filter((m: any) => 
            m.nome.toLowerCase().includes(busca.toLowerCase()) || 
            m.email.toLowerCase().includes(busca.toLowerCase())
        );
    }, [frequenciaMembros, busca]);

    // Relatórios Essenciais Definidos
    const ABAS_ESSENCIAIS = useMemo(() => [
        { id: 'presenca', label: 'Consolidado de Presenças', icone: BarChart4, info: 'Visão volumétrica e tendências diárias.' },
        { id: 'justificativas', label: 'Controle de Ausências', icone: ClipboardList, info: 'Gestão de justificativas e motivos de falta.' },
        { id: 'alunos', label: 'Auditoria de Membros', icone: UserCheck, info: 'Frequência individual e status de engajamento.' },
        { id: 'equipes', label: 'Mapeamento Estrutural', icone: Map, info: 'Organização de equipes e grupos operativos.' },
    ], []);

    return (
        <div className="w-full space-y-8 pb-20 animate-in fade-in duration-700 max-w-[1600px] mx-auto px-4 sm:px-6">
            {/* Cabeçalho Original (Não Alterar conforme Regra) */}
            <CabecalhoFuncionalidade 
                titulo="Central de Relatórios Essenciais"
                subtitulo="Acesse as métricas fundamentais para monitoramento e tomada de decisão estratégica."
                icone={FileSearch}
            />

            {/* Filtros e Seleção de Relatório Essencial */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Seletor de Relatórios (Esquerda) */}
                <div className="lg:col-span-1 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Relatórios Disponíveis</p>
                    {ABAS_ESSENCIAIS.map((aba) => (
                        <button
                            key={aba.id}
                            onClick={() => setAbaAtiva(aba.id as any)}
                            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] border transition-all text-left group ${
                                abaAtiva === aba.id 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
                            }`}
                        >
                            <div className={`p-3 rounded-2xl ${abaAtiva === aba.id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 transition-colors'}`}>
                                <aba.icone size={20} />
                            </div>
                            <div>
                                <p className={`text-xs font-black uppercase tracking-widest leading-none ${abaAtiva === aba.id ? 'text-white' : 'text-slate-800'}`}>
                                    {aba.label}
                                </p>
                                <p className={`text-[10px] mt-1 font-medium ${abaAtiva === aba.id ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                    {aba.info}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Conteúdo do Relatório Selecionado (Direita) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Barra de Período e Ações Integrada */}
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                            <div className="flex items-center gap-3 bg-white px-5 py-3 border border-slate-200 rounded-2xl shadow-sm w-full sm:w-auto">
                                <Calendar size={16} className="text-slate-400" />
                                <div className="flex items-center gap-2">
                                    <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-transparent border-none text-xs font-black text-slate-900 p-0 focus:ring-0" title="Data Inicial" />
                                    <span className="text-[10px] font-black text-slate-300">➔</span>
                                    <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-transparent border-none text-xs font-black text-slate-900 p-0 focus:ring-0" title="Data Final" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                    <Printer size={18} />
                                </button>
                                <button onClick={recarregar} disabled={carregando} className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 min-w-[200px]">
                                    <Activity size={18} className={carregando ? 'animate-spin' : ''} />
                                    <span>{carregando ? 'GERANDO...' : 'GERAR RELATÓRIO'}</span>
                                </button>
                            </div>
                        </div>
                        
                        {abaAtiva === 'alunos' && (
                            <div className="relative w-full xl:w-72 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-14 pr-6 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
                                />
                            </div>
                        )}
                    </div>

                    {erro && <Alerta tipo="erro" mensagem={erro} />}

                    {carregando && frequenciaMembros.length === 0 ? (
                        <div className="py-40 flex flex-col items-center justify-center bg-white border border-slate-100 rounded-[3rem] shadow-sm">
                            <Carregando tamanho="lg" />
                            <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Sincronizando Banco de Dados D1</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            
                            {/* ── RELATÓRIO: CONSOLIDADO DE PRESENÇAS ── */}
                            {abaAtiva === 'presenca' && frequenciaGeral && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 uppercase">Tendência de Atividade</h3>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Gráfico de volume de presenças registradas</p>
                                            </div>
                                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]"><TrendingUp size={24} /></div>
                                        </div>
                                        <div className="h-[380px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={frequenciaGeral.tendencia}>
                                                    <defs>
                                                        <linearGradient id="gradEssencial" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="5 5" stroke="#f1f5f9" vertical={false} />
                                                    <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(v) => v.split('-').reverse().slice(0, 2).join('/')} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                    <RechartsTooltip contentStyle={{ border: 'none', borderRadius: '20px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                                    <Area type="monotone" dataKey="total_presentes" stroke="#4f46e5" strokeWidth={5} fill="url(#gradEssencial)" animationDuration={1500} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shadow-slate-200">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Métricas do Período</h4>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[32px] font-black leading-none mb-1">{(frequenciaGeral.tendencia || []).reduce((acc, curr) => acc + curr.total_presentes, 0)}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Presentes</p>
                                                </div>
                                                <div>
                                                    <p className="text-[32px] font-black leading-none mb-1">{(frequenciaGeral.tendencia?.length || 0)}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dias Mapeados</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm flex items-center gap-6">
                                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-[1.8rem] flex items-center justify-center"><AlertCircle size={32} /></div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase leading-none">Justificativas Pendentes</p>
                                                <p className="text-3xl font-black text-amber-500 mt-2">{(frequenciaGeral.justificativasLista || []).filter(j => j.status === 'pendente').length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── RELATÓRIO: CONTROLE DE AUSÊNCIAS ── */}
                            {abaAtiva === 'justificativas' && frequenciaGeral && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Painel de Auditoria de Justificativas</h3>
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ClipboardList size={18} /></div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50/50">
                                                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro</th>
                                                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo Técnico</th>
                                                        <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Atual</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {(frequenciaGeral.justificativasLista || []).map((j) => (
                                                        <tr key={j.id} className="hover:bg-slate-50/50 transition-all group">
                                                            <td className="px-10 py-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-2xl font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                        {j.usuario_nome.charAt(0)}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <p className="text-xs font-black text-slate-800 uppercase">{j.usuario_nome}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400">{formatarDataHora(j.criado_em)}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6">
                                                                <div className="space-y-0.5">
                                                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{j.tipo}</p>
                                                                    <p className="text-[11px] text-slate-500 font-medium italic truncate max-w-[300px]">"{j.descricao || 'Sem declaração técnica'}"</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6 text-right">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl border ${
                                                                    j.status === 'aprovada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                                    j.status === 'rejeitada' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                                }`}>
                                                                    {j.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(frequenciaGeral.justificativasLista || []).length === 0 && (
                                                        <tr>
                                                            <td colSpan={3} className="py-24 text-center">
                                                                <div className="text-slate-300 space-y-2">
                                                                    <ClipboardList size={40} className="mx-auto opacity-20" />
                                                                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── RELATÓRIO: AUDITORIA DE MEMBROS ── */}
                            {abaAtiva === 'alunos' && frequenciaMembros && (
                                <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                                    <div className="p-10 border-b border-slate-50 bg-slate-50/10">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Histórico Técnico de Assiduidade</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Conferência individual detalhada de cada membro ativo.</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro</th>
                                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe / Cargo</th>
                                                    <th className="px-10 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessões</th>
                                                    <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Último Acesso</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-nowrap">
                                                {membrosFiltrados.map((m: any) => (
                                                    <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 flex items-center justify-center font-black text-slate-400 text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                    {m.nome.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{m.nome}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold">{m.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{m.equipe_nome || 'Liderança'}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.grupo_nome || 'Geral'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-8 text-center">
                                                            <span className="text-2xl font-black text-slate-900 leading-none">{m.dias_presentes}</span>
                                                        </td>
                                                        <td className="px-10 py-8 text-right">
                                                            <p className="text-[11px] font-black text-slate-600">
                                                                {m.ultima_batida ? formatarDataHora(m.ultima_batida).split('às')[0] : '--'}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400">{m.ultima_batida ? formatarDataHora(m.ultima_batida).split('às')[1] : ''}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* ── RELATÓRIO: MAPEAMENTO ESTRUTURAL ── */}
                            {abaAtiva === 'equipes' && equipesRelatorio && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start px-2">
                                    <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                                        <div className="p-8 border-b border-slate-50 bg-indigo-50/10 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Mapa de Equipes</h3>
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Network size={18} /></div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {equipesRelatorio.equipes?.map((e) => (
                                                <div key={e.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                                <Network size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{e.nome}</p>
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Responsável: {e.lider_nome || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                                            <p className="text-lg font-black text-slate-900 leading-none">{e.total_membros}</p>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase mt-0.5">Time</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                                        <div className="p-8 border-b border-slate-50 bg-emerald-50/10 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Grupos Operativos</h3>
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><UsersIcon size={18} /></div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            {equipesRelatorio.grupos?.map((g) => (
                                                <div key={g.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{g.nome}</p>
                                                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight">Vínculo: {g.equipe_nome || '--'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white px-5 py-2 rounded-xl border border-slate-100 shadow-sm">
                                                        <p className="text-base font-black text-slate-900">{g.total_membros}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default PaginaRelatorios;
