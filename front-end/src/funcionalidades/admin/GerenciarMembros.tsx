import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, UserCog, X, Shield, Mail, Trash2, Loader2, UserCheck, UserX, Archive, Users as UsersIcon, ListPlus, CheckSquare, Square, Download, CheckCircle2, AlertCircle, ChevronDown, RotateCcw, Eraser } from 'lucide-react';
import { api } from '../../compartilhado/servicos/api';
import { usarMembros } from '../membros/usarMembros';
import type { Membro } from '../membros/usarMembros';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { usarAutenticacao } from '../autenticacao/usarAutenticacao';
import { usarPermissaoAcesso } from '../../compartilhado/hooks/usarPermissao';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { ambiente } from '../../configuracoes/ambiente';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastTipo = 'sucesso' | 'erro';

interface ToastState {
    mensagem: string;
    tipo: ToastTipo;
    id: number;
}


// ─── Hook: useDebounce ────────────────────────────────────────────────────────

function useDebounce<T>(valor: T, delay = 300): T {
    const [valorDebounced, setValorDebounced] = useState(valor);

    useEffect(() => {
        const timer = setTimeout(() => setValorDebounced(valor), delay);
        return () => clearTimeout(timer);
    }, [valor, delay]);

    return valorDebounced;
}

// ─── Hook: useToast ───────────────────────────────────────────────────────────

