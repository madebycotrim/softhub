import { useState, useMemo, useCallback, useEffect, memo, FormEvent } from 'react';
import { UserCog, Shield, Users as UsersIcon, Plus, History, Search, LayoutGrid, Wifi, Clock, ChevronRight, AlertCircle, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';

import { api } from '@/compartilhado/servicos/api';
import { usarMembros } from '@/funcionalidades/membros/hooks/usarMembros';
import type { Membro } from '@/funcionalidades/membros/hooks/usarMembros';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '@/compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { ambiente } from '@/configuracoes/ambiente';
import { usarConfiguracoes } from '@/funcionalidades/admin/hooks/usarConfiguracoes';
import { usarDebounce } from '@/compartilhado/hooks/usarDebounce';
import { usarToast } from '@/compartilhado/hooks/usarToast';
import { Paginacao } from '@/compartilhado/componentes/Paginacao';
import { FormularioCadastroMembro } from './membros/FormularioCadastroMembro';
import { ModalEdicaoPerfil } from '@/funcionalidades/perfil/componentes/ModalEdicaoPerfil';
import { PerfilProvider } from '@/funcionalidades/perfil/contexto/PerfilContexto';

/**
 * Hook customizado para gerenciar a lógica de administração de membros.
 */
function useGerenciarMembros() {
    const {
        membros,
        carregando,
        erro,
        recarregar,
        adicionarMembro,
        deletarMembro,
        atualizarMembro,
    } = usarMembros();

    const [salvandoIds, setSalvandoIds] = useState<Set<string>>(new Set());
    const { exibirToast } = usarToast();
    const { usuario: usuarioAutenticado, atualizarUsuarioLocalmente } = usarAutenticacao();

    const marcarSalvando = useCallback((id: string) => {
        setSalvandoIds(prev => new Set(prev).add(id));
    }, []);

    const desmarcarSalvando = useCallback((id: string) => {
        setSalvandoIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const alterarRole = useCallback(async (membro: Membro, roleNova: string) => {
        if (membro.role === roleNova) return;

        atualizarMembro({ ...membro, role: roleNova });
        marcarSalvando(membro.id);

        try {
            await api.patch(`/api/usuarios/${membro.id}/role`, { role: roleNova });
            exibirToast(`Cargo de ${membro.nome} atualizado.`);

            if (membro.id === usuarioAutenticado?.id) {
                atualizarUsuarioLocalmente({ ...usuarioAutenticado, role: roleNova });
            }
        } catch (e: any) {
            atualizarMembro(membro);
            exibirToast(e.response?.data?.erro ?? 'Erro ao alterar cargo.', 'erro');
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando, usuarioAutenticado, atualizarUsuarioLocalmente]);

    const cadastrarMembro = useCallback(async (email: string, role: string) => {
        const res = await adicionarMembro({ email: email.toLowerCase().trim(), role });
        if (res.sucesso) {
            await recarregar();
            exibirToast(`Autorizado: ${email}`);
        } else {
            exibirToast(res.erro ?? 'Erro ao cadastrar.', 'erro');
        }
        return res;
    }, [adicionarMembro, recarregar, exibirToast]);

    return { membros, carregando, erro, recarregar, salvandoIds, alterarRole, cadastrarMembro, removerMembro: useCallback(async (m: Membro) => { marcarSalvando(m.id); const res = await deletarMembro(m.id); if (res.sucesso) { await recarregar(); exibirToast(`Acesso de ${m.nome} removido.`); } else { exibirToast(res.erro ?? 'Erro ao remover.', 'erro'); } desmarcarSalvando(m.id); return res; }, [deletarMembro, recarregar, exibirToast, marcarSalvando, desmarcarSalvando]) };
}

import { LinhaMembro } from './membros/LinhaMembro';

// ─── Componente Principal ─────────────────────────────────────────────────────

export const GerenciarMembros = memo(() => {
    const { 
        membros, carregando, erro, recarregar, salvandoIds, 
        alterarRole, cadastrarMembro, removerMembro 
    } = useGerenciarMembros();
    const { configuracoes } = usarConfiguracoes();
    const { exibirToast } = usarToast();

    // Busca de Membros Online
    const { data: membrosOnline = [] } = useQuery({
        queryKey: ['membros-online'],
        queryFn: async () => {
            const res = await api.get('/api/ponto/online');
            return res.data.online || [];
        },
        refetchInterval: 30000 // Polling a cada 30s
    });

    const [modalOnlineAberto, setModalOnlineAberto] = useState(false);

    // Busca de Justificativas Pendentes
    const { data: justificativas = [] } = useQuery({
        queryKey: ['admin-justificativas-contagem'],
        queryFn: async () => {
            const res = await api.get('/api/ponto/admin/justificativas');
            return res.data || [];
        },
        refetchInterval: 60000 
    });

    const pendenciasPonto = useMemo(() => justificativas.filter((j: any) => j.status === 'pendente').length, [justificativas]);


    const rolesDisponiveis = useMemo(() => {
        const base = configuracoes?.permissoes_roles ? Object.keys(configuracoes.permissoes_roles) : ['MEMBRO', 'LIDER', 'ADMIN'];
        return base.filter(r => r !== 'ADMIN');
    }, [configuracoes]);

    const [busca, setBusca] = useState('');
    const buscaDebounced = usarDebounce(busca, 300);
    const [modalAberto, setModalAberto] = useState(false);
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [membroParaExcluir, setMembroParaExcluir] = useState<Membro | null>(null);
    const [pagina, setPagina] = useState(1);
    const [itensPorPagina, setItensPorPagina] = useState(15);
    const [idPerfilParaVer, setIdPerfilParaVer] = useState<string | null>(null);


    const handleMudarItensPorPagina = useCallback((n: number) => {
        setItensPorPagina(n);
        setPagina(1);
    }, []);

    const listaFiltrada = useMemo(() => {
        if (!buscaDebounced.trim()) return membros;
        const low = buscaDebounced.toLowerCase();
        return membros.filter(m => (m.nome?.toLowerCase() || '').includes(low) || m.email.toLowerCase().includes(low));
    }, [membros, buscaDebounced]);

    const paginada = useMemo(() => listaFiltrada.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina), [listaFiltrada, pagina]);

    const toggleSelect = useCallback((id: string) => {
        setSelecionados(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    }, []);

    const handleMudarPagina = useCallback((p: number) => setPagina(p), []);
    const handleRemoverConfirmado = useCallback(async () => {
        if (!membroParaExcluir) return;
        const membro = membroParaExcluir;
        setMembroParaExcluir(null);
        await removerMembro(membro);
    }, [membroParaExcluir, removerMembro]);

    const handleRemoverLote = useCallback(async () => {
        const ids = Array.from(selecionados);
        setSelecionados(new Set());
        try {
            await Promise.all(ids.map(id => api.delete(`/api/usuarios/${id}`)));
            await recarregar();
            exibirToast(`${ids.length} membros removidos.`);
        } catch (e: any) {
            exibirToast(e.response?.data?.erro ?? 'Erro ao remover em lote.', 'erro');
        }
    }, [selecionados, recarregar, exibirToast]);

    const handleLimparSelecao = useCallback(() => setSelecionados(new Set()), []);
    const handleFecharModal = useCallback(() => setModalAberto(false), []);
    const handleAbrirModal = useCallback(() => setModalAberto(true), []);
    const handleSetMembroExcluir = useCallback((m: Membro) => setMembroParaExcluir(m), []);
    const handleVerPerfil = useCallback((id: string) => setIdPerfilParaVer(id), []);
    const handleFecharPerfil = useCallback(() => setIdPerfilParaVer(null), []);


    return (
        <div className="flex flex-col h-full space-y-6 animar-entrada">
            
            <CabecalhoFuncionalidade
                titulo="Administrar Time"
                subtitulo="Controle de acessos, permissões e hierarquia de membros."
                icone={UserCog}
            >
                <div className="flex items-center gap-3">
                    <div className="relative group/search max-w-xs">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" size={14} />
                        <input
                            placeholder="Buscar membro..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl pl-10 pr-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all placeholder:text-muted-foreground/30"
                        />
                    </div>
                    
                    <button
                        onClick={handleAbrirModal}
                        className="h-11 px-5 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span>Novo Membro</span>
                    </button>
                </div>
            </CabecalhoFuncionalidade>

            {/* Stats Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { 
                        label: 'Membros Online', 
                        valor: membrosOnline.length, 
                        cor: 'emerald', 
                        icone: Wifi, 
                        atraso: 'atraso-1',
                        clicavel: true,
                        onClick: () => setModalOnlineAberto(true) 
                    },
                    { label: 'Membros Ativos', valor: membros.length, cor: 'indigo', icone: UsersIcon, atraso: 'atraso-2' },
                    { 
                        label: 'Pendências Ponto', 
                        valor: pendenciasPonto, 
                        cor: 'amber', 
                        icone: AlertCircle, 
                        atraso: 'atraso-3',
                        clicavel: true,
                        onClick: () => window.location.href = '/app/admin/justificativas'
                    },
                    { label: 'Sem Equipe', valor: membros.filter(m => !m.equipe_nome).length, cor: 'rose', icone: LayoutGrid, atraso: 'atraso-4' }
                ].map(s => (
                    <div 
                        key={s.label} 
                        onClick={s.onClick}
                        className={`group relative bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-all animar-entrada ${s.atraso} ${s.clicavel ? 'cursor-pointer hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 active:scale-[0.98]' : ''}`}
                    >
                        {s.clicavel && (
                            <>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-tighter border border-emerald-500/10">
                                        Ver Lista
                                    </div>
                                </div>
                                <div className="absolute bottom-3 right-3 text-muted-foreground/20 group-hover:text-emerald-500/50 transition-colors">
                                    <ChevronRight size={14} />
                                </div>
                            </>
                        )}

                        <div className={`p-3 bg-${s.cor}-500/10 text-${s.cor}-500 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <s.icone size={20} className={s.label === 'Membros Online' && membrosOnline.length > 0 ? 'animate-pulse' : ''} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-tight">{s.label}</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-black text-foreground">{s.valor}</span>
                                {s.label === 'Membros Online' && s.valor > 0 && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela Principal */}
            <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0 animar-entrada atraso-5">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-muted/10 backdrop-blur-md border-b border-border">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 w-80">Membro</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Cargo Hierárquico</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hidden xl:table-cell">Alocações</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hidden lg:table-cell">Visto por último</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {paginada.map(m => (
                                <LinhaMembro
                                    key={m.id}
                                    membro={m}
                                    salvando={salvandoIds.has(m.id)}
                                    selecionado={selecionados.has(m.id)}
                                    onToggleSelect={toggleSelect}
                                    onAlterarRole={alterarRole}
                                    onRemover={handleSetMembroExcluir}
                                    onVerPerfil={handleVerPerfil}
                                    rolesDisponiveis={rolesDisponiveis}
                                />
                            ))}
                        </tbody>
                    </table>
                    
                    {listaFiltrada.length === 0 && !carregando && (
                        <div className="p-20 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
                            <UserCog size={64} strokeWidth={1} />
                            <p className="text-[11px] font-black uppercase tracking-widest">Nenhum membro encontrado</p>
                        </div>
                    )}
                    
                    {carregando && membros.length === 0 && (
                        <div className="p-20 flex justify-center"><Carregando /></div>
                    )}
                </div>

                {/* Rodapé / Paginação */}
                <div className="p-4 border-t border-border bg-muted/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60">
                        Exibindo {paginada.length} de {listaFiltrada.length} membros
                    </span>
                    <Paginacao
                        paginaAtual={pagina}
                        totalPaginas={Math.ceil(listaFiltrada.length / itensPorPagina)}
                        totalRegistros={listaFiltrada.length}
                        itensPorPagina={itensPorPagina}
                        itensListados={paginada.length}
                        aoMudarPagina={handleMudarPagina}
                        aoMudarItensPorPagina={handleMudarItensPorPagina}
                    />
                </div>
            </div>

            {/* Ações em Lote (Flutuante) */}
            {selecionados.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 text-white min-w-[400px]">
                        <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
                            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-black shadow-lg shadow-primary/20">
                                {selecionados.size}
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Selecionados</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleLimparSelecao}
                                className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRemoverLote}
                                className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/20"
                            >
                                Remover Acesso
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modais */}
            <Modal aberto={modalAberto} aoFechar={handleFecharModal} titulo="Autorizar Acesso" largura="sm">
                <FormularioCadastroMembro aoCadastrar={cadastrarMembro} aoSucesso={handleFecharModal} roles={rolesDisponiveis} />
            </Modal>

            <ConfirmacaoExclusao
                aberto={!!membroParaExcluir}
                aoFechar={() => setMembroParaExcluir(null)}
                aoConfirmar={handleRemoverConfirmado}
                titulo="Remover Acesso?"
                descricao={`Esta ação removerá permanentemente o acesso de ${membroParaExcluir?.nome || membroParaExcluir?.email}.`}
            />

            {/* Modal de Membros Online */}
            <Modal aberto={modalOnlineAberto} aoFechar={() => setModalOnlineAberto(false)} titulo="Membros Online Agora" largura="md">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1 py-3 border-b border-border/10">
                        <div className="flex -space-x-2">
                            {membrosOnline.slice(0, 3).map((m: any) => (
                                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-background ring-2 ring-emerald-500/20 overflow-hidden">
                                    <Avatar nome={m.nome} fotoPerfil={m.foto_perfil} />
                                </div>
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            {membrosOnline.length === 0 
                                ? "Nenhum membro ativo no momento." 
                                : `${membrosOnline.length} ${membrosOnline.length === 1 ? 'membro está' : 'membros estão'} operando agora.`}
                        </p>
                    </div>
                    
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {membrosOnline.length === 0 ? (
                            <div className="py-16 flex flex-col items-center justify-center gap-4 text-muted-foreground/30">
                                <Wifi size={48} strokeWidth={1} className="opacity-20 translate-y-2 animate-bounce" />
                                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Pista Vazia</p>
                            </div>
                        ) : (
                            membrosOnline.map((m: any) => (
                                <div key={m.id} className="group flex items-center justify-between p-4 bg-white/50 border border-slate-100/80 rounded-[24px] hover:bg-white hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar nome={m.nome} fotoPerfil={m.foto_perfil} tamanho="md" />
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors uppercase leading-none">{m.nome}</span>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <div className="w-3.5 h-3.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">@</div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.email.split('@')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 text-emerald-600 rounded-full border border-emerald-500/10">
                                            <Clock size={11} className="opacity-70" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                Dês das {new Date(m.entrada_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md">
                                            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-300">Status: Operacional</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex justify-center">
                         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Hub em Tempo Real</p>
                    </div>
                </div>
            </Modal>

            {/* Modal de Detalhes do Perfil (Diferente conforme ID de entrada) */}
            {idPerfilParaVer && (
                <PerfilProvider customUsuarioId={idPerfilParaVer}>
                    <ModalEdicaoPerfil 
                        aberto={!!idPerfilParaVer} 
                        aoFechar={handleFecharPerfil} 
                    />
                </PerfilProvider>
            )}
        </div>
    );
});

export default GerenciarMembros;
