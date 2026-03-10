import { useState, useRef, useLayoutEffect, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Users, Plus, Pencil, Trash2, UserCheck, Search, ChevronDown, Check, ArrowRightLeft } from 'lucide-react';
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
                        className="bg-card border border-border rounded-2xl shadow-lg z-[110] p-2 space-y-2 animate-in fade-in zoom-in-95 duration-200"
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
function ModalAlocacao({ aberto, aoFechar, grupos, membros, aoAlocar, grupoIdPadrao, equipeIdPadrao }: ModalAlocacaoProps) {
    const [selecionados, setSelecionados] = useState<string[]>([]);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        if (aberto) {
            setSelecionados([]);
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

    const toggleSelecionado = (id: string) => {
        setSelecionados(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelecionarTudo = () => {
        const disponiveis = membrosFiltrados.filter(m => !(m.grupos_ids?.split(',') || []).includes(grupoIdPadrao || ''));
        if (selecionados.length === disponiveis.length) {
            setSelecionados([]);
        } else {
            setSelecionados(disponiveis.map(m => m.id));
        }
    };

    const handleAlocar = async () => {
        if (selecionados.length === 0 || !grupoIdPadrao || !equipeIdPadrao) return;
        setSalvando(true);
        setErro(null);
        try {
            await Promise.all(selecionados.map(id => aoAlocar(id, equipeIdPadrao, grupoIdPadrao)));
            setSelecionados([]);
            aoFechar();
        } catch {
            setErro('Não foi possível realizar a alocação de alguns membros.');
        } finally {
            setSalvando(false);
        }
    };

    const grupoNome = useMemo(() => grupos.find(g => g.id === grupoIdPadrao)?.nome, [grupos, grupoIdPadrao]);
    
    return (
        <Modal 
            aberto={aberto} 
            aoFechar={aoFechar} 
            titulo={grupoNome ? `Vincular ao ${grupoNome}` : "Alocar Membro"} 
            largura="md"
        >
            <div className="flex flex-col gap-6">
                {erro && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-600 uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300">
                        {erro}
                    </div>
                )}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={16} />
                            <input
                                autoFocus
                                placeholder="Buscar por nome ou e-mail..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {selecionados.length} selecionados
                            </p>
                            <button 
                                onClick={handleSelecionarTudo}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                            >
                                {selecionados.length > 0 ? 'Limpar Seleção' : 'Selecionar Tudo'}
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                        {membrosFiltrados.map(m => {
                            const jaVinculado = (m.grupos_ids?.split(',') || []).includes(grupoIdPadrao || '');
                            const selecionado = selecionados.includes(m.id);
                            
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => !jaVinculado && toggleSelecionado(m.id)}
                                    disabled={jaVinculado}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group
                                        ${selecionado ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}
                                        ${jaVinculado ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Avatar nome={m.nome} fotoPerfil={m.foto_perfil} tamanho="md" className={selecionado ? 'ring-2 ring-blue-200' : ''} />
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate transition-colors ${selecionado ? 'text-blue-900' : 'text-slate-900'}`}>{m.nome}</p>
                                            <p className="text-[11px] text-slate-400 font-medium truncate">{m.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="shrink-0 pl-2">
                                        {jaVinculado ? (
                                            <div className="bg-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Vinculado</div>
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                                ${selecionado ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-200 group-hover:border-blue-300'}
                                            `}>
                                                <div className={`w-2 h-2 rounded-full bg-white transition-all ${selecionado ? 'scale-100' : 'scale-0'}`} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}

                        {membrosFiltrados.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                <Search size={32} className="mb-4 text-slate-300" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhum membro encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                    <button 
                        type="button" 
                        onClick={aoFechar} 
                        className="w-full sm:w-auto px-6 h-12 text-[10px] font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest"
                    >
                        CANCELAR
                    </button>
                    <button
                        type="button"
                        onClick={handleAlocar}
                        disabled={salvando || selecionados.length === 0}
                        className="w-full sm:flex-1 h-12 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-sm hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 group px-4 uppercase tracking-widest"
                    >
                        {salvando ? <Carregando /> : (
                            <>
                                <span>VINCULAR {selecionados.length > 1 ? `${selecionados.length} MEMBROS` : 'MEMBRO'}</span>
                                <UserCheck size={18} className="group-hover:rotate-12 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Modal de Movimentação de Membros ─────────────────────────────────────────

interface ModalMovimentacaoProps {
    aberto: boolean;
    aoFechar: () => void;
    membro: MembroSimples | null;
    grupos: Grupo[];
    equipeId: string;
    aoMover: (membroId: string, equipeId: string, grupoDestinoId: string) => Promise<void>;
}

function ModalMovimentacao({ aberto, aoFechar, membro, grupos, equipeId, aoMover }: ModalMovimentacaoProps) {
    const [grupoDestinoId, setGrupoDestinoId] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (aberto) {
            setGrupoDestinoId('');
        }
    }, [aberto]);

    const handleMover = async () => {
        if (!membro || !grupoDestinoId) return;
        setSalvando(true);
        try {
            await aoMover(membro.id, equipeId, grupoDestinoId);
            aoFechar();
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Mover para outro Grupo" largura="sm">
            <div className="space-y-6">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Avatar nome={membro?.nome || ''} fotoPerfil={membro?.foto_perfil || null} tamanho="md" />
                    <div>
                        <p className="text-sm font-bold text-slate-900">{membro?.nome}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{membro?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <SeletorBuscavel
                        label="Grupo de Destino"
                        valor={grupoDestinoId}
                        aoAlterar={setGrupoDestinoId}
                        opcoes={grupos.map(g => ({ id: g.id, nome: g.nome }))}
                        placeholderVazio="Selecione o grupo..."
                        icone={LayoutGrid}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-slate-100">
                    <button type="button" onClick={aoFechar} className="w-full sm:flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
                        CANCELAR
                    </button>
                    <button
                        onClick={handleMover}
                        disabled={salvando || !grupoDestinoId}
                        className="w-full sm:flex-[2] h-12 bg-blue-600 text-white rounded-2xl text-[10px] font-black shadow-md hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {salvando ? <Carregando /> : (
                            <>
                                <span>Mover Agora</span>
                                <ArrowRightLeft size={16} />
                            </>
                        )}
                    </button>
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
        <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="auto">
            <div className="space-y-6">
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={16} />
                    <input
                        autoFocus
                        placeholder="Pesquisar por nome ou e-mail..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none transition-all"
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                    {filtrados.map(m => {
                        const ehOutro = outroId === m.id;
                        const bloqueado = ehOutro && tipo === 'sub_lider';
                        const selecionado = valorAtual === m.id;
                        
                        return (
                            <button
                                key={m.id}
                                onClick={() => !bloqueado && handleSelecionar(m.id)}
                                disabled={salvando || bloqueado}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group 
                                    ${selecionado ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}
                                    ${bloqueado ? 'opacity-50 cursor-not-allowed grayscale bg-slate-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar nome={m.nome} fotoPerfil={m.foto_perfil} tamanho="md" className={selecionado ? 'ring-2 ring-blue-200' : ''} />
                                    <div>
                                        <p className={`text-sm font-bold transition-colors ${selecionado ? 'text-blue-900' : 'text-slate-900'}`}>{m.nome}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">{m.email}</p>
                                        {ehOutro && (
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                                {tipo === 'lider' ? 'Atualmente Sub-líder' : 'Líder (Indisponível)'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`shrink-0 transition-all ${selecionado ? 'scale-110 opacity-100' : 'opacity-0 group-hover:opacity-40 scale-75'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selecionado ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        <UserCheck size={14} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {filtrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <Search size={32} className="mb-4 text-slate-300" />
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhum membro encontrado</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}


// ─── Componente: CardMembroFino ──────────────────────────────────────────────

function CardMembroFino({ membro, aoRemover, aoMover }: { membro: MembroSimples, aoRemover: () => void, aoMover: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-all group">
            <div className="flex items-center gap-3">
                <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="sm" />
                <div>
                    <p className="text-[11px] font-bold text-slate-900">{membro.nome}</p>
                    <p className="text-[9px] text-slate-400 font-medium truncate max-w-[120px]">{membro.email}</p>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    onClick={aoMover}
                    className="p-1.5 text-slate-300 hover:text-blue-500 transition-all"
                    title="Mover para outro grupo"
                >
                    <ArrowRightLeft size={14} />
                </button>
                <button
                    onClick={aoRemover}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                    title="Remover deste grupo"
                >
                    <Plus size={14} className="rotate-45" />
                </button>
            </div>
        </div>
    );
}

// ─── Componente: DetalheEquipe ────────────────────────────────────────────────

function DetalheEquipe({
    equipe,
    grupos,
    membros,
    aoAdicionarGrupo,
    aoExcluirGrupo,
    aoAlocar,
    aoRemoverMembro,
    aoMoverMembro,
    aoSelecionarLider,
    aoSalvarNomeGrupo,
    aoSalvarNomeEquipe
}: {
    equipe: Equipe,
    grupos: Grupo[],
    membros: MembroSimples[],
    aoAdicionarGrupo: () => void,
    aoExcluirGrupo: (g: Grupo) => void,
    aoAlocar: (gId: string, eId: string) => void,
    aoRemoverMembro: (mId: string) => void,
    aoMoverMembro: (mId: string, gOrigemId: string) => void,
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
        } catch {
            setNomeTemp(equipe.nome);
        } finally {
            setSalvandoInline(false);
        }
    };

    const lider = useMemo(() => membros.find(m => m.id === equipe.lider_id), [membros, equipe.lider_id]);
    const subLider = useMemo(() => membros.find(m => m.id === equipe.sub_lider_id), [membros, equipe.sub_lider_id]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full overflow-hidden">
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
                                    <button 
                                        onClick={handleSalvarEquipeInline} 
                                        disabled={salvandoInline}
                                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all disabled:opacity-30" 
                                        title="Salvar"
                                    >
                                        {salvandoInline ? <Carregando /> : <Check size={16} strokeWidth={2.5} />}
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
                </div>
            </div>

            {/* Leadership Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div 
                    onClick={() => aoSelecionarLider('lider')}
                    className={`flex items-center gap-5 p-5 rounded-2xl border transition-all cursor-pointer group/lead ${equipe.lider_id ? 'bg-slate-50/50 border-slate-100 shadow-sm hover:border-blue-200' : 'bg-white border-dashed border-slate-200 hover:bg-slate-50'}`}
                >
                    <Avatar 
                        nome={equipe.lider_nome || '?'} 
                        fotoPerfil={lider?.foto_perfil} 
                        tamanho="md" 
                        className={!equipe.lider_id ? 'bg-slate-100 !text-slate-400' : 'ring-2 ring-white shadow-sm'}
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
                    className={`flex items-center gap-5 p-5 rounded-2xl border transition-all cursor-pointer group/lead ${equipe.sub_lider_id ? 'bg-slate-50/50 border-slate-100 shadow-sm hover:border-blue-200' : 'bg-white border-dashed border-slate-200 hover:bg-slate-50'}`}
                >
                    <Avatar 
                        nome={equipe.sub_lider_nome || '?'} 
                        fotoPerfil={subLider?.foto_perfil} 
                        tamanho="md" 
                        className={!equipe.sub_lider_id ? 'bg-slate-100 !text-slate-400' : 'ring-2 ring-white shadow-sm'}
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
                            <div key={g.id} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 flex flex-col h-full min-h-[400px] shadow-sm hover:shadow-md transition-all overflow-hidden">
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
                                            <button 
                                                onClick={() => handleSalvarInline(g.id)} 
                                                disabled={salvandoInline}
                                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-30" 
                                                title="Confirmar"
                                            >
                                                {salvandoInline ? <Carregando /> : <Check size={18} strokeWidth={2.5} />}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => aoExcluirGrupo(g)} 
                                                disabled={salvandoInline}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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
                                                        <CardMembroFino 
                                                            key={membro.id} 
                                                            membro={membro} 
                                                            aoRemover={() => aoRemoverMembro(membro.id)} 
                                                            aoMover={() => aoMoverMembro(membro.id, g.id)}
                                                        />
                                                    ))}
                                                    {membrosDoGrupo.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200/40 rounded-2xl bg-white/50 my-2 py-8">
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
        alocarMembro, moverMembro
    } = usarEquipes();

    const [idEquipeAtiva, setIdEquipeAtiva] = useState<string | null>(null);
    const [buscaEquipe, setBuscaEquipe] = useState('');
    const [modalOrg, setModalOrg] = useState<{ aberto: boolean; tipo: 'equipe' | 'grupo'; dados?: any } | null>(null);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{ id: string; nome: string; tipo: 'equipe' | 'grupo' } | null>(null);
    const [modalAlocacao, setModalAlocacao] = useState<{ grupoId: string; equipeId: string } | null>(null);
    const [modalMover, setModalMover] = useState<{ membroId: string; grupoOrigemId: string; equipeId: string } | null>(null);
    const [modalLider, setModalLider] = useState<{ aberto: boolean; tipo: 'lider' | 'sub_lider' } | null>(null);
    const [desativando, setDesativando] = useState(false);

    const equipesAtivas = useMemo(() => 
        equipes.filter(e => e.ativo),
    [equipes]);

    const equipesFiltradas = useMemo(() => 
        equipesAtivas.filter(e => 
            e.nome.toLowerCase().includes(buscaEquipe.toLowerCase())
        ),
    [equipesAtivas, buscaEquipe]);

    // Otimização: Memoização de dados derivados
    const equipeAtiva = useMemo(() => 
        equipesAtivas.find(e => e.id === idEquipeAtiva),
    [equipesAtivas, idEquipeAtiva]);

    const gruposDaEquipe = useMemo(() => 
        grupos.filter(g => g.equipe_id === idEquipeAtiva && g.ativo),
    [grupos, idEquipeAtiva]);

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
                // Se era a equipe ativa, limpa para forçar re-seleção ou tela vazia
                if (idEquipeAtiva === confirmacaoExclusao.id) {
                    setIdEquipeAtiva(null);
                }
            }
        } catch (error) {
            console.error("Erro ao desativar:", error);
        } finally {
            setDesativando(false);
            setConfirmacaoExclusao(null);
        }
    }, [confirmacaoExclusao, desativarGrupo, desativarEquipe, idEquipeAtiva]);

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

    if (carregando && equipesAtivas.length === 0) return <div className="h-screen flex items-center justify-center"><Carregando /></div>;
    if (erro && equipesAtivas.length === 0) return <div className="p-20 text-center text-red-500 font-bold">{erro}</div>;

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
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">EQUIPES ({equipesFiltradas.length})</h3>
                        </div>

                        <div className="relative mb-4 group/search">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-blue-500 transition-colors" size={14} />
                            <input 
                                placeholder="Buscar equipe..."
                                value={buscaEquipe}
                                onChange={e => setBuscaEquipe(e.target.value)}
                                className="w-full h-9 bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-3 text-[11px] font-medium outline-none focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50/50 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                            {equipesFiltradas.map((e: Equipe) => (
                                <div key={e.id} className="relative group/card">
                                    <button
                                        onClick={() => setIdEquipeAtiva(e.id)}
                                        className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${idEquipeAtiva === e.id ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                                    >
                                        <p className={`font-bold text-base tracking-tight transition-colors ${idEquipeAtiva === e.id ? 'text-blue-700' : 'text-slate-900 group-hover:text-blue-600'}`}>{e.nome}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">
                                                {e.total_membros || 0} Membros
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={(ev) => {
                                            ev.stopPropagation();
                                            setConfirmacaoExclusao({ id: e.id, nome: e.nome, tipo: 'equipe' });
                                        }}
                                        className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-all"
                                        title="Excluir equipe"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {equipesAtivas.length === 0 && (
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
                            aoAdicionarGrupo={() => setModalOrg({ aberto: true, tipo: 'grupo', dados: { equipe_id: idEquipeAtiva } })}
                            aoExcluirGrupo={(g) => setConfirmacaoExclusao({ id: g.id, nome: g.nome, tipo: 'grupo' })}
                            aoAlocar={(gId, eId) => setModalAlocacao({ grupoId: gId, equipeId: eId })}
                            aoRemoverMembro={(mId) => alocarMembro(mId, null, null)}
                            aoMoverMembro={(mId, gOrigemId) => setModalMover({ membroId: mId, grupoOrigemId: gOrigemId, equipeId: idEquipeAtiva! })}
                            aoSelecionarLider={(tipo) => setModalLider({ aberto: true, tipo })}
                            aoSalvarNomeGrupo={(id, nome) => editarGrupo(id, { nome })}
                            aoSalvarNomeEquipe={(id, nome) => editarEquipe(id, { nome })}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6 animate-pulse">
                                <LayoutGrid size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Selecione uma Equipe</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                                Escolha uma equipe na barra lateral para gerenciar seus grupos, líderes e membros alocados.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                                <div className="w-12 h-px bg-slate-100" />
                                <span>Aguardando seleção</span>
                                <div className="w-12 h-px bg-slate-100" />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modais */}
            {modalOrg && (
                <Modal
                    aberto={modalOrg.aberto}
                    aoFechar={() => setModalOrg(null)}
                    titulo={modalOrg.tipo === 'grupo' && equipeAtiva ? `Novo Grupo em ${equipeAtiva.nome}` : `Nova Equipe`}
                >
                    <FormGrupoEquipe
                        titulo={modalOrg.tipo === 'equipe' ? 'Equipe' : 'Grupo'}
                        tipo={modalOrg.tipo}
                        equipeAtivaId={modalOrg.dados?.equipe_id}
                        equipes={equipesAtivas.map(e => ({ id: e.id, nome: e.nome }))}
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

            <ModalMovimentacao
                aberto={!!modalMover}
                aoFechar={() => setModalMover(null)}
                membro={membros.find(m => m.id === modalMover?.membroId) || null}
                grupos={grupos.filter(g => g.equipe_id === modalMover?.equipeId && g.id !== modalMover?.grupoOrigemId && g.ativo)}
                aoMover={async (mId: string, eId: string, gDestId: string) => {
                    if (modalMover) {
                        await moverMembro(mId, eId, gDestId, modalMover.grupoOrigemId);
                        setModalMover(null);
                    }
                }}
                equipeId={modalMover?.equipeId || ''}
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
                        placeholder={tipo === 'equipe' ? "Ex: Desenvolvimento, Comercial..." : "Ex: Squad Alpha, Operações..."}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                </div>

                {tipo === 'grupo' && equipes && !equipeAtivaId && (
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

            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={aoFechar} className="w-full sm:flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={salvando || !nome.trim()}
                    className="w-full sm:flex-[2] h-12 bg-blue-600 text-white rounded-2xl text-[10px] font-black shadow-md hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center uppercase tracking-widest"
                >
                    {salvando ? <Carregando /> : `Criar ${titulo}`}
                </button>
            </div>
        </form>
    );
}