function useToast() {
    const [toasts, setToasts] = useState<ToastState[]>([]);
    const contadorRef = useRef(0);

    const exibir = useCallback((mensagem: string, tipo: ToastTipo = 'sucesso') => {
        const id = ++contadorRef.current;
        setToasts(prev => [...prev, { mensagem, tipo, id }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    return { toasts, exibir };
}

// ─── Hook: useGerenciarMembros ────────────────────────────────────────────────

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
    const { toasts, exibir: exibirToast } = useToast();

    // Helpers estáveis para evitar recriação a cada render
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

        // Optimistic update
        atualizarMembro({ ...membro, role: roleNova });
        marcarSalvando(membro.id);

        try {
            await api.patch(`/api/usuarios/${membro.id}/role`, { role: roleNova });
            exibirToast(`Role de ${membro.nome} atualizado com sucesso.`);
        } catch (e: unknown) {
            // Reverte em caso de erro
            atualizarMembro(membro);
            const axiosError = e as { response?: { data?: { erro?: string } } };
            exibirToast(
                axiosError.response?.data?.erro ?? 'Erro ao alterar papel do membro.',
                'erro'
            );
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando]);

    const alternarStatus = useCallback(async (membro: Membro) => {
        const novoStatus = !membro.ativo;

        // Optimistic update
        atualizarMembro({ ...membro, ativo: novoStatus });
        marcarSalvando(membro.id);

        try {
            await api.patch(`/api/usuarios/${membro.id}/status`, { ativo: novoStatus });
            exibirToast(`${membro.nome} ${novoStatus ? 'ativado' : 'pausado'} com sucesso.`);
        } catch (e: unknown) {
            // Reverte em caso de erro
            atualizarMembro(membro);
            const axiosError = e as { response?: { data?: { erro?: string } } };
            exibirToast(
                axiosError.response?.data?.erro ?? 'Erro ao alterar status do membro.',
                'erro'
            );
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando]);

    const cadastrarMembro = useCallback(async (
        email: string,
        role: string,
        equipe_id?: string | null
    ): Promise<{ sucesso: boolean; erro?: string }> => {
        const res = await adicionarMembro({
            email: email.toLowerCase().trim(),
            role,
            equipe_id
        });
        if (res.sucesso) {
            await recarregar();
            exibirToast(`Acesso autorizado para ${email}.`);
        } else {
            exibirToast(res.erro ?? 'Erro ao cadastrar membro.', 'erro');
        }
        return res;
    }, [adicionarMembro, recarregar, exibirToast]);

    const removerMembro = useCallback(async (
        membro: Membro
    ): Promise<{ sucesso: boolean }> => {
        marcarSalvando(membro.id);
        const res = await deletarMembro(membro.id);

        if (res.sucesso) {
            await recarregar();
            exibirToast(`Acesso de ${membro.nome} removido.`);
        } else {
            exibirToast(res.erro ?? 'Erro ao remover membro.', 'erro');
        }

        desmarcarSalvando(membro.id);
        return res;
    }, [deletarMembro, recarregar, exibirToast, marcarSalvando, desmarcarSalvando]);

    const [equipes, setEquipes] = useState<any[]>([]);

    useEffect(() => {
        api.get('/api/organizacao/equipes')
            .then(res => setEquipes(res.data))
            .catch(() => console.error('Falha ao buscar equipes.'));
    }, []);

    const alterarEquipe = useCallback(async (membroId: string, equipeId: string | null) => {
        marcarSalvando(membroId);
        try {
            await api.patch(`/api/organizacao/alocacao/${membroId}`, { equipe_id: equipeId });
            exibirToast('Alocação de grupo atualizada.');
            recarregar();
        } catch (e: any) {
            exibirToast(e.response?.data?.erro ?? 'Erro ao trocar grupo.', 'erro');
        } finally {
            desmarcarSalvando(membroId);
        }
    }, [recarregar, exibirToast, marcarSalvando, desmarcarSalvando]);


    return {
        membros,
        equipes,
        carregando,
        erro,
        recarregar,
        salvandoIds,
        toasts,
        alterarRole,
        alternarStatus,
        alterarEquipe,
        cadastrarMembro,
        removerMembro,
        limpezaDefinitiva: useCallback(async (membroId: string) => {
            marcarSalvando(membroId);
            try {
                await api.patch(`/api/usuarios/${membroId}/limpar`);
                exibirToast('Membro removido definitivamente.');
                await recarregar();
            } catch (e: any) {
                exibirToast(e.response?.data?.erro ?? 'Erro na limpeza definitiva.', 'erro');
            } finally {
                desmarcarSalvando(membroId);
            }
        }, [recarregar, exibirToast, marcarSalvando, desmarcarSalvando]),
        esvaziarLixeira: useCallback(async () => {
            try {
                const res = await api.post('/api/usuarios/limpeza-geral');
                exibirToast(`${res.data.removidos} membros removidos definitivamente.`);
                await recarregar();
            } catch (e: any) {
                exibirToast(e.response?.data?.erro ?? 'Erro ao esvaziar lixeira.', 'erro');
            }
        }, [recarregar, exibirToast])
    };
}

// ─── Componente: ModalConvitesEmLote ──────────────────────────────────────────

interface ModalConvitesEmLoteProps {
    aberto: boolean;
    aoFechar: () => void;
    aoCadastrar: (dados: { nome: string; email: string }) => Promise<{ sucesso: boolean; erro?: string }>;
    recarregar: () => Promise<void>;
}

function ModalConvitesEmLote({ aberto, aoFechar, aoCadastrar, recarregar }: ModalConvitesEmLoteProps) {
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [progresso, setProgresso] = useState<{ total: number; atual: number } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const linhas = texto.split('\n').filter(l => l.trim().includes('@'));

        if (linhas.length === 0) return;

        setEnviando(true);
        setProgresso({ total: linhas.length, atual: 0 });

        for (const linha of linhas) {
            const emailMatch = linha.match(/[\w.-]+@[\w.-]+\.[\w.-]+/);
            if (!emailMatch) continue;

            const email = emailMatch[0].toLowerCase().trim();
            // O nome será preenchido pelo prefixo do e-mail no backend ou pelo MSAL no login
            await aoCadastrar({ nome: '', email });
            setProgresso(prev => prev ? { ...prev, atual: prev.atual + 1 } : null);
        }

        await recarregar();
        setEnviando(false);
        setProgresso(null);
        setTexto('');
        aoFechar();
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Convites em Lote">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Cole uma lista de e-mails institucionais (um por linha). O sistema autorizará o acesso de todos automaticamente.
                        <br /><br />
                        <strong>Formato aceito:</strong>
                        <br />- nome@{ambiente.dominioInstitucional}
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Lista de Convites</label>
                    <textarea
                        value={texto}
                        onChange={e => setTexto(e.target.value)}
                        placeholder={`Ex: mateus@${ambiente.dominioInstitucional}`}
                        className="w-full h-48 bg-background border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={aoFechar}
                        className="px-4 py-2 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={enviando || !texto.trim()}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {enviando ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {progresso ? `Enviando (${progresso.atual}/${progresso.total})` : 'Enviando...'}
                            </>
                        ) : (
                            <>Enviar Convites</>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ─── Componente: ToastContainer ───────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: ToastState[] }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium
                        animate-in slide-in-from-bottom-2 fade-in duration-300
                        ${toast.tipo === 'sucesso'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        }
                    `}
                >
                    {toast.tipo === 'sucesso'
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <AlertCircle className="w-4 h-4 shrink-0" />
                    }
                    {toast.mensagem}
                </div>
            ))}
        </div>
    );
}

// ─── Componente: LinhaMembro ──────────────────────────────────────────────────

interface LinhaMembroProps {
    membro: Membro;
    salvando: boolean;
    selecionado: boolean;
    onToggleSelect: (id: string, isShift?: boolean) => void;
    onAlterarRole: (membro: Membro, role: string) => void;
    onAlterarEquipe: (membroId: string, equipeId: string | null) => void;
    equipes: any[];
    onAlternarStatus: (membro: Membro) => void;
    onSolicitarExclusao: (membro: Membro) => void;
    onLimpezaDefinitiva: (membro: Membro) => void;
}

function LinhaMembro({
    membro,
    salvando,
    selecionado,
    onToggleSelect,
    onAlterarRole,
    onAlterarEquipe,
    equipes,
    onAlternarStatus,
    onSolicitarExclusao,
    onLimpezaDefinitiva,
}: LinhaMembroProps) {
    const { usuario } = usarAutenticacao();
    const ehOMesmoUsuario = usuario?.id === membro.id;
    const podeAlterarRole = usarPermissaoAcesso('membros:alterar_role');
    const podeDesativar = usarPermissaoAcesso('membros:desativar');


    // Identifica os dois grupos disponíveis dinamicamente (os dois primeiros encontrados)
    const idsGrupos = Array.from(new Set(equipes.map(e => e.grupo_id)));

    // Equipe representante de cada grupo (para poder alocar o membro)
    const equipeA = equipes.find(e => e.grupo_id === idsGrupos[0]);
    const equipeB = equipes.find(e => e.grupo_id === idsGrupos[1]);

    const isGrupoA = idsGrupos[0] && membro.grupo_id === idsGrupos[0];
    const isGrupoB = idsGrupos[1] && membro.grupo_id === idsGrupos[1];


    return (
        <div
            className={`flex flex-col lg:grid lg:grid-cols-12 gap-4 p-4 items-start lg:items-center border-b border-border/50 hover:bg-muted/30 transition-colors ${salvando ? 'opacity-60 pointer-events-none' : ''} ${selecionado ? 'bg-primary/5 ring-1 ring-inset ring-primary/10 lg:ring-0' : ''}`}
            aria-busy={salvando}
        >
            {/* Seleção e Identificação (Lado a Lado no Mobile) */}
            <div className="flex items-center gap-3 w-full lg:col-span-6">
                <div className="flex shrink-0">
                    <button
                        onClick={(e) => !ehOMesmoUsuario && onToggleSelect(membro.id, e.shiftKey)}
                        className={`transition-colors focus:outline-none p-2 -m-2 ${ehOMesmoUsuario ? 'cursor-not-allowed text-muted-foreground/5' : 'text-muted-foreground/30 hover:text-primary'}`}
                        disabled={ehOMesmoUsuario}
                        aria-label={`Selecionar ${membro.nome}`}
                    >
                        {selecionado ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
                    </button>
                </div>

                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" />
                    <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm leading-tight truncate">
                            {membro.nome}
                        </p>
                        <p className="text-[11px] text-muted-foreground opacity-70 truncate leading-tight mt-0.5">
                            {membro.email}
                        </p>
                    </div>
                </div>

                {/* Status Mobile (Badge Simplificado) */}
                <div className="lg:hidden shrink-0 ml-auto flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${membro.ativo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/20'}`} />
                </div>
            </div>

            {/* Role / Papel / Grupo */}
            <div className="grid grid-cols-2 lg:contents gap-4 w-full lg:w-auto">
                {/* Role / Papel */}
                <div className="lg:col-span-1">
                    <label className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 block">Papel</label>
                    <div className="relative">
                        <select
                            aria-label={`Papel de ${membro.nome}`}
                            className={`w-full bg-muted/20 border border-border/50 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none ${!podeAlterarRole ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            value={membro.role}
                            onChange={e => onAlterarRole(membro, e.target.value)}
                            disabled={!podeAlterarRole}
                        >
                            <option value="MEMBRO">Membro</option>
                            <option value="SUBLIDER">Sublíder</option>
                            <option value="LIDER">Líder</option>
                            <option value="GESTOR">Gestor</option>
                            <option value="COORDENADOR">Coordenador</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 lg:hidden" />
                    </div>
                </div>

                {/* Grupo */}
                <div className="lg:col-span-1 flex flex-col lg:items-center">
                    <label className="lg:hidden text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 block">Grupo</label>
                    <div className="flex bg-muted/20 p-0.5 rounded-2xl border border-border/50 w-fit">
                        <button
                            onClick={() => onAlterarEquipe(membro.id, isGrupoA ? null : (equipeA?.id || null))}
                            title={equipeA?.grupo_nome || 'Grupo A'}
                            disabled={!equipeA}
                            className={`w-9 lg:w-8 py-1.5 lg:py-1 rounded-xl text-[10px] font-black transition-all ${isGrupoA ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50'}`}
                        >
                            A
                        </button>
                        <button
                            onClick={() => onAlterarEquipe(membro.id, isGrupoB ? null : (equipeB?.id || null))}
                            title={equipeB?.grupo_nome || 'Grupo B'}
                            disabled={!equipeB}
                            className={`w-9 lg:w-8 py-1.5 lg:py-1 rounded-xl text-[10px] font-black transition-all ${isGrupoB ? 'bg-indigo-500 text-white shadow-sm' : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50'}`}
                        >
                            B
                        </button>
                    </div>
                </div>
            </div>

            {/* Status Desktop */}
            <div className="hidden lg:flex lg:col-span-2 justify-center">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${membro.ativo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/20'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${membro.ativo ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
                        {membro.ativo ? 'Ativo' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 w-full lg:w-auto lg:col-span-2 pt-3 lg:pt-0 border-t border-border/40 lg:border-0">
                {!ehOMesmoUsuario && podeDesativar && (
                    <>
                        <button
                            onClick={membro.ativo ? () => onSolicitarExclusao(membro) : () => onAlternarStatus(membro)}
                            title={membro.ativo ? "Arquivar membro" : "Restaurar membro"}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 lg:p-2 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest ${membro.ativo
                                ? 'text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/5'
                                : 'text-emerald-500 hover:bg-emerald-500/5'}`}
                        >
                            {salvando ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : membro.ativo ? (
                                <>
                                    <Trash2 size={16} />
                                    <span className="lg:hidden">Arquivar</span>
                                </>
                            ) : (
                                <>
                                    <RotateCcw size={16} />
                                    <span className="lg:hidden">Restaurar</span>
                                </>
                            )}
                        </button>

                        {!membro.ativo && (
                            <button
                                onClick={() => onLimpezaDefinitiva(membro)}
                                title="Limpeza definitiva (sumir do mapa)"
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 lg:p-2 rounded-xl text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/5 transition-all text-[11px] font-black uppercase tracking-widest"
                            >
                                <Eraser size={16} />
                                <span className="lg:hidden">Excluir</span>
                            </button>
                        )}
                    </>
                )}
                {ehOMesmoUsuario && (
                    <span className="text-[10px] text-primary/50 font-black uppercase tracking-widest italic pr-2">Seu Perfil</span>
                )}
            </div>
        </div>
    );
}

// ─── Componente: BulkActions ──────────────────────────────────────────────────

interface BulkActionsProps {
    selecionados: Set<string>;
    onClear: () => void;
    onBulkUpdate: (tipo: 'arquivar' | 'role', valor?: string) => void;
    onExport: () => void;
}

function BulkActions({ selecionados, onClear, onBulkUpdate, onExport }: BulkActionsProps) {
    const podeDesativar = usarPermissaoAcesso('membros:desativar');
    const podeAlterarRole = usarPermissaoAcesso('membros:alterar_role');

    if (selecionados.size === 0) return null;

    return (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-card/95 backdrop-blur-xl border border-primary/30 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between w-full sm:w-auto sm:border-r sm:border-border sm:pr-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20">
                        {selecionados.size}
                    </div>
                    <span className="text-sm font-black text-foreground uppercase tracking-widest">Selecionados</span>
                </div>
                <button
                    onClick={onClear}
                    className="ml-4 p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-lg lg:bg-transparent"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
                {podeDesativar && (
                    <button
                        onClick={() => onBulkUpdate('arquivados' as any)}
                        className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                    >
                        <Archive size={14} /> Arquivar
                    </button>
                )}

                {podeAlterarRole && (
                    <div className="relative group/bulk-role shrink-0">
                        <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20">
                            <Shield size={14} /> Cargo <ChevronDown size={14} />
                        </button>
                        <div className="absolute bottom-full left-0 mb-3 w-44 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden hidden group-hover/bulk-role:block animate-in fade-in slide-in-from-bottom-2 z-[60]">
                            {['MEMBRO', 'SUBLIDER', 'LIDER', 'GESTOR', 'COORDENADOR', 'ADMIN'].map(role => (
                                <button
                                    key={role}
                                    onClick={() => onBulkUpdate('role', role)}
                                    className="w-full text-left px-4 py-3 hover:bg-accent text-[11px] font-black uppercase tracking-widest transition-colors border-b border-border/50 last:border-0"
                                >
                                    {role === 'ADMIN' ? 'Administrador' : role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={onExport}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-muted hover:bg-muted/80 text-foreground transition-all border border-border"
                >
                    <Download size={14} /> Exportar
                </button>
            </div>
        </div>
    );
}

// ─── Componente: ModalCadastroMembro ──────────────────────────────────────────

interface ModalCadastroProps {
    aberto: boolean;
    aoFechar: () => void;
    aoCadastrar: (email: string, role: string, equipeId: string | null) => Promise<{ sucesso: boolean; erro?: string }>;
    equipes: any[];
}

function ModalCadastroMembro({ aberto, aoFechar, aoCadastrar, equipes }: ModalCadastroProps) {
    const [passo, setPasso] = useState(1);
    const [usuarioEmail, setUsuarioEmail] = useState('');
    const [dominio, setDominio] = useState('@unieuro.com.br');
    const [role, setRole] = useState('MEMBRO');
    const [equipeId, setEquipeId] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (aberto) {
            setPasso(1);
            setUsuarioEmail('');
            setDominio('@unieuro.com.br');
            setRole('MEMBRO');
            setEquipeId(null);
            setErro(null);
        }
    }, [aberto]);

    const handleSubmit = async () => {
        if (passo === 1) {
            if (!usuarioEmail.trim()) {
                setErro('Por favor, informe o e-mail.');
                return;
            }
            setPasso(2);
            return;
        }

        setSalvando(true);
        setErro(null);

        const emailCompleto = `${usuarioEmail.trim().toLowerCase()}${dominio}`;
        const res = await aoCadastrar(emailCompleto, role, equipeId);
        setSalvando(false);

        if (res.sucesso) {
            aoFechar();
        } else {
            setErro(res.erro ?? 'Erro ao cadastrar membro.');
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo={passo === 1 ? "Cadastro - Passo 1: Identificação" : "Cadastro - Passo 2: Alocação"} largura="md">
            <div className="space-y-5 py-2">
                {passo === 1 ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">E-mail Institucional</label>
                            <div className="relative group/email">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors z-10" />
                                <div className="flex items-center w-full bg-background border border-border rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
                                    <input
                                        type="text"
                                        placeholder="ex: nome.sobrenome"
                                        value={usuarioEmail}
                                        onChange={e => setUsuarioEmail(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                        className="flex-1 bg-transparent pl-10 pr-2 py-2.5 text-sm focus:outline-none"
                                    />
                                    <div className="flex items-center h-full border-l border-border px-3 relative">
                                        <select
                                            value={dominio}
                                            onChange={e => setDominio(e.target.value)}
                                            className="bg-transparent text-[13px] font-semibold focus:outline-none cursor-pointer appearance-none pr-5"
                                        >
                                            <option value={`@${ambiente.dominioInstitucional}`}>@{ambiente.dominioInstitucional}</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 pointer-events-none opacity-40" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nível de Acesso</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="w-full bg-background border border-border rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="MEMBRO">Membro (Padrão)</option>
                                    <option value="SUBLIDER">Sublíder</option>
                                    <option value="LIDER">Líder</option>
                                    <option value="GESTOR">Gestor</option>
                                    <option value="COORDENADOR">Coordenador</option>
                                    <option value="ADMIN">Administrador Geral</option>
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Alocação de Grupo</label>
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from(new Set(equipes.map(e => e.grupo_id))).map((idG, ix) => {
                                    const ex = equipes.find(eq => eq.grupo_id === idG);
                                    return ex ? (
                                        <button
                                            key={idG}
                                            type="button"
                                            onClick={() => setEquipeId(ex.id)}
                                            className={`p-3 rounded-2xl border text-center transition-all ${equipeId === ex.id ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'border-border text-muted-foreground hover:bg-muted'}`}
                                        >
                                            <UsersIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                            <span className="text-[11px] font-bold uppercase">{ex.grupo_nome || `Grupo ${ix + 1}`}</span>
                                        </button>
                                    ) : null;
                                })}
                                <button
                                    type="button"
                                    onClick={() => setEquipeId(null)}
                                    className={`p-3 rounded-2xl border text-center transition-all ${equipeId === null ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-sm' : 'border-border text-muted-foreground hover:bg-muted'}`}
                                >
                                    <UserX className="w-5 h-5 mx-auto mb-1 opacity-50" />
                                    <span className="text-[11px] font-bold uppercase">Sem Grupo</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {erro && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs flex items-center gap-2 animate-in shake duration-300">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    {passo === 2 && (
                        <button type="button" onClick={() => setPasso(1)} disabled={salvando} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground mr-auto transition-colors">Voltar</button>
                    )}
                    <button type="button" onClick={aoFechar} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                    <button
                        type="button"
                        disabled={salvando || (passo === 1 && !usuarioEmail.trim())}
                        onClick={handleSubmit}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : passo === 1 ? 'Continuar' : 'Finalizar Cadastro'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Componente: StatsCards ───────────────────────────────────────────────────

function StatsCards({ membros }: { membros: Membro[] }) {
    const stats = useMemo(() => {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

        const novosEsteMes = membros.filter(m => new Date(m.criado_em) >= inicioMes).length;
        const totalAtivos = membros.filter(m => m.ativo).length;
        const totalLideres = membros.filter(m => ['SUBLIDER', 'LIDER', 'GESTOR', 'COORDENADOR', 'ADMIN'].includes(m.role)).length;
        const totalVisitantes = membros.filter(m => m.role === 'VISITANTE' || !m.role).length; // Fallback para registros antigos ou sem role

        return {
            total: membros.length,
            novos: novosEsteMes,
            ativos: totalAtivos,
            lideres: totalLideres,
            visitantes: totalVisitantes
        };
    }, [membros]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
                { label: 'Total de Membros', valor: stats.total, icone: UsersIcon, cor: 'text-primary', bg: 'bg-primary/5', detalhe: stats.novos > 0 ? `+${stats.novos} este mês` : null },
                { label: 'Membros Ativos', valor: stats.ativos, icone: UserCheck, cor: 'text-emerald-500', bg: 'bg-emerald-500/5', detalhe: stats.total > 0 ? `${Math.round((stats.ativos / stats.total) * 100)}%` : null },
                { label: 'Lideranças', valor: stats.lideres, icone: Shield, cor: 'text-purple-400', bg: 'bg-purple-400/5', detalhe: 'Líderes & Admins' },
                { label: 'Visitantes', valor: stats.visitantes, icone: Mail, cor: 'text-amber-500', bg: 'bg-amber-500/5', detalhe: 'Aguardando Papel' },
            ].map((card) => (
                <div key={card.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.cor} flex items-center justify-center shrink-0`}>
                        <card.icone size={20} />
                    </div>
                    <div className="min-w-0">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{card.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-foreground">{card.valor}</span>
                            {card.detalhe && (
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {card.detalhe}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Componente Principal: GerenciarMembros ───────────────────────────────────

export function GerenciarMembros() {
    const {
        membros,
        carregando,
        erro,
        salvandoIds,
        toasts,
        alterarRole,
        alternarStatus,
        alterarEquipe,
        equipes,
        cadastrarMembro,
        removerMembro,
        limpezaDefinitiva,
        esvaziarLixeira
    } = useGerenciarMembros();

    const [modalLimpagemAberta, setModalLimpagemAberta] = useState(false);
    const [membroParaLimpar, setMembroParaLimpar] = useState<Membro | null>(null);

    const [busca, setBusca] = useState('');
    const buscaDebounced = useDebounce(busca, 300);
    const [abaAtiva, setAbaAtiva] = useState<'ativos' | 'arquivados'>('ativos');
    const [modalAberto, setModalAberto] = useState(false);
    const [modalLoteAberto, setModalLoteAberto] = useState(false);
    const [membroParaExcluir, setMembroParaExcluir] = useState<Membro | null>(null);
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [ultimoIdSelecionado, setUltimoIdSelecionado] = useState<string | null>(null);

    const podeCadastrar = usarPermissaoAcesso('membros:gerenciar');
    const podeDesativar = usarPermissaoAcesso('membros:desativar');

    const membrosFiltrados = useMemo(() => {
        let lista = membros;

        // Filtro por Aba
        lista = lista.filter(m => abaAtiva === 'ativos' ? m.ativo : !m.ativo);

        // Filtro por Busca
        if (buscaDebounced.trim()) {
            const lower = buscaDebounced.toLowerCase();
            lista = lista.filter(m =>
                (m.nome?.toLowerCase() ?? '').includes(lower) ||
                (m.email?.toLowerCase() ?? '').includes(lower)
            );
        }

        return lista;
    }, [membros, buscaDebounced, abaAtiva]);

    const toggleSelecionado = useCallback((id: string, isShiftPressed?: boolean) => {
        setSelecionados(prev => {
            const next = new Set(prev);

            if (isShiftPressed && ultimoIdSelecionado) {
                const idsFiltrados = membrosFiltrados.map(m => m.id);
                const idxAtual = idsFiltrados.indexOf(id);
                const idxUltimo = idsFiltrados.indexOf(ultimoIdSelecionado);

                if (idxAtual !== -1 && idxUltimo !== -1) {
                    const [inicio, fim] = [Math.min(idxAtual, idxUltimo), Math.max(idxAtual, idxUltimo)];
                    const rangeIds = idsFiltrados.slice(inicio, fim + 1);

                    // Se o último estava selecionado, seleciona o range. Se não, deseleciona.
                    const selecionando = prev.has(ultimoIdSelecionado);
                    rangeIds.forEach(rangeId => {
                        if (selecionando) next.add(rangeId);
                        else next.delete(rangeId);
                    });

                    setUltimoIdSelecionado(id);
                    return next;
                }
            }

            if (next.has(id)) next.delete(id);
            else next.add(id);

            setUltimoIdSelecionado(id);
            return next;
        });
    }, [membrosFiltrados, ultimoIdSelecionado]);

    const onBulkUpdate = async (tipo: 'arquivar' | 'role', valor?: string) => {
        const ids = Array.from(selecionados);
        const membrosAlvo = membros.filter(m => ids.includes(m.id));

        for (const membro of membrosAlvo) {
            if (tipo === 'arquivar') await alternarStatus(membro);
            else if (tipo === 'role' && valor) await alterarRole(membro, valor);
        }
        setSelecionados(new Set());
    };

    const onExportMembers = () => {
        const ids = Array.from(selecionados);
        const alvo = membros.filter(m => ids.includes(m.id));

        let csv = 'Nome,Email,Role,Status,Criado Em\n';
        alvo.forEach(m => {
            csv += `${m.nome},${m.email},${m.role},${m.ativo ? 'Ativo' : 'Inativo'},${m.criado_em}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `membros_selecionados_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleDeletar = async () => {
        if (!membroParaExcluir) return;
        const res = await removerMembro(membroParaExcluir);
        if (res.sucesso) setMembroParaExcluir(null);
    };

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-red-400 text-center py-8">{erro}</p>;

    return (
        <div className="w-full space-y-10 flex flex-col h-full bg-background animate-in fade-in duration-500 pb-10">
            <CabecalhoFuncionalidade
                titulo="Gerenciar Membros"
                subtitulo="Controle de acesso, papéis e ativação de contas."
                icone={UserCog}
            >
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            aria-label="Buscar membro"
                            className="block w-full pl-9 pr-3 py-2 border border-border rounded-xl leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                            placeholder="Buscar membro..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setAbaAtiva(prev => prev === 'ativos' ? 'arquivados' : 'ativos')}
                        title={abaAtiva === 'ativos' ? "Ver Arquivados" : "Ver Ativos"}
                        className={`
                            p-2 rounded-xl border transition-all duration-300 relative group/archive
                            ${abaAtiva === 'arquivados'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                : 'bg-background border-border hover:border-primary/30 text-muted-foreground hover:text-primary'
                            }
                        `}
                    >
                        <Archive size={18} />
                        {abaAtiva === 'arquivados' && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-background" />
                        )}
                    </button>

                    {abaAtiva === 'arquivados' && membrosFiltrados.length > 0 && podeDesativar && (
                        <button
                            onClick={() => setModalLimpagemAberta(true)}
                            className="w-full sm:w-auto bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-amber-500/20"
                        >
                            <Trash2 className="w-4 h-4" /> Esvaziar Lixeira
                        </button>
                    )}

                    {podeCadastrar && (
                        <>
                            <button
                                onClick={() => setModalLoteAberto(true)}
                                className="w-full sm:w-auto bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                <ListPlus className="w-4 h-4" /> Convites em Lote
                            </button>


                            <button
                                onClick={() => setModalAberto(true)}
                                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                <UserCog className="w-4 h-4" /> Cadastrar Membro
                            </button>
                        </>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <StatsCards membros={membros} />


            <div className="flex-1 bg-card border border-border rounded-xl flex flex-col shadow-sm overflow-hidden">
                {/* Cabeçalho da tabela - Oculto no mobile */}
                <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/80 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] items-center">
                    <div className="col-span-1 flex justify-center">
                        <button
                            onClick={() => {
                                if (selecionados.size === membrosFiltrados.length && membrosFiltrados.length > 0) {
                                    setSelecionados(new Set());
                                } else {
                                    setSelecionados(new Set(membrosFiltrados.map(m => m.id)));
                                }
                            }}
                            className="hover:text-primary transition-colors"
                        >
                            {selecionados.size > 0 && selecionados.size === membrosFiltrados.length
                                ? <CheckSquare size={18} className="text-primary" />
                                : selecionados.size > 0
                                    ? <div className="w-[18px] h-[18px] bg-primary rounded flex items-center justify-center text-white shadow-sm"><X size={12} strokeWidth={3} /></div>
                                    : <Square size={18} />
                            }
                        </button>
                    </div>
                    <div className="col-span-5 pl-2">Membro</div>
                    <div className="col-span-1">Papel</div>
                    <div className="col-span-1 text-center">GRUPO</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-right pr-4 tracking-normal">Ações</div>
                </div>

                {/* Corpo da tabela */}
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {membrosFiltrados.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/30">
                                {abaAtiva === 'ativos' ? <UserCheck size={24} /> : <UserX size={24} />}
                            </div>
                            <p className="text-sm font-medium">
                                {busca.trim()
                                    ? `Nenhum membro encontrado em "${abaAtiva}" para a busca "${busca}".`
                                    : abaAtiva === 'ativos' ? 'Nenhum membro ativo no sistema.' : 'Nenhum membro arquivado.'
                                }
                            </p>
                        </div>
                    ) : (
                        membrosFiltrados.map(membro => (
                            <LinhaMembro
                                key={membro.id}
                                membro={membro}
                                salvando={salvandoIds.has(membro.id)}
                                selecionado={selecionados.has(membro.id)}
                                onToggleSelect={toggleSelecionado}
                                onAlterarRole={alterarRole}
                                onAlterarEquipe={alterarEquipe}
                                equipes={equipes}
                                onAlternarStatus={alternarStatus}
                                onSolicitarExclusao={setMembroParaExcluir}
                                onLimpezaDefinitiva={setMembroParaLimpar}
                            />
                        ))
                    )}
                </div>
            </div>

            <ModalCadastroMembro
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                aoCadastrar={cadastrarMembro}
                equipes={equipes}
            />

            <ModalConvitesEmLote
                aberto={modalLoteAberto}
                aoFechar={() => setModalLoteAberto(false)}
                aoCadastrar={async (dados) => {
                    const res = await cadastrarMembro(dados.email, 'MEMBRO');
                    return res;
                }}
                recarregar={async () => {
                    // O cadastrarMembro já recarrega, mas garantimos
                }}
            />

            <BulkActions
                selecionados={selecionados}
                onClear={() => setSelecionados(new Set())}
                onBulkUpdate={onBulkUpdate}
                onExport={onExportMembers}
            />

            <ConfirmacaoExclusao
                aberto={!!membroParaExcluir}
                aoFechar={() => setMembroParaExcluir(null)}
                aoConfirmar={handleDeletar}
                titulo="Remover acesso do membro?"
                descricao={`Esta ação desativará o acesso de ${membroParaExcluir?.nome ?? 'membro'} (@${membroParaExcluir?.email}) imediatamente. Os dados de histórico e logs serão preservados no sistema.`}
                textoBotao="Sim, Remover Acesso"
                carregando={salvandoIds.has(membroParaExcluir?.id ?? '')}
            />

            <ConfirmacaoExclusao
                aberto={!!membroParaLimpar}
                aoFechar={() => setMembroParaLimpar(null)}
                aoConfirmar={async () => {
                    if (membroParaLimpar) {
                        await limpezaDefinitiva(membroParaLimpar.id);
                        setMembroParaLimpar(null);
                    }
                }}
                titulo="Limpar registro definitivamente?"
                descricao={`Esta ação removerá ${membroParaLimpar?.nome} totalmente da interface administrativa. O registro permanecerá no banco de dados para auditoria, mas não poderá mais ser visto ou restaurado por aqui.`}
                textoBotao="Limpar do Mapa"
                carregando={salvandoIds.has(membroParaLimpar?.id ?? '')}
            />

            <ConfirmacaoExclusao
                aberto={modalLimpagemAberta}
                aoFechar={() => setModalLimpagemAberta(false)}
                aoConfirmar={async () => {
                    await esvaziarLixeira();
                    setModalLimpagemAberta(false);
                }}
                titulo="Esvaziar Lixeira?"
                descricao={`Todos os ${membrosFiltrados.length} membros arquivados sumirão definitivamente desta visualização. Esta ação é voltada para limpeza da interface e NÃO pode ser desfeita.`}
                textoBotao="Esvaziar Agora"
            />

            <ToastContainer toasts={toasts} />
        </div >
    );
}