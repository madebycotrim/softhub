import { useState, useMemo, useCallback, useEffect, memo, FormEvent } from 'react';
import { UserCog, X, Shield, Mail, Trash2, Loader2, ListPlus, Download, ChevronDown, Users as UsersIcon, Plus, CheckSquare, Square, History, Search, Filter, Pencil, Check, LayoutGrid } from 'lucide-react';
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
import { ToastContainer } from '@/compartilhado/componentes/ToastContainer';
import { Paginacao } from '@/compartilhado/componentes/Paginacao';
import { FormularioCadastroMembro } from './membros/FormularioCadastroMembro';

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
    const { toasts, exibirToast } = usarToast();
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

    return { membros, carregando, erro, recarregar, salvandoIds, toasts, alterarRole, cadastrarMembro, removerMembro: useCallback(async (m: Membro) => { marcarSalvando(m.id); const res = await deletarMembro(m.id); if (res.sucesso) { await recarregar(); exibirToast(`Acesso de ${m.nome} removido.`); } else { exibirToast(res.erro ?? 'Erro ao remover.', 'erro'); } desmarcarSalvando(m.id); return res; }, [deletarMembro, recarregar, exibirToast, marcarSalvando, desmarcarSalvando]) };
}

import { LinhaMembro } from './membros/LinhaMembro';

// ─── Componente Principal ─────────────────────────────────────────────────────

export const GerenciarMembros = memo(() => {
    const { 
        membros, carregando, erro, recarregar, salvandoIds, toasts, 
        alterarRole, cadastrarMembro, removerMembro 
    } = useGerenciarMembros();
    const { configuracoes } = usarConfiguracoes();
    const { toasts: toastHook, exibirToast } = usarToast();

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

    return (
        <div className="flex flex-col h-full space-y-6 animar-entrada">
            <ToastContainer toasts={toasts.length > 0 ? toasts : toastHook} />
            
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
                    { label: 'Membros Ativos', valor: membros.length, cor: 'indigo', icone: UsersIcon, atraso: 'atraso-1' },
                    { label: 'Especialistas', valor: membros.filter(m => m.role !== 'MEMBRO').length, cor: 'emerald', icone: Shield, atraso: 'atraso-2' },
                    { label: 'Sem Equipe', valor: membros.filter(m => !m.equipe_nome).length, cor: 'rose', icone: LayoutGrid, atraso: 'atraso-3' },
                    { label: 'Novos (30d)', valor: membros.filter(m => new Date(m.criado_em) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, cor: 'blue', icone: History, atraso: 'atraso-4' }
                ].map(s => (
                    <div key={s.label} className={`bg-card border border-border/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow animar-entrada ${s.atraso}`}>
                        <div className={`p-3 bg-${s.cor}-500/10 text-${s.cor}-500 rounded-xl shadow-sm`}>
                            <s.icone size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-tight">{s.label}</span>
                            <span className="text-xl font-black text-foreground">{s.valor}</span>
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
        </div>
    );
});

export default GerenciarMembros;
