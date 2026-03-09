import { useState } from 'react';
import { usarOrganizacao } from './usarOrganizacao';
import { usarMembros } from '../membros/usarMembros';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { 
    Users, Plus, Trash, X, 
    ArrowRightLeft, UserPlus, Info,
    ShieldCheck, Crown, LayoutGrid, Network, 
    ListTodo
} from 'lucide-react';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { usarPermissaoAcesso } from '../../compartilhado/hooks/usarPermissao';

export default function PainelEquipes() {
    const { 
        grupos, equipes, carregando: carregandoOrg, 
        criarGrupo, criarEquipe, editarEquipe,
        excluirGrupo, excluirEquipe, alocarUsuario 
    } = usarOrganizacao();
    const { membros, carregando: carregandoMembros, recarregar: recarregarMembros } = usarMembros();

    const [modalGrupo, setModalGrupo] = useState(false);
    const [modalEquipe, setModalEquipe] = useState(false);
    
    // Estados para criação
    const [novoGrupo, setNovoGrupo] = useState({ nome: '', descricao: '' });
    const [novaEquipe, setNovaEquipe] = useState({ nome: '', descricao: '', lider_id: '', sub_lider_id: '' });
    
    const [submetendo, setSubmetendo] = useState(false);
    const [exclusao, setExclusao] = useState<{ tipo: 'grupo' | 'equipe', id: string, aberto: boolean } | null>(null);

    const podeCriarGrupo = usarPermissaoAcesso('organizacao:criar_grupo');
    const podeEditarGrupo = usarPermissaoAcesso('organizacao:editar_grupo');
    const podeCriarEquipe = usarPermissaoAcesso('organizacao:criar_equipe');
    const podeEditarEquipe = usarPermissaoAcesso('organizacao:editar_equipe');

    const handleCriarGrupo = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmetendo(true);
        try {
            await criarGrupo(novoGrupo);
            setModalGrupo(false);
            setNovoGrupo({ nome: '', descricao: '' });
        } catch (error) {
            alert(error);
        } finally {
            setSubmetendo(false);
        }
    };

    const handleCriarEquipe = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmetendo(true);
        try {
            await criarEquipe(novaEquipe);
            setModalEquipe(false);
            setNovaEquipe({ nome: '', descricao: '', lider_id: '', sub_lider_id: '' });
        } catch (error) {
            alert(error);
        } finally {
            setSubmetendo(false);
        }
    };

    const handleExcluir = async () => {
        if (!exclusao) return;
        setSubmetendo(true);
        try {
            if (exclusao.tipo === 'grupo') await excluirGrupo(exclusao.id);
            else await excluirEquipe(exclusao.id);
            setExclusao(null);
        } catch (error) {
            alert(error);
        } finally {
            setSubmetendo(false);
        }
    };

    if (carregandoOrg || carregandoMembros) return <Carregando />;

    return (
        <div className="w-full space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CabecalhoFuncionalidade
                titulo="Estrutura Organizacional"
                subtitulo="Gestão transversal de equipes e grupos de trabalho."
                icone={LayoutGrid}
            >
                <div className="flex gap-3">
                    {podeCriarEquipe && (
                        <button
                            onClick={() => setModalEquipe(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" /> Nova Equipe
                        </button>
                    )}
                    {podeCriarGrupo && (
                        <button
                            onClick={() => setModalGrupo(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" /> Novo Grupo
                        </button>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ── SEÇÃO 1: EQUIPES LÓGICAS (A Liderança é Única) ── */}
                <div className="lg:col-span-12 space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                            <ShieldCheck size={18} />
                        </div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/80">Gestão de Equipes (Liderança Unificada)</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {equipes.map(equipe => (
                            <div key={equipe.id} className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-6 shadow-sm group hover:shadow-xl hover:border-purple-500/20 transition-all duration-500">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-[16px] font-black uppercase tracking-tight text-foreground">{equipe.nome}</h3>
                                        <div className="flex items-center gap-2">
                                            <Users size={12} className="text-muted-foreground/40" />
                                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase">{membros.filter(m => m.equipe_id === equipe.id).length} Membros</span>
                                        </div>
                                    </div>
                                    {podeEditarEquipe && (
                                        <button 
                                            onClick={() => setExclusao({ tipo: 'equipe', id: equipe.id, aberto: true })}
                                            className="p-2 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {/* Liderança Única da Equipe */}
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Crown size={11} className="text-amber-500" />
                                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Líder da Equipe</label>
                                            </div>
                                            <select 
                                                disabled={!podeEditarEquipe}
                                                value={equipe.lider_id || 'none'}
                                                onChange={e => editarEquipe(equipe.id, { 
                                                    nome: equipe.nome, 
                                                    lider_id: e.target.value === 'none' ? undefined : e.target.value,
                                                    sub_lider_id: equipe.sub_lider_id || undefined
                                                })}
                                                className={`w-full bg-purple-500/5 border border-purple-500/10 rounded-2xl px-4 py-2.5 text-[12px] font-black outline-none text-foreground/80 focus:ring-4 focus:ring-purple-500/5 transition-all appearance-none ${!podeEditarEquipe ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="none">Selecione o Líder...</option>
                                                {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck size={11} className="text-blue-500" />
                                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Sub-Líder</label>
                                            </div>
                                            <select 
                                                disabled={!podeEditarEquipe}
                                                value={equipe.sub_lider_id || 'none'}
                                                onChange={e => editarEquipe(equipe.id, { 
                                                    nome: equipe.nome, 
                                                    sub_lider_id: e.target.value === 'none' ? undefined : e.target.value,
                                                    lider_id: equipe.lider_id || undefined
                                                })}
                                                className={`w-full bg-purple-500/5 border border-purple-500/10 rounded-2xl px-4 py-2.5 text-[12px] font-black outline-none text-foreground/80 focus:ring-4 focus:ring-purple-500/5 transition-all appearance-none ${!podeEditarEquipe ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="none">Selecione o Sub...</option>
                                                {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {equipes.length === 0 && (
                            <div className="col-span-full py-12 bg-muted/5 border-2 border-dashed border-border/20 rounded-[40px] flex flex-col items-center justify-center space-y-4">
                                <ListTodo size={40} className="text-muted-foreground/10" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-center">Nenhuma Equipe Definida</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-12 h-px bg-border/20 my-4" />

                {/* ── SEÇÃO 2: OPERAÇÃO / GRUPOS (Turnos de trabalho) ── */}
                <div className="lg:col-span-12 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <Network size={18} />
                            </div>
                            <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-foreground/80">Grupos de Trabalho (Escalabilidade)</h2>
                        </div>
                        <div className="flex items-center gap-4 bg-muted/20 px-4 py-2 rounded-2xl border border-border/20">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase text-muted-foreground/60">Operação Ativa</span>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {grupos.map(grupo => (
                            <div key={grupo.id} className="bg-card/20 backdrop-blur-sm border border-border/20 rounded-[40px] overflow-hidden flex flex-col">
                                <div className="p-8 pb-6 border-b border-border/10 flex justify-between items-start bg-gradient-to-br from-primary/5 to-transparent">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{grupo.nome}</h3>
                                            <div className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-black text-primary">GRUPO</div>
                                        </div>

                                    </div>
                                    <button
                                        onClick={() => setExclusao({ tipo: 'grupo', id: grupo.id, aberto: true })}
                                        className="p-3 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                    >
                                        <Trash size={20} />
                                    </button>
                                </div>

                                <div className="p-8 flex-1 space-y-6">
                                    {/* Membros do Grupo Organizados por Equipe */}
                                    {equipes.map(equipe => {
                                        const membrosEquipeNoGrupo = membros.filter(m => m.equipe_id === equipe.id && m.grupo_id === grupo.id);
                                        if (membrosEquipeNoGrupo.length === 0) return null;

                                        return (
                                            <div key={equipe.id} className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">{equipe.nome}</span>
                                                    <div className="flex-1 h-px bg-border/10" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {membrosEquipeNoGrupo.map(m => (
                                                        <div key={m.id} className="flex items-center justify-between p-3 bg-muted/5 rounded-[22px] border border-border/10">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-background/80 flex items-center justify-center text-[11px] font-black text-foreground/30 shadow-sm border border-border/10">
                                                                    {m.nome.charAt(0)}
                                                                </div>
                                                                <span className="text-[12px] font-bold text-foreground/80">{m.nome}</span>
                                                            </div>
                                                            {(podeEditarGrupo || podeEditarEquipe) && (
                                                                <button 
                                                                    onClick={() => alocarUsuario(m.id, null, null).then(recarregarMembros)}
                                                                    className="p-1.5 text-muted-foreground/20 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {membros.filter(m => m.grupo_id === grupo.id).length === 0 && (
                                        <div className="py-12 border-2 border-dashed border-border/5 rounded-[32px] flex flex-col items-center justify-center space-y-4 opacity-30">
                                            <UserPlus size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aguardando Alocação</p>
                                        </div>
                                    )}

                                    {/* Membros Sem Equipe no Grupo (Se houver) */}
                                    {membros.filter(m => m.grupo_id === grupo.id && !m.equipe_id).length > 0 && (
                                        <div className="pt-4 border-t border-border/5 space-y-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/40">Geral (Sem Equipe)</span>
                                            <div className="flex flex-wrap gap-2">
                                                {membros.filter(m => m.grupo_id === grupo.id && !m.equipe_id).map(m => (
                                                    <div key={m.id} className="px-3 py-1.5 bg-amber-500/5 border border-amber-500/10 rounded-full text-[10px] font-bold text-amber-600/60 flex items-center gap-2">
                                                        {m.nome}
                                                        {(podeEditarGrupo || podeEditarEquipe) && (
                                                            <X size={10} className="cursor-pointer" onClick={() => alocarUsuario(m.id, null, null).then(recarregarMembros)} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>


                            </div>
                        ))}
                    </div>
                </div>

                {/* ── SEÇÃO 3: DIRETÓRIO DE ALOCAÇÃO RÁPIDA ── */}
                <div className="lg:col-span-12">
                   <section className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-border/20 flex items-center justify-between bg-muted/5">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-primary/10 rounded-[22px] text-primary">
                                    <UserPlus size={24} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-[15px] font-black tracking-widest text-foreground uppercase">Diretório de Alocação Estratégica</h2>
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Mova membros entre grupos e equipes em tempo real</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/10 border-b border-border/20">
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Membro</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 md:table-cell hidden">Equipe (Função)</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Grupo</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Controles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {membros.map(membro => (
                                        <tr key={membro.id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="px-10 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[14px] bg-muted/40 border border-border/40 flex items-center justify-center text-[14px] font-black text-foreground/40 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        {membro.nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-foreground">{membro.nome}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium">{membro.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-5 md:table-cell hidden">
                                                <select
                                                    className={`w-full max-w-[180px] bg-purple-500/5 border border-purple-500/10 rounded-[16px] px-4 py-2 text-[11px] font-black outline-none focus:ring-4 focus:ring-purple-500/5 transition-all text-foreground ${!podeEditarEquipe ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    disabled={!podeEditarEquipe}
                                                    onChange={async (e) => {
                                                        await alocarUsuario(membro.id, e.target.value === 'none' ? null : e.target.value, undefined);
                                                        recarregarMembros();
                                                    }}
                                                    value={membro.equipe_id || 'none'}
                                                >
                                                    <option value="none">Sem Equipe</option>
                                                    {equipes.map(e => (
                                                        <option key={e.id} value={e.id}>{e.nome}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-10 py-5">
                                                <select
                                                    className={`w-full max-w-[180px] bg-primary/5 border border-primary/10 rounded-[16px] px-4 py-2 text-[11px] font-black outline-none focus:ring-4 focus:ring-primary/5 transition-all text-foreground ${!podeEditarGrupo ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    disabled={!podeEditarGrupo}
                                                    onChange={async (e) => {
                                                        await alocarUsuario(membro.id, undefined, e.target.value === 'none' ? null : e.target.value);
                                                        recarregarMembros();
                                                    }}
                                                    value={membro.grupo_id || 'none'}
                                                >
                                                    <option value="none">Disponível</option>
                                                    {grupos.map(g => (
                                                        <option key={g.id} value={g.id}>{g.nome}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                { (podeEditarGrupo || podeEditarEquipe) && (
                                                    <button 
                                                        onClick={() => alocarUsuario(membro.id, null, null).then(recarregarMembros)}
                                                        className="p-3 text-muted-foreground/10 hover:text-red-500 hover:bg-red-500/10 rounded-[18px] transition-all"
                                                        title="Limpar Alocações"
                                                    >
                                                        <ArrowRightLeft size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                   </section>
                </div>
            </div>

            {/* Modais de Fluxo */}
            <Modal aberto={modalGrupo} aoFechar={() => setModalGrupo(false)} titulo="Configurar Novo Grupo de Trabalho">
                <form onSubmit={handleCriarGrupo} className="space-y-6 pt-4">
                    <div className="p-8 bg-primary/5 border border-primary/10 rounded-[32px] space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2">Identificação do Grupo</label>
                            <input
                                required
                                value={novoGrupo.nome}
                                onChange={e => setNovoGrupo(prev => ({ ...prev, nome: e.target.value }))}
                                className="w-full bg-card border border-border/60 rounded-[22px] px-6 py-4 text-[14px] font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                placeholder="Ex: Grupo Alpha, Grupo Beta..."
                            />
                        </div>


                    </div>

                    <button
                        type="submit"
                        disabled={submetendo}
                        className="w-full py-5 bg-primary text-primary-foreground rounded-[26px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        Ativar Grupo
                    </button>
                </form>
            </Modal>

            <Modal aberto={modalEquipe} aoFechar={() => setModalEquipe(false)} titulo="Definir Nova Equipe">
                <form onSubmit={handleCriarEquipe} className="space-y-6 pt-4">
                    <div className="p-8 bg-purple-500/5 border border-purple-500/10 rounded-[32px] space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2">Designação da Equipe</label>
                            <input
                                required
                                value={novaEquipe.nome}
                                onChange={e => setNovaEquipe(prev => ({ ...prev, nome: e.target.value }))}
                                className="w-full bg-card border border-border/60 rounded-[22px] px-6 py-4 text-[14px] font-bold outline-none focus:ring-4 focus:ring-purple-500/5 transition-all"
                                placeholder="Ex: Web Core, Auditoria, Mobile..."
                            />
                        </div>
                        <div className="p-4 bg-muted/20 rounded-2xl flex items-center gap-3">
                            <Info size={18} className="text-purple-500/40" />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-snug">
                                Lideranças de equipes são transversais e gerenciam membros em todos os grupos.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submetendo}
                        className="w-full py-5 bg-purple-500 text-white rounded-[26px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/20 hover:scale-[1.02] transition-all"
                    >
                        Criar Equipe
                    </button>
                </form>
            </Modal>

            <ConfirmacaoExclusao
                aberto={!!exclusao}
                aoFechar={() => setExclusao(null)}
                aoConfirmar={handleExcluir}
                titulo={`Excluir ${exclusao?.tipo === 'grupo' ? 'Grupo' : 'Equipe'}`}
                descricao="Esta ação é permanente e removerá todas as alocações vinculadas a esta entidade."
                carregando={submetendo}
                textoBotao="Confirmar Exclusão"
            />
        </div>
    );
}
