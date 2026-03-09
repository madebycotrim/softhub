import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Users, Plus, Pencil, Trash2, ChevronRight, UserCheck, Search, ChevronDown } from 'lucide-react';
import { usarOrganizacao, type Grupo, type Equipe } from './usarOrganizacao';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';

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
                                className="w-full h-9 bg-muted/20 border border-border/50 rounded-xl pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            <div 
                                onClick={() => { aoAlterar(''); setAberto(false); setBusca(''); }}
                                className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${!valor ? 'bg-primary/10 text-primary font-black' : 'hover:bg-muted text-muted-foreground/60'}`}
                            >
                                {placeholderVazio}
                            </div>
                            
                            {filtradas.map(o => (
                                <div 
                                    key={o.id}
                                    onClick={() => { aoAlterar(o.id); setAberto(false); setBusca(''); }}
                                    className={`px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors flex items-center justify-between ${valor === o.id ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted text-foreground/80'}`}
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

// ─── Formulário de Grupo / Equipe ─────────────────────────────────────────────

interface FormGrupoEquipeProps {
    titulo: string;
    inicial?: { nome: string; descricao: string; lider_id?: string; sub_lider_id?: string; equipe_id?: string };
    membros: { id: string; nome: string }[];
    equipes?: { id: string; nome: string }[];
    aoSalvar: (dados: any) => Promise<void>;
    aoFechar: () => void;
    tipo: 'grupo' | 'equipe';
}

/**
 * Formulário reutilizável para criar ou editar um grupo ou equipe.
 * Grupos: exigem vínculo com equipe_id e não possuem campos de liderança individual.
 * Equipes: possuem campos de liderança individual.
 */
function FormGrupoEquipe({ titulo, inicial, membros, equipes = [], aoSalvar, aoFechar, tipo }: FormGrupoEquipeProps) {
    const [nome, setNome] = useState(inicial?.nome ?? '');
    const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
    const [liderId, setLiderId] = useState(inicial?.lider_id ?? '');
    const [subLiderId, setSubLiderId] = useState(inicial?.sub_lider_id ?? '');
    const [equipeId, setEquipeId] = useState(inicial?.equipe_id ?? '');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) { setErro('O nome é obrigatório.'); return; }
        if (tipo === 'grupo' && !equipeId) { setErro('Vincular a uma equipe é obrigatório.'); return; }

        setSalvando(true);
        setErro(null);
        try {
            const dados: any = {
                nome: nome.trim(),
                descricao: descricao.trim() || null,
            };

            if (tipo === 'equipe') {
                dados.lider_id = liderId || null;
                dados.sub_lider_id = subLiderId || null;
            } else {
                dados.equipe_id = equipeId || null;
            }

            await aoSalvar(dados);
            aoFechar();
        } catch (e: any) {
            setErro(e.response?.data?.erro ?? 'Não foi possível salvar.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Nome <span className="text-destructive">*</span>
                </label>
                <input
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder={`Nome do ${titulo.toLowerCase()}...`}
                    className="w-full h-10 bg-background border border-border rounded-2xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Descrição</label>
                <textarea
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder="Descrição opcional..."
                    rows={2}
                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
            </div>

            {tipo === 'grupo' && (
                <SeletorBuscavel
                    label="Equipe Receptora"
                    valor={equipeId}
                    aoAlterar={setEquipeId}
                    opcoes={equipes}
                    placeholderVazio="Selecione a equipe pai"
                    icone={Users}
                />
            )}

            {tipo === 'equipe' && (
                <div className="grid grid-cols-2 gap-4">
                    <SeletorBuscavel
                        label="Líder"
                        valor={liderId}
                        aoAlterar={setLiderId}
                        opcoes={membros}
                        placeholderVazio="Sem líder"
                    />
                    <SeletorBuscavel
                        label="Sub-líder"
                        valor={subLiderId}
                        aoAlterar={setSubLiderId}
                        opcoes={membros}
                        placeholderVazio="Sem sub-líder"
                    />
                </div>
            )}

            {erro && <p className="text-destructive text-xs font-bold">{erro}</p>}

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={aoFechar} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={salvando}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                    {salvando ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
}

// ─── Modal de Alocação de Membros ─────────────────────────────────────────────

interface ModalAlocacaoProps {
    aberto: boolean;
    aoFechar: () => void;
    grupos: Grupo[];
    equipes: Equipe[];
    membros: { id: string; nome: string; email: string; role: string; equipe_id: string | null; grupo_id: string | null }[];
    aoAlocar: (membroId: string, equipeId: string | null, grupoId: string | null) => Promise<void>;
}

/**
 * Modal para alocar membros em grupos e equipes.
 */
function ModalAlocacao({ aberto, aoFechar, grupos, equipes, membros, aoAlocar }: ModalAlocacaoProps) {
    const [membroId, setMembroId] = useState('');
    const [equipeId, setEquipeId] = useState('');
    const [grupoId, setGrupoId] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [busca, setBusca] = useState('');

    const membrosFiltrados = membros.filter(m =>
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.email.toLowerCase().includes(busca.toLowerCase())
    );

    const membroSelecionado = membros.find(m => m.id === membroId);

    const handleAlocar = async () => {
        if (!membroId) { setErro('Selecione um membro.'); return; }
        setSalvando(true);
        setErro(null);
        try {
            await aoAlocar(membroId, equipeId || null, grupoId || null);
            setMembroId('');
            setEquipeId('');
            setGrupoId('');
            aoFechar();
        } catch {
            setErro('Não foi possível alocar o membro.');
        } finally {
            setSalvando(false);
        }
    };

    // Auto-preencher Equipe ao selecionar um Grupo (pois grupo pertence a uma equipe)
    useEffect(() => {
        if (grupoId) {
            const grupo = grupos.find(g => g.id === grupoId);
            if (grupo?.equipe_id) {
                setEquipeId(grupo.equipe_id);
            }
        }
    }, [grupoId, grupos]);

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Alocar Membro" largura="md">
            <div className="space-y-5 py-2">
                {/* Tabela de membros com alocação atual */}
                <div className="space-y-2">
                    <input
                        placeholder="Buscar membro..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full h-9 bg-background border border-border rounded-2xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <div className="max-h-52 overflow-y-auto rounded-2xl border border-border">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Membro</th>
                                    <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Alocação atual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {membrosFiltrados.map(m => (
                                    <tr
                                        key={m.id}
                                        onClick={() => { setMembroId(m.id); setEquipeId(m.equipe_id ?? ''); setGrupoId(m.grupo_id ?? ''); }}
                                        className={`cursor-pointer transition-colors ${membroId === m.id ? 'bg-primary/10' : 'hover:bg-muted/20'}`}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar nome={m.nome} fotoPerfil={null} tamanho="sm" />
                                                <div>
                                                    <p className="text-xs font-bold text-foreground truncate max-w-[130px]">{m.nome}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">{m.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-[10px] text-muted-foreground">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold">{equipes.find(e => e.id === m.equipe_id)?.nome ?? '—'}</span>
                                                <span className="opacity-60">{grupos.find(g => g.id === m.grupo_id)?.nome ?? ''}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Seletor de destino */}
                {membroSelecionado && (
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-primary">{membroSelecionado.nome}</span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Selecione destino</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <SeletorBuscavel
                                label="Grupo (Dia/Turno)"
                                valor={grupoId}
                                aoAlterar={setGrupoId}
                                opcoes={grupos.filter(g => g.ativo).map(g => ({ id: g.id, nome: `${g.nome} (${g.equipe_nome || '—'})` }))}
                                placeholderVazio="Sem grupo"
                                icone={LayoutGrid}
                            />
                            <SeletorBuscavel
                                label="Equipe Superior"
                                valor={equipeId}
                                aoAlterar={setEquipeId}
                                opcoes={equipes.filter(e => e.ativo)}
                                placeholderVazio="Sem equipe"
                                icone={Users}
                            />
                        </div>
                    </div>
                )}

                {erro && <p className="text-destructive text-xs font-bold">{erro}</p>}

                <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={aoFechar} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                        Fechar
                    </button>
                    <button
                        type="button"
                        onClick={handleAlocar}
                        disabled={salvando || !membroId}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {salvando ? 'Salvando...' : 'Confirmar Alocação'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

type AbaOrg = 'grupos' | 'equipes';

// ─── Componente: StatsCardsOrganizacao ────────────────────────────────────────

function StatsCardsOrganizacao({ totalGrupos, totalEquipes, totalMembros }: { totalGrupos: number, totalEquipes: number, totalMembros: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {[
                { label: 'Comandos (Equipes)', valor: totalEquipes, icone: Users, cor: 'text-blue-500', bg: 'bg-blue-500/10', borda: 'border-blue-500/15' },
                { label: 'Turnos (Agendas)', valor: totalGrupos, icone: LayoutGrid, cor: 'text-purple-500', bg: 'bg-purple-500/10', borda: 'border-purple-500/15' },
                { label: 'Efetivo Total', valor: totalMembros, icone: UserCheck, cor: 'text-emerald-500', bg: 'bg-emerald-500/10', borda: 'border-emerald-500/15' },
            ].map((card) => (
                <div key={card.label} className={`relative group overflow-hidden bg-card/40 backdrop-blur-md border ${card.borda} rounded-[2rem] p-6 transition-all hover:scale-[1.02] duration-300`}>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">{card.label}</p>
                            <h3 className="text-4xl font-black text-foreground tracking-tighter">{card.valor}</h3>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.cor} flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500`}>
                            <card.icone size={28} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Página de gerenciamento de estrutura organizacional.
 * Permite criar, editar e desativar grupos e equipes, além de alocar membros.
 */
export function GerenciarOrganizacao() {
    const {
        grupos, equipes, membros, carregando, erro,
        criarGrupo, editarGrupo, desativarGrupo,
        criarEquipe, editarEquipe, desativarEquipe,
        alocarMembro,
    } = usarOrganizacao();

    const [aba, setAba] = useState<AbaOrg>('grupos');
    const [modalCriarGrupo, setModalCriarGrupo] = useState(false);
    const [grupoEmEdicao, setGrupoEmEdicao] = useState<Grupo | null>(null);
    const [grupoParaDesativar, setGrupoParaDesativar] = useState<Grupo | null>(null);
    const [modalCriarEquipe, setModalCriarEquipe] = useState(false);
    const [equipeEmEdicao, setEquipeEmEdicao] = useState<Equipe | null>(null);
    const [equipeParaDesativar, setEquipeParaDesativar] = useState<Equipe | null>(null);
    const [modalAlocacao, setModalAlocacao] = useState(false);
    const [desativando, setDesativando] = useState(false);

    if (carregando && grupos.length === 0 && equipes.length === 0) return <Carregando />;
    if (erro) return (
        <div className="py-20 flex flex-col items-center gap-4 text-destructive bg-destructive/5 rounded-[3rem] border border-destructive/10">
            <span className="text-sm font-black uppercase tracking-[0.2em]">{erro}</span>
        </div>
    );

    const gruposAtivos = grupos.filter(g => g.ativo);
    const equipesAtivas = equipes.filter(e => e.ativo);
    const membrosSimples = membros.map(m => ({
        id: m.id,
        nome: m.nome,
        email: m.email,
        role: m.role,
        equipe_id: (m as any).equipe_id ?? null,
        grupo_id: (m as any).grupo_id ?? null,
    }));

    return (
        <div className="w-full max-w-[1240px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Moderno */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-1.5 bg-primary rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Arquitetura Organizacional</span>
                    </div>
                    <h1 className="text-5xl font-black text-foreground tracking-tighter">Organização</h1>
                    <p className="text-muted-foreground/70 font-medium text-lg">Defina a hierarquia de comando e turnos da equipe conforme a agenda.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setModalAlocacao(true)}
                        className="h-14 px-8 rounded-2xl bg-muted/40 border border-border/10 text-foreground font-black text-[11px] uppercase tracking-widest hover:bg-muted/60 transition-all flex items-center gap-3 active:scale-95"
                    >
                        <UserCheck size={18} /> Alocação de Membros
                    </button>
                    <button
                        onClick={() => aba === 'grupos' ? setModalCriarGrupo(true) : setModalCriarEquipe(true)}
                        className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-3 active:scale-95"
                    >
                        <Plus size={20} /> Novo {aba === 'grupos' ? 'Grupo' : 'Equipe'}
                    </button>
                </div>
            </header>

            <StatsCardsOrganizacao 
                totalEquipes={equipesAtivas.length}
                totalGrupos={gruposAtivos.length}
                totalMembros={membros.length}
            />

            {/* Tab Switcher Premium style Segmented Control */}
            <div className="flex justify-center">
                <div className="bg-muted/20 backdrop-blur-md p-2 rounded-[2.5rem] border border-border/10 flex items-center gap-2">
                    {[
                        { id: 'equipes', label: 'Equipes de Comando', icone: Users },
                        { id: 'grupos', label: 'Divisões de Agenda', icone: LayoutGrid },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setAba(tab.id as AbaOrg)}
                            className={`
                                flex items-center gap-3 px-10 py-4 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500
                                ${aba === tab.id 
                                    ? 'bg-white text-slate-950 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] scale-100' 
                                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/5 scale-95'
                                }
                            `}
                        >
                            <tab.icone size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">

                {aba === 'grupos' && (
                    <div className="bg-card/20 backdrop-blur-2xl border border-border/10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border/5 bg-white/[0.02]">
                                        <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Agenda / Turno</th>
                                        <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 hidden md:table-cell">Comando Vinculado</th>
                                        <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 hidden lg:table-cell">Liderança Direta</th>
                                        <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Capacidade</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/5">
                                    {gruposAtivos.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <EstadoVazio titulo="Nenhum turno configurado" descricao="Adicione os turnos de participação (Grupo A, B, etc)." />
                                            </td>
                                        </tr>
                                    ) : gruposAtivos.map((grupo) => (
                                        <tr key={grupo.id} className="group/row hover:bg-white/[0.01] transition-all relative">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover/row:rotate-[10deg] transition-all duration-500">
                                                        <span className="text-xl font-black">{grupo.nome.charAt(grupo.nome.length - 1)}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground text-xl tracking-tighter">{grupo.nome}</p>
                                                        <p className="text-xs text-muted-foreground/40 font-medium">Divisão interna de participação</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 hidden md:table-cell">
                                                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                                                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-foreground/80">
                                                        {grupo.equipe_nome ?? 'Sem equipe'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 hidden lg:table-cell">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-3 group-hover/row:space-x-1 transition-all">
                                                        <div className="ring-4 ring-background rounded-full transition-transform hover:-translate-y-1">
                                                            <Avatar nome={grupo.lider_nome || '?'} fotoPerfil={null} tamanho="sm" />
                                                        </div>
                                                        {grupo.sub_lider_nome && (
                                                            <div className="ring-4 ring-background rounded-full transition-transform hover:-translate-y-1">
                                                                <Avatar nome={grupo.sub_lider_nome} fotoPerfil={null} tamanho="sm" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-foreground/60 leading-none">{grupo.lider_nome || 'Não definida'}</span>
                                                        <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Status: OK</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-center">
                                                <div className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{grupo.total_membros} ATIVOS</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                                    <button
                                                        onClick={() => setGrupoEmEdicao(grupo)}
                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setGrupoParaDesativar(grupo)}
                                                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {aba === 'equipes' && (
                    <div className="bg-card/20 backdrop-blur-2xl border border-border/10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border/5 bg-white/[0.02]">
                                        <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Núcleo de Comando</th>
                                        <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 hidden md:table-cell">Liderança</th>
                                        <th className="px-10 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Métricas</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Gestão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/5">
                                    {equipesAtivas.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-24 text-center">
                                                <EstadoVazio titulo="Nenhuma equipe mestre" descricao="Cada comando deve ter um líder e sublíder." />
                                            </td>
                                        </tr>
                                    ) : equipesAtivas.map((equipe) => (
                                        <tr key={equipe.id} className="group/row hover:bg-white/[0.01] transition-all relative">
                                            <td className="px-10 py-10">
                                                <div className="flex items-start gap-6">
                                                    <div className="w-16 h-16 rounded-[1.8rem] bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/15 group-hover/row:scale-110 group-hover/row:rotate-3 transition-all duration-500">
                                                        <Users size={32} />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h3 className="font-black text-foreground text-2xl tracking-tighter leading-none">{equipe.nome}</h3>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {equipe.grupos_nomes ? (
                                                                equipe.grupos_nomes.split(',').map(name => (
                                                                    <span key={name} className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                                        {name.trim()}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[10px] text-muted-foreground/30 font-bold italic">Sem turnos</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 hidden md:table-cell">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1 ring-2 ring-primary/20 rounded-full">
                                                            <Avatar nome={equipe.lider_nome || '?'} fotoPerfil={null} tamanho="sm" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-foreground/90 tracking-tight">{equipe.lider_nome || 'Vago'}</span>
                                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Master</span>
                                                        </div>
                                                    </div>
                                                    {equipe.sub_lider_nome && (
                                                        <div className="flex items-center gap-3 pl-12 relative">
                                                            <div className="absolute left-6 top-0 bottom-0 w-px bg-border/20" />
                                                            <Avatar nome={equipe.sub_lider_nome} fotoPerfil={null} tamanho="sm" />
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-muted-foreground/70">{equipe.sub_lider_nome}</span>
                                                                <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest italic tracking-tighter">Apoio</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-10 py-10 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-4xl font-black text-foreground tracking-tighter">{equipe.total_membros}</span>
                                                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mt-1">Efetivo</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-10">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                                    <button
                                                        onClick={() => setEquipeEmEdicao(equipe)}
                                                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20 transition-all"
                                                    >
                                                        <Pencil size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEquipeParaDesativar(equipe)}
                                                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAIS DE GRUPO ── */}
            <Modal aberto={modalCriarGrupo} aoFechar={() => setModalCriarGrupo(false)} titulo="Criar Grupo">
                <FormGrupoEquipe
                    titulo="Grupo"
                    membros={membros.map(m => ({ id: (m as any).id, nome: (m as any).nome }))}
                    equipes={equipes.map(e => ({ id: e.id, nome: e.nome }))}
                    aoSalvar={criarGrupo}
                    aoFechar={() => setModalCriarGrupo(false)}
                    tipo="grupo"
                />
            </Modal>

            <Modal aberto={!!grupoEmEdicao} aoFechar={() => setGrupoEmEdicao(null)} titulo="Editar Grupo">
                {grupoEmEdicao && (
                    <FormGrupoEquipe
                        titulo="Grupo"
                        inicial={{
                            nome: grupoEmEdicao.nome,
                            descricao: grupoEmEdicao.descricao ?? '',
                            equipe_id: grupoEmEdicao.equipe_id ?? ''
                        }}
                        membros={membros.map(m => ({ id: (m as any).id, nome: (m as any).nome }))}
                        equipes={equipes.map(e => ({ id: e.id, nome: e.nome }))}
                        aoSalvar={(dados) => editarGrupo(grupoEmEdicao.id, dados)}
                        aoFechar={() => setGrupoEmEdicao(null)}
                        tipo="grupo"
                    />
                )}
            </Modal>

            <ConfirmacaoExclusao
                aberto={!!grupoParaDesativar}
                aoFechar={() => setGrupoParaDesativar(null)}
                aoConfirmar={async () => {
                    if (!grupoParaDesativar) return;
                    setDesativando(true);
                    try { await desativarGrupo(grupoParaDesativar.id); } finally {
                        setDesativando(false);
                        setGrupoParaDesativar(null);
                    }
                }}
                titulo={`Desativar "${grupoParaDesativar?.nome}"?`}
                descricao="O grupo será arquivado. Os membros não perdem seus vínculos automaticamente."
                textoBotao="Desativar"
                carregando={desativando}
            />

            {/* ── MODAIS DE EQUIPE ── */}
            <Modal aberto={modalCriarEquipe} aoFechar={() => setModalCriarEquipe(false)} titulo="Criar Equipe">
                <FormGrupoEquipe
                    titulo="Equipe"
                    membros={membros.map(m => ({ id: (m as any).id, nome: (m as any).nome }))}
                    aoSalvar={criarEquipe}
                    aoFechar={() => setModalCriarEquipe(false)}
                    tipo="equipe"
                />
            </Modal>

            <Modal aberto={!!equipeEmEdicao} aoFechar={() => setEquipeEmEdicao(null)} titulo="Editar Equipe">
                {equipeEmEdicao && (
                    <FormGrupoEquipe
                        titulo="Equipe"
                        inicial={{
                            nome: equipeEmEdicao.nome,
                            descricao: equipeEmEdicao.descricao ?? '',
                            lider_id: equipeEmEdicao.lider_id ?? '',
                            sub_lider_id: equipeEmEdicao.sub_lider_id ?? '',
                        }}
                        membros={membros.map(m => ({ id: (m as any).id, nome: (m as any).nome }))}
                        aoSalvar={(dados) => editarEquipe(equipeEmEdicao.id, dados)}
                        aoFechar={() => setEquipeEmEdicao(null)}
                        tipo="equipe"
                    />
                )}
            </Modal>

            <ConfirmacaoExclusao
                aberto={!!equipeParaDesativar}
                aoFechar={() => setEquipeParaDesativar(null)}
                aoConfirmar={async () => {
                    if (!equipeParaDesativar) return;
                    setDesativando(true);
                    try { await desativarEquipe(equipeParaDesativar.id); } finally {
                        setDesativando(false);
                        setEquipeParaDesativar(null);
                    }
                }}
                titulo={`Desativar "${equipeParaDesativar?.nome}"?`}
                descricao="A equipe será arquivada. Os membros permanecem vinculados até nova alocação."
                textoBotao="Desativar"
                carregando={desativando}
            />

            {/* ── MODAL DE ALOCAÇÃO ── */}
            <ModalAlocacao
                aberto={modalAlocacao}
                aoFechar={() => setModalAlocacao(false)}
                grupos={grupos}
                equipes={equipes}
                membros={membrosSimples}
                aoAlocar={alocarMembro}
            />
        </div>
    );
}
