import { useState, useMemo, useCallback, useEffect } from 'react';
import { UserCog, X, Shield, Mail, Trash2, Loader2, UserCheck, Archive, ListPlus, CheckSquare, Square, Download, AlertCircle, ChevronDown, RotateCcw, Eraser, User, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router';
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
import { usarConfiguracoes } from './usarConfiguracoes';
import { usarDebounce } from '../../compartilhado/hooks/usarDebounce';
import { BarraBusca } from '../../compartilhado/componentes/BarraBusca';
import { usarToast } from '../../compartilhado/hooks/usarToast';
import { ToastContainer } from '../../compartilhado/componentes/ToastContainer';
import { Paginacao } from '../../compartilhado/componentes/Paginacao';

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
        } catch (e: any) {
            atualizarMembro(membro);
            exibirToast(e.response?.data?.erro ?? 'Erro ao alterar papel do membro.', 'erro');
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando]);

    const alternarStatus = useCallback(async (membro: Membro) => {
        const novoStatus = !membro.ativo;

        atualizarMembro({ ...membro, ativo: novoStatus });
        marcarSalvando(membro.id);

        try {
            await api.patch(`/api/usuarios/${membro.id}/status`, { ativo: novoStatus });
            exibirToast(`${membro.nome} ${novoStatus ? 'ativado' : 'pausado'} com sucesso.`);
        } catch (e: any) {
            atualizarMembro(membro);
            exibirToast(e.response?.data?.erro ?? 'Erro ao alterar status do membro.', 'erro');
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando]);

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



// ─── Componente: LinhaMembro ──────────────────────────────────────────────────

interface LinhaMembroProps {
    membro: Membro;
    salvando: boolean;
    selecionado: boolean;
    onToggleSelect: (id: string, isShift?: boolean) => void;
    onAlterarRole: (membro: Membro, role: string) => void;
    onAlternarStatus: (membro: Membro) => void;
    onSolicitarExclusao: (membro: Membro) => void;
    onLimpezaDefinitiva: (membro: Membro) => void;
    rolesDisponiveis: string[];
}

/**
 * Linha de um membro na tabela de gerenciamento.
 * Renderiza uma <tr> semântica com células para seleção, identificação, papel, status e ações.
 */
function LinhaMembro({
    membro,
    salvando,
    selecionado,
    onToggleSelect,
    onAlterarRole,
    onAlternarStatus,
    onSolicitarExclusao,
    onLimpezaDefinitiva,
    rolesDisponiveis,
}: LinhaMembroProps) {
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
                            ? <CheckSquare size={18} className="text-primary" />
                            : <Square size={18} />}
                    </button>

                    <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="md" />

                    <div className="min-w-0">
                        <p className="font-bold text-foreground text-sm leading-tight truncate max-w-[180px]">
                            {membro.nome || <span className="italic text-muted-foreground/50 font-normal">Sem nome</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground/60 truncate leading-tight mt-0.5 max-w-[180px]">
                            {membro.email}
                        </p>
                    </div>

                    {ehOMesmoUsuario && (
                        <span className="text-[9px] text-primary/60 font-black uppercase tracking-widest italic select-none shrink-0">
                            Você
                        </span>
                    )}
                </div>
            </td>

            {/* Papel / Role */}
            <td className="px-3 py-3">
                <div className="relative">
                    <select
                        aria-label={`Papel de ${membro.nome}`}
                        className={`w-full bg-muted/20 border border-border/50 rounded-xl px-2 py-1.5 pr-6 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none ${
                            !podeAlterarRole ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        value={membro.role}
                        onChange={e => onAlterarRole(membro, e.target.value)}
                        disabled={!podeAlterarRole}
                    >
                        {rolesDisponiveis.map(role => (
                            <option key={role} value={role}>
                                {role === 'ADMIN'
                                    ? 'Admin'
                                    : role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                </div>
            </td>

            {/* Equipe */}
            <td className="px-3 py-3 hidden xl:table-cell">
                <span className="text-xs text-muted-foreground/60 truncate max-w-[120px] block">
                    {(membro as any).equipe_nome ?? '—'}
                </span>
            </td>

            {/* Status */}
            <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        membro.ativo
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : 'bg-muted-foreground/20'
                    }`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${
                        membro.ativo ? 'text-emerald-500' : 'text-muted-foreground/40'
                    }`}>
                        {membro.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </td>

            {/* Ações */}
            <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                    <Link
                        to={`/app/membro/${membro.id}`}
                        title="Ver perfil"
                        className="p-2 rounded-xl transition-all text-primary hover:bg-primary/5"
                    >
                        <User size={15} />
                    </Link>

                    {!ehOMesmoUsuario && podeDesativar && (
                        <>
                            <button
                                onClick={
                                    membro.ativo
                                        ? () => onSolicitarExclusao(membro)
                                        : () => onAlternarStatus(membro)
                                }
                                title={membro.ativo ? 'Arquivar membro' : 'Restaurar membro'}
                                className={`p-2 rounded-xl transition-all ${
                                    membro.ativo
                                        ? 'text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/5'
                                        : 'text-emerald-500 hover:bg-emerald-500/5'
                                }`}
                            >
                                {salvando ? (
                                    <Loader2 size={15} className="animate-spin" />
                                ) : membro.ativo ? (
                                    <Trash2 size={15} />
                                ) : (
                                    <RotateCcw size={15} />
                                )}
                            </button>

                            {!membro.ativo && (
                                <button
                                    onClick={() => onLimpezaDefinitiva(membro)}
                                    title="Excluir definitivamente"
                                    className="p-2 rounded-xl text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                >
                                    <Eraser size={15} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ─── Componente: BulkActions ──────────────────────────────────────────────────

interface BulkActionsProps {
    selecionados: Set<string>;
    onClear: () => void;
    onBulkUpdate: (tipo: 'arquivar' | 'role', valor?: string) => void;
    onExport: () => void;
    rolesDisponiveis: string[];
}

function BulkActions({ selecionados, onClear, onBulkUpdate, onExport, rolesDisponiveis }: BulkActionsProps) {
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

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                {podeDesativar && (
                    <button
                        onClick={() => onBulkUpdate('arquivar')}
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
                            {rolesDisponiveis.map(role => (
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
    aoCadastrar: (email: string, role: string) => Promise<{ sucesso: boolean; erro?: string }>;
    rolesDisponiveis: string[];
}

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
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Cadastrar Novo Membro" largura="md">
            <div className="space-y-5 py-2">
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
                                    <option value="@unieuro.edu.br">@unieuro.edu.br</option>
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
                            {rolesDisponiveis.map(roleOption => (
                                <option key={roleOption} value={roleOption}>
                                    {roleOption === 'ADMIN' ? 'Administrador Geral' : roleOption.charAt(0) + roleOption.slice(1).toLowerCase().replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {erro && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-xs flex items-center gap-2 animate-in shake duration-300">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {erro}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={aoFechar} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                    <button
                        type="button"
                        disabled={salvando || !usuarioEmail.trim()}
                        onClick={() => handleSubmit()}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-2xl text-sm font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalizar Cadastro'}
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
        const totalVisitantes = membros.filter(m => !m.role || m.role === 'MEMBRO' && !m.nome).length;

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
                { label: 'Novos Acessos', valor: stats.visitantes, icone: Mail, cor: 'text-amber-500', bg: 'bg-amber-500/5', detalhe: 'Pendentes' },
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
        recarregar,
        salvandoIds,
        toasts,
        alterarRole,
        alternarStatus,
        cadastrarMembro,
        limpezaDefinitiva,
    } = useGerenciarMembros();

    const { configuracoes } = usarConfiguracoes();
    const rolesDisponiveis = useMemo(() => {
        if (!configuracoes?.permissoes_roles) return ['MEMBRO', 'SUBLIDER', 'LIDER', 'GESTOR', 'COORDENADOR', 'ADMIN'];
        return Object.keys(configuracoes.permissoes_roles);
    }, [configuracoes]);

    const [busca, setBusca] = useState('');
    const buscaDebounced = usarDebounce(busca, 300);
    const [abaAtiva, setAbaAtiva] = useState<'ativos' | 'arquivados'>('ativos');
    const [modalAberto, setModalAberto] = useState(false);
    const [modalLoteAberto, setModalLoteAberto] = useState(false);
    const [membroParaExcluir, setMembroParaExcluir] = useState<Membro | null>(null);
    const [membroParaLimpar, setMembroParaLimpar] = useState<Membro | null>(null);
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [ultimoIdSelecionado, setUltimoIdSelecionado] = useState<string | null>(null);
    const [pagina, setPagina] = useState(1);
    const [itensPorPagina, setItensPorPagina] = useState(20);

    const podeCadastrar = usarPermissaoAcesso('membros:gerenciar');

    const listaFiltrada = useMemo(() => {
        let lista = membros;
        lista = lista.filter(m => abaAtiva === 'ativos' ? m.ativo : !m.ativo);

        if (buscaDebounced.trim()) {
            const lower = buscaDebounced.toLowerCase();
            lista = lista.filter(m =>
                (m.nome?.toLowerCase() ?? '').includes(lower) ||
                (m.email?.toLowerCase() ?? '').includes(lower)
            );
        }

        return lista;
    }, [membros, buscaDebounced, abaAtiva]);

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

    const handleBulkUpdate = async (tipo: 'arquivar' | 'role', valor?: string) => {
        const idsArray = Array.from(selecionados);
        try {
            if (tipo === 'arquivar') {
                await Promise.all(idsArray.map(id => api.patch(`/api/usuarios/${id}/status`, { ativo: false })));
            } else if (tipo === 'role' && valor) {
                await Promise.all(idsArray.map(id => api.patch(`/api/usuarios/${id}/role`, { role: valor })));
            }
            await recarregar();
            setSelecionados(new Set());
        } catch (e) {
            console.error('Erro em ação em lote:', e);
        }
    };

    if (carregando && membros.length === 0) return <Carregando />;

    return (
        <div className="space-y-6">
            <CabecalhoFuncionalidade
                titulo="Gerenciar Membros"
                subtitulo="Controle de acesso, papéis e status dos colaboradores."
                icone={UserCog}
            >
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto mt-4 md:mt-0">
                    {/* Barra de Busca Dinâmica */}
                    <div className="relative w-full sm:w-64 xl:w-80">
                        <BarraBusca 
                            valor={busca}
                            aoMudar={setBusca}
                            placeholder="Buscar por nome ou email..."
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 flex-wrap justify-end">
                        {/* Toggle Arquivados */}
                        <button
                            onClick={() => setAbaAtiva(abaAtiva === 'ativos' ? 'arquivados' : 'ativos')}
                            className={`shrink-0 p-2.5 rounded-2xl border transition-all flex items-center gap-2 relative ${abaAtiva === 'arquivados' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg shadow-red-500/10' : 'bg-muted/40 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary'}`}
                            title={abaAtiva === 'ativos' ? "Ver Arquivados" : "Ver Ativos"}
                        >
                            <Archive size={18} />
                            {membros.filter(m => !m.ativo).length > 0 && abaAtiva === 'ativos' && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                                    {membros.filter(m => !m.ativo).length}
                                </span>
                            )}
                        </button>

                        {podeCadastrar && (
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setModalLoteAberto(true)}
                                    className="bg-muted/40 hover:bg-muted/60 text-foreground px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-border/50 flex items-center gap-2"
                                >
                                    <ListPlus size={18} /> <span className="hidden sm:inline">Lote</span>
                                </button>
                                <button
                                    onClick={() => setModalAberto(true)}
                                    className="bg-primary text-primary-foreground px-4 sm:px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <UserCog size={18} /> <span className="hidden sm:inline">Novo Membro</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </CabecalhoFuncionalidade>

            <StatsCards membros={membros} />

            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">

                {/* Tabela semântica de membros */}
                <div className="overflow-x-auto min-h-[400px]">
                    {erro ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">Erro ao carregar dados</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2">{erro}</p>
                            <button
                                onClick={() => recarregar()}
                                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-2xl text-sm font-bold"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    ) : listaFiltrada.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                            <UsersIcon size={48} className="mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">Nenhum membro encontrado</p>
                            <p className="text-xs mt-1">Tente ajustar sua busca ou filtros.</p>
                        </div>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-border/60 bg-muted/30">
                                    <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[45%]">
                                        Membro
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[14%]">
                                        Papel
                                    </th>
                                    <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[14%] hidden xl:table-cell">
                                        Equipe
                                    </th>
                                    <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[12%]">
                                        Status
                                    </th>
                                    <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 w-[15%]">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {listaPaginada.map(membro => (
                                    <LinhaMembro
                                        key={membro.id}
                                        membro={membro}
                                        salvando={salvandoIds.has(membro.id)}
                                        selecionado={selecionados.has(membro.id)}
                                        onToggleSelect={toggleSelecionado}
                                        onAlterarRole={alterarRole}
                                        onAlternarStatus={alternarStatus}
                                        onSolicitarExclusao={setMembroParaExcluir}
                                        onLimpezaDefinitiva={setMembroParaLimpar}
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
                onExport={() => alert('Exportação em breve')}
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
                aoCadastrar={async (d) => cadastrarMembro(d.email, 'MEMBRO')}
                recarregar={recarregar}
            />

            <ConfirmacaoExclusao
                aberto={!!membroParaExcluir}
                aoFechar={() => setMembroParaExcluir(null)}
                aoConfirmar={async () => {
                    if (membroParaExcluir) {
                        await alternarStatus(membroParaExcluir);
                        setMembroParaExcluir(null);
                    }
                }}
                titulo="Arquivar Membro?"
                descricao={`O acesso de ${membroParaExcluir?.nome} será temporariamente suspenso.`}
                textoBotao="Arquivar"
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
                titulo="Remover Definitivamente?"
                descricao={`Esta ação excluirá todos os dados de ${membroParaLimpar?.nome} permanentemente.`}
                textoBotao="Remover Agora"
            />

            <ToastContainer toasts={toasts} />
        </div>
    );
}