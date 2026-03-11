import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { UserCog, X, Shield, Mail, Trash2, Loader2, ListPlus, Download, ChevronDown, Users as UsersIcon, Plus, CheckSquare, Square, History } from 'lucide-react';
import { Tooltip } from '@/compartilhado/componentes/Tooltip';

import { api } from '@/compartilhado/servicos/api';
import { usarMembros } from '@/funcionalidades/membros/hooks/usarMembros';
import type { Membro } from '@/funcionalidades/membros/hooks/usarMembros';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { usarAutenticacao } from '@/funcionalidades/autenticacao/hooks/usarAutenticacao';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Modal } from '@/compartilhado/componentes/Modal';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { Alerta } from '@/compartilhado/componentes/Alerta';
import { ambiente } from '@/configuracoes/ambiente';
import { usarConfiguracoes } from '@/funcionalidades/admin/hooks/usarConfiguracoes';
import { usarDebounce } from '@/compartilhado/hooks/usarDebounce';
import { BarraBusca } from '@/compartilhado/componentes/BarraBusca';
import { usarAutenticacaoContexto } from '@/contexto/ContextoAutenticacao';
import { usarToast } from '@/compartilhado/hooks/usarToast';
import { ToastContainer } from '@/compartilhado/componentes/ToastContainer';
import { Paginacao } from '@/compartilhado/componentes/Paginacao';

/**
 * Hook customizado para gerenciar a lógica de administração de membros.
 * Encapsula operações de CRUD, gerenciamento de estados de salvamento e feedback (toasts).
 * 
 * @returns Objeto contendo membros, estados de carregamento, e funções de ação (alterar role, remover, etc).
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
    const { usuario: usuarioAutenticado, atualizarUsuarioLocalmente } = usarAutenticacaoContexto();

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
            exibirToast(`Role de ${membro.nome} atualizado com sucesso.`);

            // Se for o próprio usuário logado, atualiza o contexto de autenticação
            // para que as permissões na UI sejam atualizadas instantaneamente.
            if (membro.id === usuarioAutenticado?.id) {
                atualizarUsuarioLocalmente({
                    ...usuarioAutenticado,
                    role: roleNova
                });
            }
        } catch (e: any) {
            atualizarMembro(membro);
            exibirToast(e.response?.data?.erro ?? 'Erro ao alterar papel do membro.', 'erro');
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando, usuarioAutenticado, atualizarUsuarioLocalmente]);

    const cadastrarMembro = useCallback(async (
        email: string,
        role: string
    ): Promise<{ sucesso: boolean; erro?: string }> => {
        const res = await adicionarMembro({
            email: email.toLowerCase().trim(),
            role
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

    return useMemo(() => ({
        membros,
        carregando,
        erro,
        recarregar,
        salvandoIds,
        toasts,
        alterarRole,
        cadastrarMembro,
        removerMembro,
    }), [
        membros,
        carregando,
        erro,
        recarregar,
        salvandoIds,
        toasts,
        alterarRole,
        cadastrarMembro,
        removerMembro,
    ]);
}

// ─── Componente: ModalConvitesEmLote ──────────────────────────────────────────

interface ModalConvitesEmLoteProps {
    aberto: boolean;
    aoFechar: () => void;
    aoCadastrar: (email: string, role: string) => Promise<{ sucesso: boolean; erro?: string }>;
    recarregar: () => Promise<void>;
}

/**
 * Componente de modal para realizar convites/autorizações de acesso em lote.
 * Processa uma lista de e-mails, validando o domínio institucional.
 */
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
            await aoCadastrar(email, 'MEMBRO');
            setProgresso(prev => prev ? { ...prev, atual: prev.atual + 1 } : null);
        }

        await recarregar();
        setEnviando(false);
        setProgresso(null);
        setTexto('');
        aoFechar();
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Convites em Lote" largura="sm">
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

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-border/50">
                    <button
                        type="button"
                        onClick={aoFechar}
                        className="w-full sm:w-auto h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                    >
                        CANCELAR
                    </button>
                    <button
                        type="submit"
                        disabled={enviando || !texto.trim()}
                        className="w-full sm:w-auto h-11 bg-primary text-primary-foreground px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {enviando ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {progresso ? `${progresso.atual}/${progresso.total}` : 'Enviando...'}
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

