import { useState } from 'react';
import { LayoutGrid, Users, Plus, Pencil, Trash2, ChevronRight, UserCheck } from 'lucide-react';
import { usarOrganizacao, type Grupo, type Equipe } from './usarOrganizacao';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Emblema } from '../../compartilhado/componentes/Emblema';

// ─── Formulário de Grupo / Equipe ─────────────────────────────────────────────

interface FormGrupoEquipeProps {
    titulo: string;
    inicial?: { nome: string; descricao: string; lider_id: string; sub_lider_id: string };
    membros: { id: string; nome: string }[];
    aoSalvar: (dados: { nome: string; descricao: string | null; lider_id: string | null; sub_lider_id: string | null }) => Promise<void>;
    aoFechar: () => void;
}

/**
 * Formulário reutilizável para criar ou editar um grupo ou equipe.
 */
function FormGrupoEquipe({ titulo, inicial, membros, aoSalvar, aoFechar }: FormGrupoEquipeProps) {
    const [nome, setNome] = useState(inicial?.nome ?? '');
    const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
    const [liderId, setLiderId] = useState(inicial?.lider_id ?? '');
    const [subLiderId, setSubLiderId] = useState(inicial?.sub_lider_id ?? '');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) { setErro('O nome é obrigatório.'); return; }
        setSalvando(true);
        setErro(null);
        try {
            await aoSalvar({
                nome: nome.trim(),
                descricao: descricao.trim() || null,
                lider_id: liderId || null,
                sub_lider_id: subLiderId || null,
            });
            aoFechar();
        } catch {
            setErro('Não foi possível salvar. Tente novamente.');
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Líder</label>
                    <select
                        value={liderId}
                        onChange={e => setLiderId(e.target.value)}
                        className="w-full h-10 bg-background border border-border rounded-2xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                        <option value="">Sem líder</option>
                        {membros.map(m => (
                            <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Sub-líder</label>
                    <select
                        value={subLiderId}
                        onChange={e => setSubLiderId(e.target.value)}
                        className="w-full h-10 bg-background border border-border rounded-2xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                        <option value="">Sem sub-líder</option>
                        {membros.map(m => (
                            <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

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
        } catch {
            setErro('Não foi possível alocar o membro.');
        } finally {
            setSalvando(false);
        }
    };

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
                                        <td className="px-3 py-2 text-xs text-muted-foreground">
                                            {equipes.find(e => e.id === m.equipe_id)?.nome ?? <span className="italic opacity-40">Sem equipe</span>}
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
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Grupo</label>
                                <select
                                    value={grupoId}
                                    onChange={e => setGrupoId(e.target.value)}
                                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                >
                                    <option value="">Sem grupo</option>
                                    {grupos.filter(g => g.ativo).map(g => (
                                        <option key={g.id} value={g.id}>{g.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Equipe</label>
                                <select
                                    value={equipeId}
                                    onChange={e => setEquipeId(e.target.value)}
                                    className="w-full h-9 bg-background border border-border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                >
                                    <option value="">Sem equipe</option>
                                    {equipes.filter(e => e.ativo).map(e => (
                                        <option key={e.id} value={e.id}>{e.nome}</option>
                                    ))}
                                </select>
                            </div>
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

// ─── Componente Principal ─────────────────────────────────────────────────────

type AbaOrg = 'grupos' | 'equipes';

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

    // Modais de grupo
    const [modalCriarGrupo, setModalCriarGrupo] = useState(false);
    const [grupoEmEdicao, setGrupoEmEdicao] = useState<Grupo | null>(null);
    const [grupoParaDesativar, setGrupoParaDesativar] = useState<Grupo | null>(null);

    // Modais de equipe
    const [modalCriarEquipe, setModalCriarEquipe] = useState(false);
    const [equipeEmEdicao, setEquipeEmEdicao] = useState<Equipe | null>(null);
    const [equipeParaDesativar, setEquipeParaDesativar] = useState<Equipe | null>(null);

    // Modal de alocação
    const [modalAlocacao, setModalAlocacao] = useState(false);

    const [desativando, setDesativando] = useState(false);

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-center text-destructive py-10 font-bold">{erro}</p>;

    const gruposAtivos = grupos.filter(g => g.ativo);
    const equipeAtivas = equipes.filter(e => e.ativo);
    const membrosSimples = membros.map(m => ({
        id: m.id,
        nome: (m as any).nome,
        email: (m as any).email,
        role: (m as any).role,
        equipe_id: (m as any).equipe_id ?? null,
        grupo_id: (m as any).grupo_id ?? null,
    }));

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700">
            <CabecalhoFuncionalidade
                titulo="Organização"
                subtitulo="Gerencie grupos, equipes e alocação de membros."
                icone={LayoutGrid}
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setModalAlocacao(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-muted border border-border text-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
                    >
                        <UserCheck className="w-4 h-4" />
                        Alocar Membro
                    </button>
                    <button
                        onClick={() => aba === 'grupos' ? setModalCriarGrupo(true) : setModalCriarEquipe(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-md shadow-primary/20 hover:opacity-90 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        {aba === 'grupos' ? 'Novo Grupo' : 'Nova Equipe'}
                    </button>
                </div>
            </CabecalhoFuncionalidade>

            {/* Tabs */}
            <div className="flex p-1 bg-muted/20 border border-border/10 rounded-3xl w-fit">
                {([
                    { id: 'grupos', label: 'Grupos', icone: LayoutGrid, count: gruposAtivos.length },
                    { id: 'equipes', label: 'Equipes', icone: Users, count: equipeAtivas.length },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setAba(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            aba === tab.id
                            ? 'bg-card text-foreground shadow-xl'
                            : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/30'
                        }`}
                    >
                        <tab.icone size={13} />
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${aba === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/40'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── ABA GRUPOS ── */}
            {aba === 'grupos' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    {gruposAtivos.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                            <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">Nenhum grupo cadastrado</p>
                            <button onClick={() => setModalCriarGrupo(true)} className="mt-4 text-primary text-sm font-bold hover:underline">
                                Criar primeiro grupo
                            </button>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Grupo</th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hidden md:table-cell">Liderança</th>
                                    <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Membros</th>
                                    <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {gruposAtivos.map(grupo => (
                                    <tr key={grupo.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-sm text-foreground">{grupo.nome}</p>
                                            {grupo.descricao && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{grupo.descricao}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-4 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                {grupo.lider_nome
                                                    ? <p className="text-xs font-bold text-foreground/70">{grupo.lider_nome}</p>
                                                    : <span className="text-xs italic text-muted-foreground/40">Sem líder</span>
                                                }
                                                {grupo.sub_lider_nome && (
                                                    <p className="text-xs text-muted-foreground/50">{grupo.sub_lider_nome} (sub)</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <Emblema texto={`${grupo.total_membros} membros`} variante="azul" />
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setGrupoEmEdicao(grupo)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setGrupoParaDesativar(grupo)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                                                    title="Desativar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── ABA EQUIPES ── */}
            {aba === 'equipes' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                    {equipeAtivas.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                            <Users className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">Nenhuma equipe cadastrada</p>
                            <button onClick={() => setModalCriarEquipe(true)} className="mt-4 text-primary text-sm font-bold hover:underline">
                                Criar primeira equipe
                            </button>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Equipe</th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hidden md:table-cell">Liderança</th>
                                    <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Membros</th>
                                    <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {equipeAtivas.map(equipe => (
                                    <tr key={equipe.id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-sm text-foreground">{equipe.nome}</p>
                                            {equipe.descricao && (
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{equipe.descricao}</p>
                                            )}
                                        </td>
                                        <td className="px-3 py-4 hidden md:table-cell">
                                            <div className="space-y-0.5">
                                                {equipe.lider_nome
                                                    ? <p className="text-xs font-bold text-foreground/70">{equipe.lider_nome}</p>
                                                    : <span className="text-xs italic text-muted-foreground/40">Sem líder</span>
                                                }
                                                {equipe.sub_lider_nome && (
                                                    <p className="text-xs text-muted-foreground/50">{equipe.sub_lider_nome} (sub)</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-center">
                                            <Emblema texto={`${equipe.total_membros} membros`} variante="roxo" />
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEquipeEmEdicao(equipe)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setEquipeParaDesativar(equipe)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                                                    title="Desativar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── MODAIS DE GRUPO ── */}
            <Modal aberto={modalCriarGrupo} aoFechar={() => setModalCriarGrupo(false)} titulo="Criar Grupo">
                <FormGrupoEquipe
                    titulo="Grupo"
                    membros={membros.map(m => ({ id: (m as any).id, nome: (m as any).nome }))}
                    aoSalvar={criarGrupo}
                    aoFechar={() => setModalCriarGrupo(false)}
                />
            </Modal>

            <Modal aberto={!!grupoEmEdicao} aoFechar={() => setGrupoEmEdicao(null)} titulo="Editar Grupo">
                {grupoEmEdicao && (
                    <FormGrupoEquipe
                        titulo="Grupo"
                        inicial={{
                            nome: grupoEmEdicao.nome,
                            descricao: grupoEmEdicao.descricao ?? '',
                            lider_id: grupoEmEdicao.lider_id ?? '',
                            sub_lider_id: grupoEmEdicao.sub_lider_id ?? '',
                        }}
                        membros={membros.map(m => ({ id: (m as any).id, nome: (m as any).nome }))}
                        aoSalvar={(dados) => editarGrupo(grupoEmEdicao.id, dados)}
                        aoFechar={() => setGrupoEmEdicao(null)}
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
