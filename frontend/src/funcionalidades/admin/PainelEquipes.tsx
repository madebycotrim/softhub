import { useState } from 'react';
import { LayoutPrincipal } from '../../compartilhado/componentes/LayoutPrincipal';
import { usarOrganizacao } from './usarOrganizacao';
import { usarMembros } from '../membros/usarMembros';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { Users, Plus, Trash, FolderTree, X } from 'lucide-react';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';

export default function PainelEquipes() {
    const { grupos, equipes, carregando: carregandoOrg, criarGrupo, criarEquipe, excluirGrupo, excluirEquipe, alocarUsuario } = usarOrganizacao();
    const { membros, carregando: carregandoMembros, recarregar: recarregarMembros } = usarMembros();

    const [modalGrupo, setModalGrupo] = useState(false);
    const [modalEquipe, setModalEquipe] = useState(false);
    const [modalAlocacao, setModalAlocacao] = useState<{ aberto: boolean, equipeId: string | null }>({ aberto: false, equipeId: null });

    const [novoGrupo, setNovoGrupo] = useState({ nome: '', descricao: '' });
    const [novaEquipe, setNovaEquipe] = useState({ nome: '', descricao: '', grupo_id: '' });
    const [submetendo, setSubmetendo] = useState(false);

    const [exclusao, setExclusao] = useState<{ tipo: 'grupo' | 'equipe', id: string, aberto: boolean } | null>(null);

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
            setNovaEquipe({ nome: '', descricao: '', grupo_id: '' });
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

    const handleAlocar = async (membroId: string) => {
        try {
            await alocarUsuario(membroId, modalAlocacao.equipeId);
            recarregarMembros();
        } catch (error) {
            alert(error);
        }
    };

    if (carregandoOrg || carregandoMembros) return <LayoutPrincipal><Carregando /></LayoutPrincipal>;

    return (
        <LayoutPrincipal>
            <div className="max-w-7xl mx-auto space-y-6">
                <CabecalhoFuncionalidade
                    titulo="Gestão de Equipes"
                    subtitulo="Organize os membros em grupos e equipes de trabalho."
                    icone={Users}
                    variante="padrao"
                >
                    <button
                        onClick={() => setModalGrupo(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground rounded-xl transition-colors border border-border"
                    >
                        <Plus className="w-4 h-4" /> Novo Grupo
                    </button>
                </CabecalhoFuncionalidade>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Árvore de Grupos e Equipes */}
                    <div className="lg:col-span-4 space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <FolderTree className="w-4 h-4" /> Estrutura
                        </h2>

                        {grupos.length === 0 && (
                            <div className="p-8 text-center bg-card border border-border/50 rounded-2xl border-dashed">
                                <p className="text-sm text-muted-foreground italic">Nenhum grupo criado.</p>
                            </div>
                        )}

                        {grupos.map(grupo => (
                            <div key={grupo.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                                <div className="p-4 bg-muted/50 flex justify-between items-center border-b border-border/50">
                                    <div>
                                        <h3 className="font-bold text-foreground">{grupo.nome}</h3>
                                        {grupo.descricao && <p className="text-xs text-muted-foreground line-clamp-1">{grupo.descricao}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setNovaEquipe(prev => ({ ...prev, grupo_id: grupo.id })); setModalEquipe(true); }}
                                            className="p-1.5 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                                            title="Adicionar Equipe"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setExclusao({ tipo: 'grupo', id: grupo.id, aberto: true })}
                                            className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    {equipes.filter(e => e.grupo_id === grupo.id).map(equipe => (
                                        <button
                                            key={equipe.id}
                                            onClick={() => setModalAlocacao({ aberto: true, equipeId: equipe.id })}
                                            className={`w-full flex justify-between items-center px-3 py-2 rounded-xl text-sm transition-colors ${modalAlocacao.equipeId === equipe.id ? 'bg-primary/20 text-primary border border-primary/50' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                }`}
                                        >
                                            <span>{equipe.nome}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                    {membros.filter(m => m.equipe_id === equipe.id).length} membros
                                                </span>
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); setExclusao({ tipo: 'equipe', id: equipe.id, aberto: true }); }}
                                                    className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                                                >
                                                    <X className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {equipes.filter(e => e.grupo_id === grupo.id).length === 0 && (
                                        <p className="text-[10px] text-muted-foreground text-center py-2">Sem equipes.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Lista de Membros para Alocação */}
                    <div className="lg:col-span-8 space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {modalAlocacao.equipeId
                                ? `Membros da Equipe: ${equipes.find(e => e.id === modalAlocacao.equipeId)?.nome}`
                                : 'Todos os Membros'}
                        </h2>

                        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground border-b border-border/50 uppercase text-[10px] font-bold tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Membro</th>
                                        <th className="px-6 py-4">Equipe Atual</th>
                                        <th className="px-6 py-4">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {(modalAlocacao.equipeId
                                        ? membros.filter(m => m.equipe_id === modalAlocacao.equipeId)
                                        : membros
                                    ).map(membro => (
                                        <tr key={membro.id} className="text-foreground hover:bg-accent/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold ring-1 ring-border uppercase text-muted-foreground">
                                                        {membro.nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{membro.nome}</p>
                                                        <p className="text-[10px] text-muted-foreground">{membro.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {membro.equipe_nome ? (
                                                    <span className="text-muted-foreground">{membro.grupo_nome} / {membro.equipe_nome}</span>
                                                ) : (
                                                    <span className="text-muted-foreground italic">Não alocado</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {modalAlocacao.equipeId ? (
                                                    <button
                                                        onClick={() => { handleAlocar(membro.id); }}
                                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                                        title="Remover da Equipe"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <div className="flex gap-2 justify-end">
                                                        <select
                                                            className="bg-background border border-input rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-primary text-foreground"
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    alocarUsuario(membro.id, e.target.value).then(() => recarregarMembros());
                                                                }
                                                            }}
                                                            value={membro.equipe_id || ''}
                                                        >
                                                            <option value="">Trocar Equipe...</option>
                                                            {equipes.map(e => (
                                                                <option key={e.id} value={e.id}>{e.nome}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modais */}
            <Modal aberto={modalGrupo} aoFechar={() => setModalGrupo(false)} titulo="Criar Novo Grupo">
                <form onSubmit={handleCriarGrupo} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nome do Grupo</label>
                        <input
                            type="text"
                            required
                            value={novoGrupo.nome}
                            onChange={e => setNovoGrupo(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full bg-background border border-input rounded-xl px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Ex: Desenvolvimento Web"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
                        <textarea
                            value={novoGrupo.descricao}
                            onChange={e => setNovoGrupo(prev => ({ ...prev, descricao: e.target.value }))}
                            className="w-full bg-background border border-input rounded-xl px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none h-20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submetendo}
                        className="w-full py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl font-bold transition-colors"
                    >
                        {submetendo ? 'Criando...' : 'Criar Grupo'}
                    </button>
                </form>
            </Modal>

            <Modal aberto={modalEquipe} aoFechar={() => setModalEquipe(false)} titulo="Criar Nova Equipe">
                <form onSubmit={handleCriarEquipe} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nome da Equipe</label>
                        <input
                            type="text"
                            required
                            value={novaEquipe.nome}
                            onChange={e => setNovaEquipe(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full bg-background border border-input rounded-xl px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Ex: Frontend Core"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
                        <textarea
                            value={novaEquipe.descricao}
                            onChange={e => setNovaEquipe(prev => ({ ...prev, descricao: e.target.value }))}
                            className="w-full bg-background border border-input rounded-xl px-4 py-2 text-foreground focus:ring-2 focus:ring-primary outline-none h-20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submetendo}
                        className="w-full py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl font-bold transition-colors"
                    >
                        {submetendo ? 'Criando...' : 'Criar Equipe'}
                    </button>
                </form>
            </Modal>

            <ConfirmacaoExclusao
                aberto={!!exclusao}
                aoFechar={() => setExclusao(null)}
                aoConfirmar={handleExcluir}
                titulo={`Excluir ${exclusao?.tipo === 'grupo' ? 'Grupo' : 'Equipe'}`}
                descricao={`Esta ação desativará permanentemente o ${exclusao?.tipo === 'grupo' ? 'grupo e todas as suas equipes' : 'equipe'}. Os membros serão desalocados.`}
                carregando={submetendo}
                textoBotao="Desativar"
            />
        </LayoutPrincipal>
    );
}
