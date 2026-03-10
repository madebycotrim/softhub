import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Users, Plus, Pencil, Trash2, UserCheck, Search, ChevronDown, Check } from 'lucide-react';
import { usarEquipes, type Grupo, type Equipe } from './usarEquipes';

type MembroSimples = {
    id: string;
    nome: string;
    email: string;
    role: string;
    foto_perfil: string | null;
    equipe_id: string | null;
    grupo_id: string | null;
    grupos_ids?: string | null;
};

import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';

// ─── Componentes Auxiliares ───────────────────────────────────────────────────

/**
 * Seletor customizado com busca interna para lidar com listas longas (membros/grupos/equipes).
 * Usa Portals para renderizar o menu fora do DOM da modal, evitando cortes por overflow.
 */
function SeletorBuscavel({
    label,
    valor,
    aoAlterar,
    opcoes,
    placeholderVazio,
    icone: Icone
}: {
    label: string,
    valor: string,
    aoAlterar: (v: string) => void,
    opcoes: { id: string, nome: string }[],
    placeholderVazio: string,
    icone?: any
}) {
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const filtradas = opcoes.filter(o => o.nome.toLowerCase().includes(busca.toLowerCase()));
    const selecionada = opcoes.find(o => o.id === valor);

    // Calcula a posição do menu em tempo real ao abrir
    useLayoutEffect(() => {
        if (aberto && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [aberto]);

    return (
        <div className="space-y-1.5 relative" ref={containerRef}>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</label>

            <div
                onClick={() => setAberto(!aberto)}
                className={`flex items-center justify-between w-full h-10 bg-background border border-border rounded-2xl px-4 cursor-pointer hover:border-primary/50 transition-all ${aberto ? 'ring-2 ring-primary/20 border-primary/50' : ''}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {Icone && <Icone size={14} className="text-muted-foreground/40 shrink-0" />}
                    <span className={`text-sm truncate ${!selecionada ? 'text-muted-foreground/40 italic' : 'text-foreground font-medium'}`}>
                        {selecionada?.nome ?? placeholderVazio}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground/40 transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`} />
            </div>

            {aberto && createPortal(
                <>
                    {/* Backdrop para fechar ao clicar fora - z-index alto para ficar sobre a modal */}
                    <div className="fixed inset-0 z-[100]" onClick={() => { setAberto(false); setBusca(''); }} />

                    <div
                        style={{
                            position: 'fixed',
                            top: coords.top + 8,
                            left: coords.left,
                            width: coords.width,
                        }}
                        className="bg-card border border-border rounded-2xl shadow-2xl z-[110] p-2 space-y-2 animate-in fade-in zoom-in-95 duration-200"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={12} />
                            <input
                                autoFocus
                                placeholder="Pesquisar..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full h-9 bg-muted/20 border border-border/50 rounded-2xl pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            <div
                                onClick={() => { aoAlterar(''); setAberto(false); setBusca(''); }}
                                className={`px-3 py-2 rounded-2xl text-xs cursor-pointer transition-colors ${!valor ? 'bg-primary/10 text-primary font-black' : 'hover:bg-muted text-muted-foreground/60'}`}
                            >
                                {placeholderVazio}
                            </div>

                            {filtradas.map(o => (
                                <div
                                    key={o.id}
                                    onClick={() => { aoAlterar(o.id); setAberto(false); setBusca(''); }}
                                    className={`px-3 py-2 rounded-2xl text-xs cursor-pointer transition-colors flex items-center justify-between ${valor === o.id ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted text-foreground/80'}`}
                                >
                                    <span className="truncate">{o.nome}</span>
                                    {valor === o.id && <div className="w-1 h-1 rounded-full bg-primary-foreground" />}
                                </div>
                            ))}

                            {filtradas.length === 0 && (
                                <div className="py-8 text-center">
                                    <p className="text-[10px] text-muted-foreground/30 uppercase font-black tracking-widest">Nenhum resultado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}


// ─── Modal de Alocação de Membros ─────────────────────────────────────────────

interface ModalAlocacaoProps {
    aberto: boolean;
    aoFechar: () => void;
    grupos: Grupo[];
    equipes: Equipe[];
    membros: MembroSimples[];
    aoAlocar: (membroId: string, equipeId: string | null, grupoId: string | null) => Promise<void>;
    grupoIdPadrao?: string;
    equipeIdPadrao?: string;
}

/**
 * Modal para alocar membros em grupos e equipes.
 * Redesenhado para ser mais intuitivo com seleção lateral.
 */
function ModalAlocacao({ aberto, aoFechar, grupos, equipes, membros, aoAlocar, grupoIdPadrao, equipeIdPadrao }: ModalAlocacaoProps) {
    const [membroId, setMembroId] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        if (aberto) {
            setMembroId('');
            setBusca('');
            setErro(null);
        }
    }, [aberto]);

    const membrosFiltrados = useMemo(() => 
        membros.filter(m =>
            m.nome.toLowerCase().includes(busca.toLowerCase()) ||
            m.email.toLowerCase().includes(busca.toLowerCase())
        ),
    [membros, busca]);

    const membroSelecionado = useMemo(() => 
        membros.find(m => m.id === membroId),
    [membros, membroId]);

    const handleAlocar = async () => {
        if (!membroId || !grupoIdPadrao || !equipeIdPadrao) return;
        setSalvando(true);
        setErro(null);
        try {
            await aoAlocar(membroId, equipeIdPadrao, grupoIdPadrao);
            setMembroId('');
            aoFechar();
        } catch {
            setErro('Não foi possível realizar a alocação.');
        } finally {
            setSalvando(false);
        }
    };


    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Alocar Membro" largura="lg">
            <div className="flex flex-col lg:flex-row gap-8 min-h-[400px]">
                {/* Lado Esquerdo: Seleção do Membro */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            placeholder="Buscar por nome ou e-mail..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>

                    <div className="flex-1 max-h-[450px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {membrosFiltrados.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMembroId(m.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${membroId === m.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar nome={m.nome} fotoPerfil={null} tamanho="sm" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{m.email}</p>
                                    </div>
                                </div>
                                {membroId === m.id && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><UserCheck className="text-white w-3 h-3" /></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Linha Vertical (desktop) */}
                <div className="hidden lg:block w-px bg-slate-100" />

                <div className="flex-1 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">Equipe (Comando)</p>
                                    <p className="text-base font-bold text-slate-900 tracking-tight">
                                        {equipes.find(e => e.id === equipeIdPadrao)?.nome || 'Equipe não encontrada'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 border border-indigo-50">
                                    <LayoutGrid size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">Grupo</p>
                                    <p className="text-base font-bold text-slate-900 tracking-tight">
                                        {grupos.find(g => g.id === grupoIdPadrao)?.nome || 'Grupo não encontrado'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {membroSelecionado && (
                            <div className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 leading-none">Status do Membro Selecionado</p>
                                <p className="text-xs text-slate-600">
                                    Atualmente vinculado à equipe <span className="font-extrabold text-slate-900">{equipes.find(e => e.id === membroSelecionado.equipe_id)?.nome || 'nenhuma equipe'}</span>.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 space-y-4">
                        {erro && <p className="text-destructive text-xs font-bold bg-destructive/5 p-3 rounded-2xl border border-destructive/10">{erro}</p>}

                        <div className="flex items-center gap-3">
                            <button type="button" onClick={aoFechar} className="flex-1 h-12 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAlocar}
                                disabled={salvando || !membroId}
                                className="flex-[2] h-12 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                {salvando ? <Carregando /> : (
                                    <>
                                        <UserCheck size={18} />
                                        Confirmar Destino
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// ─── Modal de Seleção de Líder ────────────────────────────────────────────────

function ModalSelecaoLider({ 
    aberto, 
    aoFechar, 
    membros, 
    aoConfirmar, 
    titulo,
    valorAtual,
    outroId,
    tipo
}: { 
    aberto: boolean, 
    aoFechar: () => void, 
    membros: MembroSimples[], 
    aoConfirmar: (mId: string) => Promise<void>, 
    titulo: string,
    valorAtual?: string | null,
    outroId?: string | null,
    tipo?: 'lider' | 'sub_lider'
}) {
    const [busca, setBusca] = useState('');
    const [salvando, setSalvando] = useState(false);

    const filtrados = useMemo(() => 
        membros.filter(m => 
            m.nome.toLowerCase().includes(busca.toLowerCase()) || 
            m.email.toLowerCase().includes(busca.toLowerCase())
        ),
    [membros, busca]);

    const handleSelecionar = async (id: string) => {
        setSalvando(true);
        try {
            await aoConfirmar(id);
            aoFechar();
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo}>
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        placeholder="Buscar membro..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {filtrados.map(m => {
                        const ehOutro = outroId === m.id;
                        const bloqueado = ehOutro && tipo === 'sub_lider';
                        
                        return (
                            <button
                                key={m.id}
                                onClick={() => !bloqueado && handleSelecionar(m.id)}
                                disabled={salvando || bloqueado}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group 
                                    ${valorAtual === m.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50'}
                                    ${bloqueado ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar nome={m.nome} fotoPerfil={m.foto_perfil} tamanho="sm" />
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{m.email}</p>
                                        {ehOutro && (
                                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tight mt-0.5">
                                                {tipo === 'lider' ? 'Atualmente Sub-líder' : 'Líder (Indisponível)'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`${valorAtual === m.id ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-all`}>
                                    <UserCheck size={16} className={valorAtual === m.id ? 'text-blue-600' : 'text-blue-400'} />
                                </div>
                            </button>
                        );
                    })}
                    {filtrados.length === 0 && (
                        <div className="py-10 text-center text-slate-300 font-medium uppercase text-[10px] tracking-widest">
                            Nenhum membro encontrado
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}


// ─── Componente: CardMembroFino ──────────────────────────────────────────────

function CardMembroFino({ membro, aoRemover }: { membro: MembroSimples, aoRemover: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-all group">
            <div className="flex items-center gap-3">
                <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="sm" />
                <div>
                    <p className="text-[11px] font-bold text-slate-900">{membro.nome}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{membro.email}</p>
                </div>
            </div>
            <button
                onClick={aoRemover}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all"
                title="Remover deste grupo"
            >
                <Plus size={14} className="rotate-45" />
            </button>
        </div>
    );
}

// ─── Componente: DetalheEquipe ────────────────────────────────────────────────

function DetalheEquipe({
    equipe,
    grupos,
    membros,
    aoExcluir,
    aoAdicionarGrupo,
    aoExcluirGrupo,
    aoAlocar,
    aoRemoverMembro,
    aoSelecionarLider,
    aoSalvarNomeGrupo,
    aoSalvarNomeEquipe
}: {
    equipe: Equipe,
    grupos: Grupo[],
    membros: MembroSimples[],
    aoExcluir: () => void,
    aoAdicionarGrupo: () => void,
    aoExcluirGrupo: (g: Grupo) => void,
    aoAlocar: (gId: string, eId: string) => void,
    aoRemoverMembro: (mId: string) => void,
    aoSelecionarLider: (tipo: 'lider' | 'sub_lider') => void,
    aoSalvarNomeGrupo: (id: string, nome: string) => Promise<void>,
    aoSalvarNomeEquipe: (id: string, nome: string) => Promise<void>
}) {
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editandoEquipe, setEditandoEquipe] = useState(false);
    const [nomeTemp, setNomeTemp] = useState('');
    const [salvandoInline, setSalvandoInline] = useState(false);

    const handleSalvarInline = async (id: string) => {
        if (!nomeTemp.trim() || salvandoInline) {
            setEditandoId(null);
            return;
        }
        setSalvandoInline(true);
        try {
            await aoSalvarNomeGrupo(id, nomeTemp);
            setEditandoId(null);
        } finally {
            setSalvandoInline(false);
        }
    };

    const handleSalvarEquipeInline = async () => {
        if (!nomeTemp.trim() || salvandoInline) {
            setEditandoEquipe(false);
            return;
        }
        setSalvandoInline(true);
        try {
            await aoSalvarNomeEquipe(equipe.id, nomeTemp);
            setEditandoEquipe(false);
        } finally {
            setSalvandoInline(false);
        }
    };

    const lider = useMemo(() => membros.find(m => m.id === equipe.lider_id), [membros, equipe.lider_id]);
    const subLider = useMemo(() => membros.find(m => m.id === equipe.sub_lider_id), [membros, equipe.sub_lider_id]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="shrink-0">
                {/* Header da Equipe */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                        <Users size={24} />
                    </div>
                    <div>
                        {editandoEquipe ? (
                            <div className="flex items-center gap-2">
                                <input
                                    autoFocus
                                    value={nomeTemp}
                                    onChange={e => setNomeTemp(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleSalvarEquipeInline();
                                        if (e.key === 'Escape') setEditandoEquipe(false);
                                    }}
                                    onBlur={() => handleSalvarEquipeInline()}
                                    className="bg-transparent border-b-2 border-slate-900 outline-none text-2xl font-bold text-slate-900 p-0 tracking-tight"
                                />
                                <div className="flex items-center gap-1">
                                    <button onClick={handleSalvarEquipeInline} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Salvar">
                                        <Check size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group/title">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{equipe.nome}</h2>
                                <button 
                                    onClick={() => {
                                        setEditandoEquipe(true);
                                        setNomeTemp(equipe.nome);
                                    }}
                                    className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-300 hover:text-slate-600 transition-all"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {equipe.total_membros} membros ativos na equipe
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={aoExcluir}
                        title="Arquivar esta equipe"
                        className="h-9 px-4 rounded-xl bg-white text-red-500/80 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-all border border-slate-200"
                    >
                        Excluir Equipe
                    </button>
                </div>
            </div>

            {/* Leadership Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div 
                    onClick={() => aoSelecionarLider('lider')}
                    className={`flex items-center gap-5 p-6 rounded-2xl border transition-all cursor-pointer group/lead ${equipe.lider_id ? 'bg-slate-50/50 border-slate-100 shadow-sm hover:border-blue-200' : 'bg-white border-dashed border-slate-200 hover:bg-slate-50'}`}
                >
                    <Avatar 
                        nome={equipe.lider_nome || '?'} 
                        fotoPerfil={lider?.foto_perfil} 
                        tamanho="md" 
                        className={!equipe.lider_id ? 'bg-slate-100 !text-slate-400' : 'ring-4 ring-white shadow-sm'}
                    />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5 leading-none">Líder</p>
                        <p className={`text-base font-bold tracking-tight ${equipe.lider_id ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                            {equipe.lider_nome || 'Clique para indicar'}
                        </p>
                    </div>
                </div>

                <div 
                    onClick={() => aoSelecionarLider('sub_lider')}
                    className={`flex items-center gap-5 p-6 rounded-2xl border transition-all cursor-pointer group/lead ${equipe.sub_lider_id ? 'bg-slate-50/50 border-slate-100 shadow-sm hover:border-blue-200' : 'bg-white border-dashed border-slate-200 hover:bg-slate-50'}`}
                >
                    <Avatar 
                        nome={equipe.sub_lider_nome || '?'} 
                        fotoPerfil={subLider?.foto_perfil} 
                        tamanho="md" 
                        className={!equipe.sub_lider_id ? 'bg-slate-100 !text-slate-400' : 'ring-4 ring-white shadow-sm'}
                    />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1.5 leading-none">Sub-Líder</p>
                        <p className={`text-base font-bold tracking-tight ${equipe.sub_lider_id ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                            {equipe.sub_lider_nome || 'Clique para indicar'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Side-by-Side Groups Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400/80">Grupos de Trabalho</h4>
                <button
                    onClick={aoAdicionarGrupo}
                    className="text-slate-400 hover:text-blue-600 font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1.5"
                >
                    <Plus size={14} /> Novo Grupo
                </button>
            </div>

            </div>

            {/* Scrollable Groups Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 custom-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {grupos.length === 0 ? (
                    <div className="col-span-full border-2 border-dashed border-slate-100 rounded-2xl p-16 text-center">
                        <p className="text-slate-400 font-medium mb-4">Nenhum grupo configurado para esta equipe.</p>
                        <button onClick={aoAdicionarGrupo} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md">Criar Primeiro Grupo</button>
                    </div>
                ) : (
                    grupos.map(g => {
                        const partes = g.nome.trim().split(/\s+/);
                        const devePularPrimeira = partes.length > 1 && /^(grupo|grupos)$/i.test(partes[0]);
                        const inicial = devePularPrimeira ? partes[1].charAt(0).toUpperCase() : partes[0].charAt(0).toUpperCase();

                        return (
                            <div key={g.id} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 flex flex-col h-full min-h-[400px] shadow-sm hover:shadow-md transition-all overflow-hidden">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 flex items-center justify-center font-bold text-lg">
                                            {inicial}
                                        </div>
                                        <div className="flex-1">
                                            {editandoId === g.id ? (
                                                <input
                                                    autoFocus
                                                    value={nomeTemp}
                                                    onChange={e => setNomeTemp(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleSalvarInline(g.id);
                                                        if (e.key === 'Escape') setEditandoId(null);
                                                    }}
                                                    onBlur={() => handleSalvarInline(g.id)}
                                                    className="w-full bg-transparent border-b-2 border-slate-900 outline-none text-lg font-bold text-slate-900 p-0 tracking-tight"
                                                    disabled={salvandoInline}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 group/title">
                                                    <h5 className="text-lg font-bold text-slate-900 tracking-tight">{g.nome}</h5>
                                                    <button 
                                                        onClick={() => {
                                                            setEditandoId(g.id);
                                                            setNomeTemp(g.nome);
                                                        }}
                                                        className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-300 hover:text-slate-600 transition-all"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {editandoId === g.id ? (
                                            <button onClick={() => handleSalvarInline(g.id)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Confirmar">
                                                <Check size={18} strokeWidth={2.5} />
                                            </button>
                                        ) : (
                                            <button onClick={() => aoExcluirGrupo(g)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    {(() => {
                                        const membrosDoGrupo = membros.filter(m => {
                                            const ids = m.grupos_ids ? m.grupos_ids.split(',') : [];
                                            return ids.includes(g.id);
                                        });
                                        return (
                                            <>
                                                <div className="flex items-center justify-between mb-3 px-1">
                                                    <h6 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                                        Pessoas ({membrosDoGrupo.length})
                                                    </h6>
                                                    <button onClick={() => aoAlocar(g.id, equipe.id)} className="w-8 h-8 rounded-xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-2 custom-scrollbar">
                                                    {membrosDoGrupo.map(membro => (
                                                        <CardMembroFino key={membro.id} membro={membro} aoRemover={() => aoRemoverMembro(membro.id)} />
                                                    ))}
                                                    {membrosDoGrupo.length === 0 && (
                                                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/40 rounded-2xl bg-white/50 my-2">
                                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Vazio</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        );
                    })
                )}
                </div>
            </div>
        </div>
    );
}

// ─── Componente Principal: GerenciarOrganizacao ───────────────────────────────

export function GerenciarEquipes() {
    const {
        grupos, equipes, membros, carregando, erro,
        criarGrupo, editarGrupo, desativarGrupo,
        criarEquipe, editarEquipe, desativarEquipe,
        alocarMembro
    } = usarEquipes();

    const [idEquipeAtiva, setIdEquipeAtiva] = useState<string | null>(null);
    const [modalOrg, setModalOrg] = useState<{ aberto: boolean; tipo: 'equipe' | 'grupo'; dados?: any } | null>(null);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{ id: string; nome: string; tipo: 'equipe' | 'grupo' } | null>(null);
    const [modalAlocacao, setModalAlocacao] = useState<{ grupoId: string; equipeId: string } | null>(null);
    const [modalLider, setModalLider] = useState<{ aberto: boolean; tipo: 'lider' | 'sub_lider' } | null>(null);
    const [desativando, setDesativando] = useState(false);

    // Selecionar primeira equipe por padrão
    useEffect(() => {
        if (!idEquipeAtiva && equipes.length > 0) {
            setIdEquipeAtiva(equipes[0].id);
        }
    }, [equipes, idEquipeAtiva]);

    // Otimização: Memoização de dados derivados
    const equipeAtiva = useMemo(() => 
        equipes.find(e => e.id === idEquipeAtiva),
    [equipes, idEquipeAtiva]);

    const gruposDaEquipe = useMemo(() => 
        grupos.filter(g => g.equipe_id === idEquipeAtiva && g.ativo),
    [grupos, idEquipeAtiva]);

    const equipesAtivas = useMemo(() => 
        equipes.filter(e => e.ativo),
    [equipes]);

    const handleSalvarOrg = useCallback(async (dados: any) => {
        if (!modalOrg) return;
        setDesativando(true);
        try {
            if (modalOrg.tipo === 'grupo') {
                await criarGrupo(dados);
            } else {
                await criarEquipe(dados);
            }
            setModalOrg(null);
        } catch (error) {
            console.error("Erro ao salvar:", error);
        } finally {
            setDesativando(false);
        }
    }, [modalOrg, criarGrupo, criarEquipe]);

    const handleConfirmarExclusao = useCallback(async () => {
        if (!confirmacaoExclusao) return;
        setDesativando(true);
        try {
            if (confirmacaoExclusao.tipo === 'grupo') {
                await desativarGrupo(confirmacaoExclusao.id);
            } else {
                await desativarEquipe(confirmacaoExclusao.id);
            }
        } catch (error) {
            console.error("Erro ao desativar:", error);
        } finally {
            setDesativando(false);
            setConfirmacaoExclusao(null);
        }
    }, [confirmacaoExclusao, desativarGrupo, desativarEquipe]);

    const handleDefinirLider = useCallback(async (membroId: string) => {
        if (!modalLider || !idEquipeAtiva || !equipeAtiva) return;
        
        const isLider = modalLider.tipo === 'lider';
        const payload: any = {};

        if (isLider) {
            if (equipeAtiva.lider_id === membroId) {
                payload.lider_id = null;
            } else {
                payload.lider_id = membroId;
                if (equipeAtiva.sub_lider_id === membroId) {
                    payload.sub_lider_id = null;
                }
            }
        } else {
            if (equipeAtiva.lider_id === membroId) {
                return;
            }

            if (equipeAtiva.sub_lider_id === membroId) {
                payload.sub_lider_id = null;
            } else {
                payload.sub_lider_id = membroId;
            }
        }

        try {
            await editarEquipe(idEquipeAtiva, payload);
            setModalLider(null);
        } catch (err) {
            console.error('Erro ao definir liderança:', err);
        }
    }, [modalLider, idEquipeAtiva, equipeAtiva, editarEquipe]);

    if (carregando && equipes.length === 0) return <div className="h-screen flex items-center justify-center"><Carregando /></div>;
    if (erro && equipes.length === 0) return <div className="p-20 text-center text-red-500 font-bold">{erro}</div>;

    return (
        <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-48px)] flex flex-col overflow-hidden px-0">
            <CabecalhoFuncionalidade
                titulo="Gestão de Equipes"
                subtitulo="Organize a estrutura de comando e os grupos de participação da equipe."
                icone={LayoutGrid}
                variante="destaque"
            >
                <button
                    onClick={() => setModalOrg({ aberto: true, tipo: 'equipe' })}
                    className="h-11 px-5 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 uppercase tracking-widest"
                >
                    <Plus size={18} />
                    <span>Nova Equipe</span>
                </button>
            </CabecalhoFuncionalidade>

            <div className="flex-1 flex overflow-hidden py-6 gap-6">
                {/* Sidebar: Lista de Equipes */}
                <aside className="w-72 hidden lg:flex flex-col shrink-0">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">EQUIPES ({equipes.length})</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                            {equipesAtivas.map((e: Equipe) => (
                                <button
                                    key={e.id}
                                    onClick={() => setIdEquipeAtiva(e.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group border ${idEquipeAtiva === e.id ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                                >
                                    <p className={`font-bold text-base tracking-tight transition-colors ${idEquipeAtiva === e.id ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>{e.nome}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">
                                            {e.total_membros || 0} Membros
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {equipes.length === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhuma equipe</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Detalhe da Equipe Selecionada */}
                <main className="flex-1 flex flex-col min-w-0">
                    {equipeAtiva ? (
                        <DetalheEquipe
                            key={equipeAtiva.id}
                            equipe={equipeAtiva}
                            grupos={gruposDaEquipe}
                            membros={membros}
                            aoExcluir={() => setConfirmacaoExclusao({ id: equipeAtiva.id, nome: equipeAtiva.nome, tipo: 'equipe' })}
                            aoAdicionarGrupo={() => setModalOrg({ aberto: true, tipo: 'grupo', dados: { equipe_id: idEquipeAtiva } })}
                            aoExcluirGrupo={(g) => setConfirmacaoExclusao({ id: g.id, nome: g.nome, tipo: 'grupo' })}
                            aoAlocar={(gId, eId) => setModalAlocacao({ grupoId: gId, equipeId: eId })}
                            aoRemoverMembro={(mId) => alocarMembro(mId, equipeAtiva.id, null)}
                            aoSelecionarLider={(tipo) => setModalLider({ aberto: true, tipo })}
                            aoSalvarNomeGrupo={async (id, nome) => { await editarGrupo(id, { nome }); }}
                            aoSalvarNomeEquipe={async (id, nome) => { await editarEquipe(id, { nome }); }}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-2xl p-20 text-center">
                            <div className="w-24 h-24 rounded-2xl bg-slate-50 text-slate-200 flex items-center justify-center mb-6 border border-slate-100">
                                <Users size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Selecione uma Equipe</h3>
                            <p className="text-slate-400 font-medium max-w-xs mx-auto">Navegue pelas equipes na barra lateral para gerenciar grupos e lideranças.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Modais */}
            {modalOrg && (
                <Modal
                    aberto={modalOrg.aberto}
                    aoFechar={() => setModalOrg(null)}
                    titulo={`Novo(a) ${modalOrg.tipo === 'equipe' ? 'Equipe' : 'Grupo'}`}
                >
                    <FormGrupoEquipe
                        titulo={modalOrg.tipo === 'equipe' ? 'Equipe' : 'Grupo'}
                        tipo={modalOrg.tipo}
                        equipeAtivaId={modalOrg.dados?.equipe_id}
                        equipes={equipes.map(e => ({ id: e.id, nome: e.nome }))}
                        aoSalvar={handleSalvarOrg}
                        aoFechar={() => setModalOrg(null)}
                    />
                </Modal>
            )}

            <ConfirmacaoExclusao
                aberto={!!confirmacaoExclusao}
                aoFechar={() => setConfirmacaoExclusao(null)}
                aoConfirmar={handleConfirmarExclusao}
                titulo={`Excluir ${confirmacaoExclusao?.tipo === 'grupo' ? 'Grupo' : 'Equipe'}?`}
                descricao="Esta ação arquiva o registro. Os membros não perdem seus acessos, mas sua alocação fixa será removida."
                carregando={desativando}
            />

            <ModalAlocacao
                aberto={!!modalAlocacao}
                aoFechar={() => setModalAlocacao(null)}
                grupos={grupos}
                equipes={equipesAtivas}
                membros={membros}
                aoAlocar={alocarMembro}
                grupoIdPadrao={modalAlocacao?.grupoId}
                equipeIdPadrao={modalAlocacao?.equipeId}
            />

            <ModalSelecaoLider
                aberto={!!modalLider?.aberto}
                aoFechar={() => setModalLider(null)}
                membros={membros}
                aoConfirmar={handleDefinirLider}
                titulo={modalLider?.tipo === 'lider' ? 'Definir Líder' : 'Definir Sub-líder'}
                valorAtual={modalLider?.tipo === 'lider' ? equipeAtiva?.lider_id : equipeAtiva?.sub_lider_id}
                outroId={modalLider?.tipo === 'lider' ? equipeAtiva?.sub_lider_id : equipeAtiva?.lider_id}
                tipo={modalLider?.tipo}
            />
        </div>
    );
}

// ─── Componente Interno: FormGrupoEquipe ──────────────────────────────────────

interface FormGrupoEquipeProps {
    titulo: string;
    tipo: 'equipe' | 'grupo';
    equipes?: { id: string; nome: string }[];
    equipeAtivaId?: string;
    aoSalvar: (dados: any) => Promise<void>;
    aoFechar: () => void;
}

function FormGrupoEquipe({ titulo, tipo, equipes, equipeAtivaId, aoSalvar, aoFechar }: FormGrupoEquipeProps) {
    const [salvando, setSalvando] = useState(false);
    const [nome, setNome] = useState('');
    const [equipeId, setEquipeId] = useState(equipeAtivaId || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        try {
            const dados = tipo === 'equipe'
                ? { nome }
                : { nome, equipe_id: equipeId || null };
            await aoSalvar(dados);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nome {tipo === 'equipe' ? 'da Equipe' : 'do Grupo'}</label>
                    <input
                        required
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder={tipo === 'equipe' ? `Ex: Equipe ${titulo}` : `Ex: Grupo ${titulo}`}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>

                {tipo === 'grupo' && equipes && (
                    <SeletorBuscavel
                        label="Equipe (Comando Superior)"
                        valor={equipeId}
                        aoAlterar={setEquipeId}
                        opcoes={equipes}
                        placeholderVazio="Selecione a equipe..."
                        icone={Users}
                    />
                )}

            </div>

            <div className="flex gap-3 pt-4">
                <button type="button" onClick={aoFechar} className="flex-1 h-12 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={salvando || !nome.trim()}
                    className="flex-[2] h-12 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center uppercase tracking-widest"
                >
                    {salvando ? <Carregando /> : `Criar ${titulo}`}
                </button>
            </div>
        </form>
    );
}
