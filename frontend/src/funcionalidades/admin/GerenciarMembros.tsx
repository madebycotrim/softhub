import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, UserCog, Check, X, Shield, Mail, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../compartilhado/servicos/api';
import { usarMembros } from '../membros/usarMembros';
import type { Membro } from '../membros/usarMembros';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '../../compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '../../compartilhado/componentes/ConfirmacaoExclusao';
import { ambiente } from '@/configuracoes/ambiente';

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
        role: string
    ): Promise<{ sucesso: boolean; erro?: string }> => {
        const res = await adicionarMembro({ email: email.toLowerCase().trim(), role });
        if (res.sucesso) {
            // Força refetch para garantir que a lista exibida reflita o banco,
            // independentemente de qual instância do hook recebeu o insert local.
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

    return {
        membros,
        carregando,
        erro,
        recarregar,
        salvandoIds,
        toasts,
        alterarRole,
        alternarStatus,
        cadastrarMembro,
        removerMembro,
    };
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
                        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
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
    onAlterarRole: (membro: Membro, role: string) => void;
    onAlternarStatus: (membro: Membro) => void;
    onSolicitarExclusao: (membro: Membro) => void;
}

function LinhaMembro({
    membro,
    salvando,
    onAlterarRole,
    onAlternarStatus,
    onSolicitarExclusao,
}: LinhaMembroProps) {
    return (
        <div
            className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-accent/50 transition-colors ${salvando ? 'opacity-60 pointer-events-none' : ''}`}
            aria-busy={salvando}
        >
            {/* Membro */}
            <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" />
                <div className="min-w-0">
                    <p className="font-bold text-card-foreground text-sm truncate leading-tight">
                        {membro.nome}
                    </p>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {membro.email}
                        </p>
                        {(membro.equipe_nome || membro.grupo_nome) && (
                            <p className="text-[10px] text-primary font-medium truncate uppercase tracking-tight">
                                {membro.grupo_nome ?? ''}
                                {membro.equipe_nome ? ` • ${membro.equipe_nome}` : ''}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Role */}
            <div className="col-span-3 sm:col-span-3">
                <div className="relative w-full max-w-[180px]">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                        aria-label={`Papel de ${membro.nome}`}
                        className="w-full bg-background border border-input rounded-lg pl-8 pr-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:border-primary/50 transition-colors appearance-none cursor-pointer"
                        value={membro.role}
                        onChange={e => onAlterarRole(membro, e.target.value)}
                    >
                        <option value="VISITANTE">Visitante</option>
                        <option value="MEMBRO">Membro</option>
                        <option value="LIDER_EQUIPE">Líder Equipe</option>
                        <option value="LIDER_GRUPO">Líder Grupo</option>
                        <option value="ADMIN">Admin Geral</option>
                    </select>
                </div>
            </div>

            {/* Status */}
            <div className="col-span-2">
                {membro.ativo
                    ? <Emblema texto="Ativo" variante="verde" />
                    : <Emblema texto="Inativo" variante="vermelho" />
                }
            </div>

            {/* Ações */}
            <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                    onClick={() => onAlternarStatus(membro)}
                    aria-label={membro.ativo ? `Pausar ${membro.nome}` : `Ativar ${membro.nome}`}
                    className={`
                        min-w-[90px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all
                        ${membro.ativo
                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/10'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/10'
                        }
                    `}
                >
                    {salvando
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : membro.ativo
                            ? <><X className="w-3 h-3" /> Pausar</>
                            : <><Check className="w-3 h-3" /> Ativar</>
                    }
                </button>

                <button
                    onClick={() => onSolicitarExclusao(membro)}
                    aria-label={`Remover acesso de ${membro.nome}`}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/20"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Componente: ModalCadastroMembro ──────────────────────────────────────────

interface ModalCadastroProps {
    aberto: boolean;
    aoFechar: () => void;
    aoCadastrar: (email: string, role: string) => Promise<{ sucesso: boolean }>;
}

function ModalCadastroMembro({ aberto, aoFechar, aoCadastrar }: ModalCadastroProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('MEMBRO');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Limpa o formulário ao abrir
    useEffect(() => {
        if (aberto) {
            setEmail('');
            setRole('MEMBRO');
            setErro(null);
        }
    }, [aberto]);

    // Não usa <form> com onSubmit para manter consistência com o padrão shadcn/ui
    const handleSubmit = async () => {
        if (!email.trim()) return;

        setSalvando(true);
        setErro(null);

        const res = await aoCadastrar(email, role);
        setSalvando(false);

        if (res.sucesso) {
            aoFechar();
        } else {
            setErro('Erro ao cadastrar membro. Verifique o e-mail e tente novamente.');
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Cadastrar Novo Membro" largura="md">
            <div className="space-y-5 py-2">
                <div className="space-y-2">
                    <label
                        htmlFor="email-membro"
                        className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1"
                    >
                        E-mail Institucional (@{ambiente.dominioInstitucional})
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            id="email-membro"
                            type="email"
                            required
                            placeholder={`ex: nome.sobrenome@${ambiente.dominioInstitucional}`}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="role-membro"
                        className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1"
                    >
                        Nível de Acesso Inicial
                    </label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            id="role-membro"
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="MEMBRO">Membro (Padrão)</option>
                            <option value="LIDER_EQUIPE">Líder de Equipe</option>
                            <option value="LIDER_GRUPO">Líder de Grupo</option>
                            <option value="ADMIN">Administrador Geral</option>
                            <option value="VISITANTE">Visitante</option>
                        </select>
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-1">
                        O usuário terá este acesso assim que realizar o primeiro login com o e-mail acima.
                    </p>
                </div>

                {erro && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={aoFechar}
                        className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={salvando || !email.trim()}
                        onClick={handleSubmit}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {salvando
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                            : 'Autorizar Acesso'
                        }
                    </button>
                </div>
            </div>
        </Modal>
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
        cadastrarMembro,
        removerMembro,
    } = useGerenciarMembros();

    const [busca, setBusca] = useState('');
    const buscaDebounced = useDebounce(busca, 300);
    const [modalAberto, setModalAberto] = useState(false);
    const [membroParaExcluir, setMembroParaExcluir] = useState<Membro | null>(null);

    const membrosFiltrados = useMemo(() => {
        if (!buscaDebounced.trim()) return membros;
        const lower = buscaDebounced.toLowerCase();
        return membros.filter(m =>
            (m.nome?.toLowerCase() ?? '').includes(lower) ||
            (m.email?.toLowerCase() ?? '').includes(lower)
        );
    }, [membros, buscaDebounced]);

    const handleDeletar = async () => {
        if (!membroParaExcluir) return;
        const res = await removerMembro(membroParaExcluir);
        if (res.sucesso) setMembroParaExcluir(null);
    };

    if (carregando) return <Carregando />;
    if (erro) return <p className="text-red-400 text-center py-8">{erro}</p>;

    return (
        <div className="space-y-6 flex flex-col h-full bg-background">
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
                        onClick={() => setModalAberto(true)}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                        <UserCog className="w-4 h-4" /> Cadastrar Membro
                    </button>
                </div>
            </CabecalhoFuncionalidade>

            <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden">
                {/* Cabeçalho da tabela */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/80 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="col-span-5 sm:col-span-4">Membro</div>
                    <div className="col-span-3 sm:col-span-3">Nível de Acesso (Role)</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-right">Ações Rápidas</div>
                </div>

                {/* Corpo da tabela */}
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {membrosFiltrados.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground min-h-[300px] flex flex-col items-center justify-center">
                            <p>Nenhum membro encontrado na busca.</p>
                        </div>
                    ) : (
                        membrosFiltrados.map(membro => (
                            <LinhaMembro
                                key={membro.id}
                                membro={membro}
                                salvando={salvandoIds.has(membro.id)}
                                onAlterarRole={alterarRole}
                                onAlternarStatus={alternarStatus}
                                onSolicitarExclusao={setMembroParaExcluir}
                            />
                        ))
                    )}
                </div>
            </div>

            <ModalCadastroMembro
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                aoCadastrar={cadastrarMembro}
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

            <ToastContainer toasts={toasts} />
        </div>
    );
}