import { useState, useMemo, useCallback, memo } from 'react';
import { LayoutGrid, Users, Plus, Trash2 } from 'lucide-react';

import { usarEquipes } from '@/funcionalidades/admin/hooks/usarEquipes';
import type { Grupo } from '@/funcionalidades/admin/hooks/usarEquipes';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { Modal } from '@/compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';

import { DetalheEquipe } from './equipes/DetalheEquipe';
import { FormGrupoEquipe } from './equipes/FormGrupoEquipe';
import { ModalAlocacao } from './equipes/ModalAlocacao';
import { ModalMovimentacao } from './equipes/ModalMovimentacao';
import { ModalSelecaoLider } from './equipes/ModalSelecaoLider';

export const GerenciarEquipes = memo(() => {
    const {
        grupos, equipes, membros, carregando, erro,
        criarGrupo, editarGrupo, desativarGrupo,
        criarEquipe, editarEquipe, desativarEquipe,
        alocarMembro, moverMembro
    } = usarEquipes();

    const podeCriarEquipe = usarPermissaoAcesso('equipes:criar_equipe');
    const podeEditarEquipe = usarPermissaoAcesso('equipes:editar_equipe');

    const [idEquipeAtiva, setIdEquipeAtiva] = useState<string | null>(null);
    const [buscaEquipe, setBuscaEquipe] = useState('');
    const [modalOrg, setModalOrg] = useState<{ aberto: boolean; tipo: 'equipe' | 'grupo'; dados?: any } | null>(null);
    const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{ id: string; nome: string; tipo: 'equipe' | 'grupo' } | null>(null);
    const [modalAlocacao, setModalAlocacao] = useState<{ grupoId: string; equipeId: string } | null>(null);
    const [modalMover, setModalMover] = useState<{ membroId: string; grupoOrigemId: string; equipeId: string } | null>(null);
    const [modalLider, setModalLider] = useState<{ aberto: boolean; tipo: 'lider' | 'sub_lider' } | null>(null);
    const [desativando, setDesativando] = useState(false);

    const equipesAtivas = equipes;

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
        grupos.filter(g => g.equipe_id === idEquipeAtiva),
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

    // Callbacks Memoizados para DetalheEquipe
    const handleAdicionarGrupo = useCallback(() => setModalOrg({ aberto: true, tipo: 'grupo', dados: { equipe_id: idEquipeAtiva } }), [idEquipeAtiva]);
    const handleExcluirGrupo = useCallback((g: Grupo) => setConfirmacaoExclusao({ id: g.id, nome: g.nome, tipo: 'grupo' }), []);
    const handleAlocarAbrir = useCallback((gId: string, eId: string) => setModalAlocacao({ grupoId: gId, equipeId: eId }), []);
    const handleRemoverMembro = useCallback((mId: string) => alocarMembro(mId, null, null), [alocarMembro]);
    const handleMoverMembroAbrir = useCallback((mId: string, gOrigemId: string) => setModalMover({ membroId: mId, grupoOrigemId: gOrigemId, equipeId: idEquipeAtiva! }), [idEquipeAtiva]);
    const handleSelecionarLiderAbrir = useCallback((tipo: 'lider' | 'sub_lider') => setModalLider({ aberto: true, tipo }), []);
    const handleSalvarNomeGrupo = useCallback((id: string, nome: string) => editarGrupo(id, { nome }), [editarGrupo]);
    const handleSalvarNomeEquipe = useCallback((id: string, nome: string) => editarEquipe(id, { nome }), [editarEquipe]);

    return (
        <div className="flex flex-col h-full space-y-6 animar-entrada">
            <CabecalhoFuncionalidade
                titulo="Estrutura Organizacional"
                subtitulo="Gestão de equipes, grupos de trabalho e alocação de lideranças."
                icone={LayoutGrid}
            >
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setModalOrg({ aberto: true, tipo: 'equipe' })}
                        className="h-11 px-5 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>Nova Equipe</span>
                    </button>
                </div>
            </CabecalhoFuncionalidade>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                {carregando && equipesAtivas.length === 0 ? (
                    <div className="flex-1 flex justify-center items-center h-96"><Carregando /></div>
                ) : (
                    <>
                        {/* Sidebar de Equipes */}
                        <aside className="w-full lg:w-80 flex flex-col shrink-0">
                            <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
                                <div className="p-5 border-b border-border bg-muted/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary shadow-sm shadow-primary/5">
                                            <Users size={14} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground leading-none">Equipes Ativas</h3>
                                    </div>
                                    <span className="text-[9px] font-black text-muted-foreground/60">{equipesAtivas.length}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                                    {equipesAtivas.map((e, index) => (
                                        <div
                                            key={e.id}
                                            onClick={() => setIdEquipeAtiva(e.id)}
                                            className={`group/card relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer animar-entrada atraso-${(index % 5) + 1} ${
                                                idEquipeAtiva === e.id
                                                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                                    : 'bg-muted/10 border-transparent hover:bg-muted/30 hover:border-border/50 text-muted-foreground'
                                            }`}
                                        >
                                            <div className="flex flex-col min-w-0 pr-6 w-full">
                                                <span className={`text-[11px] font-black uppercase tracking-wider truncate mb-1 ${idEquipeAtiva === e.id ? 'text-primary' : 'text-foreground/80'}`}>
                                                    {e.nome}
                                                </span>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Users size={10} />
                                                    <span className="text-[9px] font-bold uppercase tracking-tight">{e.total_membros || 0} Membros</span>
                                                </div>
                                            </div>

                                            {podeEditarEquipe && (
                                                <button
                                                    onClick={(ev) => {
                                                        ev.stopPropagation();
                                                        setConfirmacaoExclusao({ id: e.id, nome: e.nome, tipo: 'equipe' });
                                                    }}
                                                    className={`p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95 ${idEquipeAtiva === e.id ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'}`}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {equipesAtivas.length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <EstadoVazio 
                                                titulo="Sem Equipes"
                                                descricao="Nenhuma equipe foi criada ainda."
                                                compacto={true}
                                                acao={podeCriarEquipe ? {
                                                    rotulo: "Criar Equipe",
                                                    aoClicar: () => setModalOrg({ aberto: true, tipo: 'equipe' })
                                                } : undefined}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* Detalhe da Equipe Selecionada */}
                        <main className="flex-1 flex flex-col min-w-0 min-h-0">
                             {equipeAtiva ? (
                                 <DetalheEquipe
                                     key={equipeAtiva.id}
                                     equipe={equipeAtiva}
                                     grupos={gruposDaEquipe}
                                     membros={membros as any}
                                     aoAdicionarGrupo={handleAdicionarGrupo}
                                     aoExcluirGrupo={handleExcluirGrupo}
                                     aoAlocar={handleAlocarAbrir}
                                     aoRemoverMembro={handleRemoverMembro}
                                     aoMoverMembro={handleMoverMembroAbrir}
                                     aoSelecionarLider={handleSelecionarLiderAbrir}
                                     aoSalvarNomeGrupo={handleSalvarNomeGrupo}
                                     aoSalvarNomeEquipe={handleSalvarNomeEquipe}
                                 />
                             ) : (
                                 <div className="flex-1 flex flex-col items-center justify-center bg-card border border-border rounded-2xl border-dashed p-12">
                                     <EstadoVazio 
                                        titulo="Painel Organizacional"
                                        descricao="Selecione uma equipe na lista lateral para gerenciar seus membros e grupos de trabalho."
                                        iconeCustom={<LayoutGrid size={32} strokeWidth={1.5} className="text-primary/40" />}
                                     />
                                 </div>
                             )}
                        </main>
                    </>
                )}
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
                descricao="Esta ação é definitiva. Todos os dados vinculados serão permanentemente removidos."
                carregando={desativando}
            />

            <ModalAlocacao
                aberto={!!modalAlocacao}
                aoFechar={() => setModalAlocacao(null)}
                grupos={grupos}
                equipes={equipesAtivas}
                membros={membros as any}
                aoAlocar={alocarMembro}
                grupoIdPadrao={modalAlocacao?.grupoId}
                equipeIdPadrao={modalAlocacao?.equipeId}
            />

            <ModalMovimentacao
                aberto={!!modalMover}
                aoFechar={() => setModalMover(null)}
                membro={(membros.find(m => m.id === modalMover?.membroId) as any) || null}
                grupos={grupos.filter(g => g.equipe_id === modalMover?.equipeId && g.id !== modalMover?.grupoOrigemId)}
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
                membros={membros as any}
                aoConfirmar={handleDefinirLider}
                titulo={modalLider?.tipo === 'lider' ? 'Definir Líder' : 'Definir Sub-líder'}
                valorAtual={modalLider?.tipo === 'lider' ? equipeAtiva?.lider_id : equipeAtiva?.sub_lider_id}
                outroId={modalLider?.tipo === 'lider' ? equipeAtiva?.sub_lider_id : equipeAtiva?.lider_id}
                tipo={modalLider?.tipo}
            />
        </div>
    );
});

export default GerenciarEquipes;