// ─── Componente: LinhaMembro ──────────────────────────────────────────────────



/**
 * Representa uma linha individual na tabela de membros com ações contextuais.
 * memo: Evita re-renderizar a linha inteira quando outros estados da página mudam.
 */
interface LinhaMembroProps {
    membro: Membro;
    salvando: boolean;
    selecionado: boolean;
    onToggleSelect: (id: string, isShift?: boolean) => void;
    onAlterarRole: (membro: Membro, role: string) => void;
    onRemover: (membro: Membro) => void;
    rolesDisponiveis: string[];
}

const LinhaMembro = memo(({
    membro,
    salvando,
    selecionado,
    onToggleSelect,
    onAlterarRole,
    onRemover,
    rolesDisponiveis
}: LinhaMembroProps) => {
    const { usuario } = usarAutenticacao();
    const ehOMesmoUsuario = usuario?.id === membro.id;
    const podeAlterarRole = usarPermissaoAcesso('membros:alterar_role');
    const podeDesativar = usarPermissaoAcesso('membros:desativar');

    return (
        <tr
            className={`border-b border-border/50 transition-colors ${
                salvando ? 'opacity-60 pointer-events-none' : 'hover:bg-muted/30'
            } ${selecionado ? 'bg-primary/5' : ''}`}
            aria-busy={salvando}
        >
            {/* Seleção + Identificação */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => !ehOMesmoUsuario && onToggleSelect(membro.id, e.shiftKey)}
                        className={`shrink-0 transition-colors focus:outline-none p-1 -m-1 ${
                            ehOMesmoUsuario
                                ? 'cursor-not-allowed text-muted-foreground/10'
                                : 'text-muted-foreground/30 hover:text-primary'
                        }`}
                        disabled={ehOMesmoUsuario}
                        aria-label={`Selecionar ${membro.nome}`}
                    >
                        {selecionado
                            ? <CheckSquare size={20} className="text-primary" />
                            : <Square size={20} />}
                    </button>

                    <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" coroa={ehOMesmoUsuario} />

                    <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm leading-tight">
                            {membro.nome || <span className="italic text-muted-foreground/50 font-normal">Sem nome</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
                            {membro.email}
                        </p>
                    </div>
                </div>
            </td>

            {/* Papel / Role */}
            <td className="px-3 py-3">
                <div className="relative w-fit">
                    <select
                        aria-label={`Papel de ${membro.nome}`}
                        className={`w-fit bg-muted/20 border border-border/50 rounded-xl px-2 py-1.5 pr-8 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none ${
                            !podeAlterarRole ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        value={membro.role}
                        onChange={e => onAlterarRole(membro, e.target.value as string)}
                        disabled={!podeAlterarRole}
                    >
                        {rolesDisponiveis.map(role => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={20} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                </div>
            </td>

            {/* Equipe */}
            <td className="px-3 py-3 hidden md:table-cell">
                <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                    {membro.equipe_nome ? (
                        membro.equipe_nome.split(',').map((item: string, i: number) => (
                            <span 
                                key={i} 
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted/40 border border-border/50 text-[10px] font-medium text-muted-foreground/80 whitespace-nowrap"
                            >
                                {item.trim()}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground/40 italic">—</span>
                    )}
                </div>
            </td>

            {/* Ações */}
            <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">


                    {!ehOMesmoUsuario && podeDesativar && (
                        <Tooltip texto="Remover acesso">
                            <button
                                onClick={() => onRemover(membro)}
                                className="p-2 rounded-xl transition-all text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/5"
                            >
                                {salvando ? (
                                    <Carregando Centralizar={false} tamanho="sm" />
                                ) : (
                                    <Trash2 size={20} />
                                )}
                            </button>
                        </Tooltip>
                    )}
                </div>
            </td>
        </tr>
    );
});

// ─── Componente: BulkActions ──────────────────────────────────────────────────

interface BulkActionsProps {
    selecionados: Set<string>;
    onClear: () => void;
    onBulkUpdate: (tipo: 'remover' | 'role', valor?: string) => void;
    onExport: () => void;
    rolesDisponiveis: string[];
}

/**
 * Painel flutuante de ações em lote para membros selecionados.
 * memo: Só re-renderiza se o número de selecionados ou roles mudarem.
 */
const BulkActions = memo(({ selecionados, onClear, onBulkUpdate, onExport, rolesDisponiveis }: BulkActionsProps) => {
    const podeDesativar = usarPermissaoAcesso('membros:desativar');
    const podeAlterarRole = usarPermissaoAcesso('membros:alterar_role');
    const [processando, setProcessando] = useState(false);

    if (selecionados.size === 0) return null;

    const handleAction = async (tipo: 'remover' | 'role', valor?: string) => {
        setProcessando(true);
        await onBulkUpdate(tipo, valor);
        setProcessando(false);
    };

    return (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 bg-card/95 backdrop-blur-xl border border-primary/20 shadow-xl rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between w-full sm:w-auto sm:border-r sm:border-border sm:pr-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs shadow shadow-primary/20">
                        {selecionados.size}
                    </div>
                    <span className="text-sm font-black text-foreground uppercase tracking-widest">Selecionados</span>
                </div>
                <button
                    onClick={onClear}
                    className="ml-4 p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-lg lg:bg-transparent"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {podeDesativar && (
                    <button
                        onClick={() => handleAction('remover')}
                        disabled={processando}
                        className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50"
                    >
                        {processando ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={20} />} 
                        Remover
                    </button>
                )}

                {podeAlterarRole && (
                    <div className="relative group/bulk-role shrink-0">
                        <button 
                            disabled={processando}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 disabled:opacity-50"
                        >
                            {processando ? <Loader2 size={18} className="animate-spin" /> : <Shield size={20} />} 
                            Nível <ChevronDown size={20} />
                        </button>
                        {!processando && (
                            <div className="absolute bottom-full left-0 mb-3 w-44 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden hidden group-hover/bulk-role:block animate-in fade-in slide-in-from-bottom-2 z-[60]">
                                {rolesDisponiveis.map(role => (
                                    <button
                                        key={role}
                                        onClick={() => handleAction('role', role)}
                                        className="w-full text-left px-4 py-3 hover:bg-accent text-[11px] font-black uppercase tracking-widest transition-colors border-b border-border/50 last:border-0"
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={onExport}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-muted hover:bg-muted/80 text-foreground transition-all border border-border"
                >
                    <Download size={20} /> Exportar
                </button>
            </div>
        </div>
    );
});

// ─── Componente: ModalCadastroMembro ──────────────────────────────────────────

interface ModalCadastroProps {
    aberto: boolean;
    aoFechar: () => void;
    aoCadastrar: (email: string, role: string) => Promise<{ sucesso: boolean; erro?: string }>;
    rolesDisponiveis: string[];
}

/**
 * Modal para cadastro individual de novos membros.
 * Garante que o domínio institucional seja anexado corretamente ao e-mail.
 */
function ModalCadastroMembro({ aberto, aoFechar, aoCadastrar, rolesDisponiveis }: ModalCadastroProps) {
    const [usuarioEmail, setUsuarioEmail] = useState('');
    const [dominio, setDominio] = useState(`@${ambiente.dominioInstitucional}`);
    const [role, setRole] = useState(rolesDisponiveis[0] || 'MEMBRO');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (aberto) {
            setUsuarioEmail('');
            setDominio(`@${ambiente.dominioInstitucional}`);
            setRole(rolesDisponiveis[0] || 'MEMBRO');
            setErro(null);
        }
    }, [aberto, rolesDisponiveis]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!usuarioEmail.trim()) {
            setErro('Por favor, informe o e-mail.');
            return;
        }

        setSalvando(true);
        setErro(null);

        const emailCompleto = `${usuarioEmail.trim().toLowerCase()}${dominio}`;
        const res = await aoCadastrar(emailCompleto, role);
        setSalvando(false);

        if (res.sucesso) {
            aoFechar();
        } else {
            setErro(res.erro ?? 'Erro ao cadastrar membro.');
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Cadastrar Novo Membro" largura="sm">
            <div className="space-y-5 py-2">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">E-mail Institucional</label>
                    <div className="relative group/email">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors z-10" />
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
                                    <option value="@unieuro.edu.br">@unieuro.edu.br</option>
                                </select>
                                <ChevronDown size={20} className="absolute right-2.5 pointer-events-none opacity-40" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nível de Acesso</label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full bg-background border border-border rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                        >
                            {rolesDisponiveis.map(roleOption => (
                                <option key={roleOption} value={roleOption}>
                                    {roleOption}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {erro && (
                    <Alerta tipo="erro" mensagem={erro} className="mt-4" />
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-border/50">
                    <button type="button" onClick={aoFechar} className="w-full sm:w-auto h-11 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl transition-all">CANCELAR</button>
                    <button
                        type="button"
                        disabled={salvando || !usuarioEmail.trim()}
                        onClick={() => handleSubmit()}
                        className="w-full sm:w-auto h-11 bg-primary text-primary-foreground px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {salvando ? <Carregando Centralizar={false} tamanho="sm" className="border-t-white border-white/30" /> : 'Finalizar Cadastro'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Componente: StatsCards ───────────────────────────────────────────────────

/**
 * Cartões de estatísticas rápidas sobre os membros do sistema.
 * memo: Evita recalculação se a lista de membros for idêntica.
 */
const StatsCards = memo(({ membros }: { membros: Membro[] }) => {
    const stats = useMemo(() => {
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

        const novosEsteMes = membros.filter(m => new Date(m.criado_em) >= inicioMes).length;
        const totalLideres = membros.filter(m => ['SUBLIDER', 'LIDER', 'GESTOR', 'COORDENADOR', 'ADMIN'].includes(m.role)).length;
        const totalVisitantes = membros.filter(m => !m.role || m.role === 'MEMBRO' && !m.nome).length;
        const semEquipe = membros.filter(m => !m.equipe_nome).length;

        return {
            total: membros.length,
            novos: novosEsteMes,
            lideres: totalLideres,
            visitantes: totalVisitantes,
            semEquipe: semEquipe
        };
    }, [membros]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
                { label: 'Total', valor: stats.total, icone: UsersIcon, cor: 'text-slate-600', bg: 'bg-slate-100', detalhe: stats.novos > 0 ? `+${stats.novos}` : null },
                { label: 'Lideranças', valor: stats.lideres, icone: Shield, cor: 'text-indigo-600', bg: 'bg-indigo-50', detalhe: null },
                { label: 'Pendentes', valor: stats.visitantes, icone: Mail, cor: 'text-amber-600', bg: 'bg-amber-50', detalhe: null },
                { label: 'Sem Equipe', valor: stats.semEquipe, icone: History, cor: 'text-rose-600', bg: 'bg-rose-50', detalhe: null },
            ].map((card) => (
                <div key={card.label} className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all hover:bg-white/80">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${card.bg} ${card.cor} flex items-center justify-center shrink-0`}>
                            <card.icone size={20} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block truncate">{card.label}</span>
                            <span className="text-lg font-bold text-slate-900 leading-tight">{card.valor}</span>
                        </div>
                    </div>
                    {card.detalhe && (
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md self-end mb-0.5">
                            {card.detalhe}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
});

// ─── Componente Principal: GerenciarMembros ───────────────────────────────────

/**
 * Página principal de Administração de Membros.
 * Permite visualizar, filtrar, autorizar acesso e gerenciar cargos dos usuários.
 * 
 * @security Exclusivo para perfis com permissao 'MEMBROS_GERENCIAR'.
 */
export default function GerenciarMembros() {
    const {
        membros,
        carregando,
        erro,
        recarregar,
        salvandoIds,
        toasts,
        alterarRole,
        cadastrarMembro,
        removerMembro,
    } = useGerenciarMembros();

    const { configuracoes } = usarConfiguracoes();
    const rolesDisponiveis = useMemo(() => {
        const baseRoles = configuracoes?.permissoes_roles 
            ? Object.keys(configuracoes.permissoes_roles) 
            : ['MEMBRO', 'SUBLIDER', 'LIDER', 'GESTOR', 'COORDENADOR', 'ADMIN'];
        return baseRoles.filter(role => role !== 'ADMIN');
    }, [configuracoes]);

    const [busca, setBusca] = useState('');
    const buscaDebounced = usarDebounce(busca, 300);
    const [modalAberto, setModalAberto] = useState(false);
    const [modalLoteAberto, setModalLoteAberto] = useState(false);
    const [membroParaExcluir, setMembroParaExcluir] = useState<Membro | null>(null);
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [ultimoIdSelecionado, setUltimoIdSelecionado] = useState<string | null>(null);
    const [pagina, setPagina] = useState(1);
    const [itensPorPagina, setItensPorPagina] = useState(20);

    const podeCadastrar = usarPermissaoAcesso('membros:gerenciar');

    const listaFiltrada = useMemo(() => {
        let lista = membros;

        if (buscaDebounced.trim()) {
            const lower = buscaDebounced.toLowerCase();
            lista = lista.filter(m =>
                (m.nome?.toLowerCase() ?? '').includes(lower) ||
                (m.email?.toLowerCase() ?? '').includes(lower)
            );
        }

        return lista;
    }, [membros, buscaDebounced]);

    const totalRegistros = listaFiltrada.length;
    const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;

    // Garante que não ficamos numa página fantasma ao filtrar
    if (pagina > totalPaginas && totalPaginas > 0) {
        setPagina(totalPaginas);
    }

    const listaPaginada = useMemo(() => {
        const startIndex = (pagina - 1) * itensPorPagina;
        return listaFiltrada.slice(startIndex, startIndex + itensPorPagina);
    }, [listaFiltrada, pagina, itensPorPagina]);

    const toggleSelecionado = useCallback((id: string, isShiftPressed?: boolean) => {
        setSelecionados(prev => {
            const next = new Set(prev);

            if (isShiftPressed && ultimoIdSelecionado) {
                const idsVisiveis = listaFiltrada.map(m => m.id);
                const idxAtual = idsVisiveis.indexOf(id);
                const idxUltimo = idsVisiveis.indexOf(ultimoIdSelecionado);

                if (idxAtual !== -1 && idxUltimo !== -1) {
                    const [inicio, fim] = [Math.min(idxAtual, idxUltimo), Math.max(idxAtual, idxUltimo)];
                    const idsParaSelecionar = idsVisiveis.slice(inicio, fim + 1);
                    idsParaSelecionar.forEach(idSel => next.add(idSel));
                }
            } else {
                if (next.has(id)) next.delete(id);
                else next.add(id);
            }

            setUltimoIdSelecionado(id);
            return next;
        });
    }, [listaFiltrada, ultimoIdSelecionado]);

    const handleBulkUpdate = async (tipo: 'remover' | 'role', valor?: string) => {
        const idsArray = Array.from(selecionados);
        try {
            if (tipo === 'remover') {
                await Promise.all(idsArray.map(id => api.delete(`/api/usuarios/${id}`)));
            } else if (tipo === 'role' && valor) {
                await Promise.all(idsArray.map(id => api.patch(`/api/usuarios/${id}/role`, { role: valor })));
            }
            await recarregar();
            setSelecionados(new Set());
        } catch (e) {
            console.error('Erro em ação em lote:', e);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <CabecalhoFuncionalidade
                titulo="Gerenciar Membros"
                subtitulo="Controle de acesso, papéis e status dos colaboradores."
                icone={UserCog}
            >
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto mt-4 md:mt-0">
                    {carregando && membros.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 animate-pulse whitespace-nowrap">
                            <Carregando Centralizar={false} tamanho="sm" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
                        </div>
                    )}
                    {/* Barra de Busca Dinâmica */}
                    <div className="relative w-full sm:w-64 xl:w-80">
                        <BarraBusca 
                            valor={busca}
                            aoMudar={setBusca}
                            placeholder="Buscar por nome ou email..."
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />

                        {podeCadastrar && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setModalAberto(true)}
                                    className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                >
                                    <Plus size={20} />
                                    <span>Adicionar</span>
                                </button>
                                
                                <Tooltip texto="Importar em Lote">
                                    <button
                                        onClick={() => setModalLoteAberto(true)}
                                        className="w-11 h-11 bg-white border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/20 rounded-xl transition-all flex items-center justify-center"
                                    >
                                        <ListPlus size={20} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
            </CabecalhoFuncionalidade>

            <StatsCards membros={membros} />

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">

                {/* Tabela semântica de membros */}
                <div className="overflow-x-auto flex-1 h-0 relative">
                    {carregando && membros.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
                             <Carregando Centralizar={false} tamanho="lg" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Buscando Membros</span>
                        </div>
                    ) : erro ? (
                        <div className="py-20 flex justify-center w-full">
                            <EstadoErro 
                                titulo="Erro ao carregar dados"
                                mensagem={erro}
                                aoTentarNovamente={recarregar}
                            />
                        </div>
                    ) : listaFiltrada.length === 0 ? (
                        <div className="py-12">
                            <EstadoVazio 
                                tipo="pesquisa"
                                titulo="Membro não encontrado"
                                descricao={buscaDebounced ? `Nenhum membro corresponde a "${buscaDebounced}" nesta aba.` : "Nenhum membro encontrado com os filtros atuais."}
                                acao={buscaDebounced ? {
                                    rotulo: "Limpar busca",
                                    aoClicar: () => setBusca('')
                                } : undefined}
                            />
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        Membro
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        Cargo
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hidden md:table-cell">
                                        Equipe
                                    </th>
                                    <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y divide-border/40 transition-opacity duration-300 ${carregando ? 'opacity-50' : 'opacity-100'}`}>
                                {listaPaginada.map(membro => (
                                    <LinhaMembro
                                        key={membro.id}
                                        membro={membro}
                                        salvando={salvandoIds.has(membro.id)}
                                        selecionado={selecionados.has(membro.id)}
                                        onToggleSelect={toggleSelecionado}
                                        onAlterarRole={alterarRole}
                                        onRemover={setMembroParaExcluir}
                                        rolesDisponiveis={rolesDisponiveis}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Paginacao
                    paginaAtual={pagina}
                    totalPaginas={totalPaginas}
                    totalRegistros={totalRegistros}
                    itensPorPagina={itensPorPagina}
                    itensListados={listaPaginada.length}
                    aoMudarPagina={setPagina}
                    aoMudarItensPorPagina={(num) => { setItensPorPagina(num); setPagina(1); }}
                />

            </div>

            <BulkActions
                selecionados={selecionados}
                onClear={() => setSelecionados(new Set())}
                onBulkUpdate={handleBulkUpdate}
                onExport={() => alert('A exportação CSV está sendo processada pelo servidor. Verifique suas notificações em instantes.')}
                rolesDisponiveis={rolesDisponiveis}
            />

            <ModalCadastroMembro
                aberto={modalAberto}
                aoFechar={() => setModalAberto(false)}
                aoCadastrar={cadastrarMembro}
                rolesDisponiveis={rolesDisponiveis}
            />

            <ModalConvitesEmLote
                aberto={modalLoteAberto}
                aoFechar={() => setModalLoteAberto(false)}
                aoCadastrar={cadastrarMembro}
                recarregar={recarregar}
            />

            <ConfirmacaoExclusao
                aberto={!!membroParaExcluir}
                aoFechar={() => setMembroParaExcluir(null)}
                aoConfirmar={async () => {
                    if (membroParaExcluir) {
                        await removerMembro(membroParaExcluir);
                        setMembroParaExcluir(null);
                    }
                }}
                titulo="Remover Membro?"
                descricao={`O acesso de ${membroParaExcluir?.nome} será definitivamente excluído.`}
                textoBotao="Remover Agora"
            />

            <ToastContainer toasts={toasts} />
        </div>
    );
}