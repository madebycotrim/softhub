import React, { useState, useMemo } from 'react';
import { usarConfiguracoes } from '@/funcionalidades/admin/hooks/usarConfiguracoes';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { 
    Plus, Lock, ShieldCheck, UserCircle,
    MessageSquare,
    Settings2, Info, Trash2,
    FolderKanban, Clock, LayoutDashboard,
    LayoutGrid, FileText, Database, Globe,
    Pencil, Check, X
} from 'lucide-react';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Alerta } from '@/compartilhado/componentes/Alerta';

/**
 * Mapa completo de todas as permissões reais do sistema,
 * organizadas por módulo exatamente como existem nas rotas do backend.
 */
const PERMISSOES_SISTEMA = [
    {
        modulo: 'tarefas',
        label: 'Kanban / Tarefas',
        icone: FolderKanban,
        permissoes: [
            { chave: 'tarefas:visualizar', label: 'Visualizar' },
            { chave: 'tarefas:criar', label: 'Criar' },
            { chave: 'tarefas:editar', label: 'Editar' },
            { chave: 'tarefas:mover', label: 'Mover' },
            { chave: 'tarefas:arquivar', label: 'Arquivar' },
            { chave: 'tarefas:comentar', label: 'Comentar' },
            { chave: 'tarefas:checklist', label: 'Checklist' },
        ],
    },
    {
        modulo: 'ponto',
        label: 'Ponto Eletrônico',
        icone: Clock,
        permissoes: [
            { chave: 'ponto:registrar', label: 'Registrar' },
            { chave: 'ponto:visualizar', label: 'Visualizar Histórico' },
            { chave: 'ponto:justificar', label: 'Enviar Justificativa' },
            { chave: 'ponto:aprovar_justificativa', label: 'Aprovar Justificativa' },
            { chave: 'ponto:exportar_csv', label: 'Exportar CSV' },
        ],
    },
    {
        modulo: 'membros',
        label: 'Membros',
        icone: UserCircle,
        permissoes: [


            { chave: 'membros:gerenciar', label: 'Gerenciar Membros' },
            { chave: 'membros:alterar_role', label: 'Alterar Cargo' },
            { chave: 'membros:desativar', label: 'Desativar Membro' },
        ],
    },
    {
        modulo: 'avisos',
        label: 'Avisos',
        icone: MessageSquare,
        permissoes: [
            { chave: 'avisos:visualizar', label: 'Visualizar' },
            { chave: 'avisos:criar', label: 'Criar' },
            { chave: 'avisos:remover', label: 'Remover' },
        ],
    },
    {
        modulo: 'equipes',
        label: 'Estrutura de Equipes',
        icone: LayoutGrid,
        permissoes: [
            { chave: 'equipes:visualizar', label: 'Visualizar' },
            { chave: 'equipes:criar_grupo', label: 'Criar Grupo' },
            { chave: 'equipes:editar_grupo', label: 'Editar Grupo' },
            { chave: 'equipes:criar_equipe', label: 'Criar Equipe' },
            { chave: 'equipes:editar_equipe', label: 'Editar Equipe' },
        ],
    },
    {
        modulo: 'dashboard',
        label: 'Dashboard',
        icone: LayoutDashboard,
        permissoes: [
            { chave: 'dashboard:visualizar', label: 'Visualizar' },
        ],
    },
    {
        modulo: 'relatorios',
        label: 'Relatórios',
        icone: FileText,
        permissoes: [
            { chave: 'relatorios:visualizar', label: 'Visualizar' },
        ],
    },
    {
        modulo: 'logs',
        label: 'Painel de Logs',
        icone: Database,
        permissoes: [
            { chave: 'logs:visualizar', label: 'Ver histórico global (Todos os usuários)' },
            { chave: 'logs:visualizar_proprios', label: 'Ver histórico próprio (Apenas seu)' },
        ],
    },
    {
        modulo: 'configuracoes',
        label: 'Configurações',
        icone: Settings2,
        permissoes: [
            { chave: 'configuracoes:visualizar', label: 'Visualizar' },
            { chave: 'configuracoes:editar', label: 'Editar' },
        ],
    },
] as const;

/** Cargos que nunca podem ser removidos */
const CARGOS_FIXOS = ['ADMIN', 'TODOS'];

/**
 * Página de Configurações & Governança.
 * Gestão de cargos e matriz de permissões completa com todas as funções reais do sistema.
 */
export function PaginaConfiguracoes() {
    const { configuracoes, erro, atualizarConfiguracao, renomearCargo } = usarConfiguracoes();

    const podeEditar = usarPermissaoAcesso('configuracoes:editar');

    const [buscaPermissao, setBuscaPermissao] = useState('');
    const [novoCargo, setNovoCargo] = useState('');
    const [salvando, setSalvando] = useState<string | null>(null);

    // Estados para edição inline de cargo
    const [editandoRole, setEditandoRole] = useState<string | null>(null);
    const [nomeRoleTemp, setNomeRoleTemp] = useState('');
    const [salvandoRole, setSalvandoRole] = useState(false);
    const [erroLocal, setErroLocal] = useState<string | null>(null);

    /** Lista de roles/cargos — ADMIN e TODOS sempre presentes */
    const roles = useMemo(() => {
        const baseRoles = configuracoes?.permissoes_roles ? Object.keys(configuracoes.permissoes_roles) : [];
        return Array.from(new Set(['ADMIN', 'TODOS', ...baseRoles]));
    }, [configuracoes]);

    /** Roles exibidos na matriz (ADMIN oculto — acesso total por padrão) */
    const rolesMatriz = useMemo(() => roles.filter(r => r !== 'ADMIN'), [roles]);

    /** Filtra a matriz de permissões */
    const permissoesFiltradas = useMemo(() => {
        if (!buscaPermissao) return PERMISSOES_SISTEMA;
        return PERMISSOES_SISTEMA.map(modulo => ({
            ...modulo,
            permissoes: modulo.permissoes.filter(p => 
                p.label.toLowerCase().includes(buscaPermissao.toLowerCase()) ||
                modulo.label.toLowerCase().includes(buscaPermissao.toLowerCase())
            )
        })).filter(modulo => modulo.permissoes.length > 0);
    }, [buscaPermissao]);

    if (erro) return <div className="p-10 flex justify-center"><Alerta tipo="erro" mensagem={erro} /></div>;

    /** Alterna uma permissão entre ativo/inativo para um cargo */
    const handleTogglePermissao = async (role: string, permissao: string) => {
        if (!configuracoes) return;
        const chave = `permissoes_roles.${role}.${permissao}`;
        setSalvando(chave);
        setErroLocal(null);
        try {
            const novasPermissoes = { ...configuracoes.permissoes_roles };
            novasPermissoes[role] = { ...novasPermissoes[role], [permissao]: !novasPermissoes[role]?.[permissao] };
            const res = await atualizarConfiguracao('permissoes_roles', novasPermissoes);
            
            if (!res?.sucesso) {
                setErroLocal(res?.erro || 'Erro ao atualizar permissão.');
                setTimeout(() => setErroLocal(null), 5000);
            }
        } catch (err) {
            setErroLocal('Falha na comunicação com o servidor.');
            setTimeout(() => setErroLocal(null), 5000);
        } finally {
            setSalvando(null);
        }
    };

    /** Renomeia um cargo na matriz e nos usuários */
    const handleRenomearRoleAction = async (antigo: string) => {
        const novo = nomeRoleTemp.toUpperCase().trim();
        if (!novo || novo === antigo || salvandoRole) {
            setEditandoRole(null);
            return;
        }
        setSalvandoRole(true);
        const res = await renomearCargo(antigo, novo);
        if (res.sucesso) {
            setEditandoRole(null);
        }
        setSalvandoRole(false);
    };

    /** Adiciona um novo cargo com permissões básicas */
    const handleAddCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoCargo || !configuracoes) return;
        const novasPermissoes = {
            ...configuracoes.permissoes_roles,
            [novoCargo.toUpperCase()]: {
                'tarefas:visualizar': true,
                'ponto:registrar': true,


                'avisos:visualizar': true,
                'dashboard:visualizar': true,
            },
        };
        const res = await atualizarConfiguracao('permissoes_roles', novasPermissoes);
        if (res.sucesso) setNovoCargo('');
    };

    /** Remove um cargo (exceto os fixos: ADMIN e TODOS) */
    const handleRemoverCargo = async (role: string) => {
        if (!configuracoes || CARGOS_FIXOS.includes(role)) return;
        const novasPermissoes = { ...configuracoes.permissoes_roles };
        delete novasPermissoes[role];
        await atualizarConfiguracao('permissoes_roles', novasPermissoes);
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 relative">
            <CabecalhoFuncionalidade
                titulo="Configurações"
                subtitulo="Governança, Permissões e Hierarquia do SoftHub"
                icone={Settings2}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6  items-start">
                {/* Coluna Lateral: Gestão de Cargos */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <div className="p-2.5 bg-primary/5 rounded-2xl text-primary">
                                <ShieldCheck size={18} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Cargos</h3>
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.05em] leading-tight">Configurar Hierarquia</span>
                            </div>
                        </div>

                        {/* Formulário para adicionar cargo — apenas para quem pode editar */}
                        {podeEditar && (
                            <form onSubmit={handleAddCargo} className="flex gap-2 relative group">
                                <input
                                    required
                                    value={novoCargo}
                                    onChange={e => setNovoCargo(e.target.value)}
                                    placeholder="EX: LIDER_TECH"
                                    className="flex-1 min-w-0 bg-muted/40 border border-border/50 rounded-2xl px-4 py-3 text-[12px] font-bold outline-none focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all uppercase placeholder:text-muted-foreground/30"
                                />
                                <button
                                    type="submit"
                                    className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 shrink-0"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                </button>
                            </form>
                        )}

                        {/* Lista de cargos existentes */}
                        <div className="space-y-4 ">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/60 px-2 block">Cargos</label>
                            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                                {roles.filter(r => r !== 'TODOS' && r !== 'ADMIN').map(role => (
                                    <div
                                        key={role}
                                        className={`group/card relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 bg-white/40 border-slate-100/60 hover:bg-white hover:border-slate-200 hover:shadow-sm`}
                                    >
                                        <div className="flex items-center flex-1 min-w-0">
                                            {/* Indicador de interação discreto */}
                                            <div className="w-1 h-1 rounded-full bg-slate-200 mr-3 group-hover/card:bg-blue-500 group-hover/card:scale-125 transition-all shadow-sm" />
                                            
                                            <div className="flex flex-col flex-1 min-w-0">
                                                {editandoRole === role ? (
                                                    <div className="flex items-center gap-1.5 w-full">
                                                        <input
                                                            autoFocus
                                                            value={nomeRoleTemp}
                                                            onChange={e => setNomeRoleTemp(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleRenomearRoleAction(role);
                                                                if (e.key === 'Escape') setEditandoRole(null);
                                                            }}
                                                            onBlur={(e) => {
                                                                if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                                                                    setEditandoRole(null);
                                                                }
                                                            }}
                                                            disabled={salvandoRole}
                                                            className="flex-1 min-w-0 bg-transparent border-b border-slate-200 outline-none text-[11px] font-black tracking-[0.1em] uppercase text-foreground py-0.5 focus:border-slate-400 transition-all"
                                                        />
                                                        <div className="flex items-center">
                                                            <button 
                                                                onClick={() => handleRenomearRoleAction(role)}
                                                                disabled={salvandoRole}
                                                                className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                            >
                                                                {salvandoRole ? <Carregando Centralizar={false} tamanho="sm" className="w-3 h-3" /> : <Check size={12} strokeWidth={3} />}
                                                            </button>
                                                            <button 
                                                                onClick={() => setEditandoRole(null)}
                                                                disabled={salvandoRole}
                                                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            >
                                                                <X size={12} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group/title w-fit max-w-full">
                                                        <span className="text-[11px] font-black tracking-[0.15em] uppercase truncate text-slate-500 group-hover/card:text-slate-900 transition-colors">
                                                            {role}
                                                        </span>
                                                        {podeEditar && !CARGOS_FIXOS.includes(role) && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditandoRole(role);
                                                                    setNomeRoleTemp(role);
                                                                }}
                                                                className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-300 hover:text-blue-500 transition-all"
                                                            >
                                                                <Pencil size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!CARGOS_FIXOS.includes(role) && podeEditar && editandoRole !== role && (
                                            <button
                                                onClick={() => handleRemoverCargo(role)}
                                                className="p-1.5 text-slate-300/40 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/card:opacity-100"
                                                title="Remover cargo"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-4 relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 text-primary/10 group-hover:rotate-12 transition-transform duration-700">
                            <Info size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-primary mb-2.5">
                                <div className="p-1.5 bg-primary/10 rounded-2xl">
                                    <Info size={14} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Dica Admin</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">
                                Ative uma permissão na coluna <span className="text-emerald-500 font-black">TODOS</span> para concedê-la a qualquer membro, independente do cargo. <br /><br />
                                Alterações afetam todos em tempo real.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Coluna Principal: Matriz de Permissões Completa */}
                <div className="lg:col-span-9 space-y-6 overflow-hidden">
                    <section className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all">
                        <div className="px-6 py-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/10">
                                    <Lock size={20} />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-base font-black uppercase tracking-tight text-foreground leading-none">Matriz de Controle de Acesso</h2>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        {PERMISSOES_SISTEMA.reduce((acc, m) => acc + m.permissoes.length, 0)} permissões em {PERMISSOES_SISTEMA.length} módulos
                                    </p>
                                </div>
                            </div>

                            {erroLocal && (
                                <Alerta tipo="erro" mensagem={erroLocal} className="w-auto animate-in slide-in-from-right-4" />
                            )}

                            <div className="relative group/search max-w-xs w-full">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors">
                                    <Plus className="rotate-45" size={14} strokeWidth={3} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Pesquisar permissões..."
                                    value={buscaPermissao}
                                    onChange={(e) => setBuscaPermissao(e.target.value)}
                                    className="w-full h-10 bg-muted/40 border border-transparent rounded-2xl pl-10 pr-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/20 transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="sticky left-0 bg-slate-50/90 backdrop-blur-xl z-20 px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 min-w-[260px] border-r border-slate-100/50">
                                            Funcionalidade
                                        </th>
                                        {rolesMatriz.map(role => (
                                            <th key={role} className={`px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.1em] min-w-[100px] border-l border-slate-100/50 ${
                                                role === 'TODOS'
                                                    ? 'text-emerald-600 bg-emerald-500/[0.04]'
                                                    : 'text-slate-400'
                                            }`}>
                                                {role === 'TODOS' ? (
                                                    <span className="flex flex-col items-center gap-1.5 px-2">
                                                        <Globe size={14} className="text-emerald-500" />
                                                        {role}
                                                    </span>
                                                ) : role}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissoesFiltradas.map((grupo) => {
                                        const IconeModulo = grupo.icone;
                                        return (
                                            <React.Fragment key={grupo.modulo}>
                                                {/* Separador de módulo */}
                                                <tr className="bg-slate-50/20">
                                                    <td
                                                        colSpan={1 + rolesMatriz.length}
                                                        className="px-6 py-3 border-y border-slate-100"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1 px-2.5 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                                <IconeModulo size={12} className="text-blue-500" />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
                                                                {grupo.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Linhas de permissão */}
                                                {grupo.permissoes.map((perm) => (
                                                    <tr key={`${grupo.modulo}-${perm.chave}`} className="group transition-all hover:bg-slate-50/50">
                                                        <td className="sticky left-0 bg-white/95 backdrop-blur-md z-10 px-6 py-4 border-b border-slate-100/60 border-r border-slate-100/20 shadow-[8px_0_15px_-5px_rgba(0,0,0,0.01)] transition-colors group-hover:bg-slate-50/40">
                                                            <div className="flex items-center gap-4 pl-4 group-hover:translate-x-1 transition-transform duration-300">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-blue-500 group-hover:scale-125 transition-all" />
                                                                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors tracking-tight">{perm.label}</span>
                                                            </div>
                                                        </td>
                                                        {rolesMatriz.map(role => {
                                                            const ativa = configuracoes?.permissoes_roles[role]?.[perm.chave] ?? false;
                                                            const universal = (configuracoes?.permissoes_roles['TODOS'] as any)?.[perm.chave] ?? false;
                                                            const salvandoEste = salvando === `permissoes_roles.${role}.${perm.chave}`;
                                                            // Se TODOS tem a permissão, demais cargos ficam com check automático (bloqueado)
                                                            const forcadoPorTodos = role !== 'TODOS' && universal;

                                                            return (
                                                                <td key={`${role}-${perm.chave}`} className={`px-4 py-4 text-center border-b border-slate-100/60 border-l border-slate-100/20 ${role === 'TODOS' ? 'bg-emerald-500/[0.01]' : ''}`}>
                                                                    <div className="flex justify-center items-center">
                                                                        <button
                                                                            disabled={salvandoEste || !podeEditar || forcadoPorTodos}
                                                                            onClick={() => podeEditar && !forcadoPorTodos && handleTogglePermissao(role, perm.chave)}
                                                                            title={
                                                                                forcadoPorTodos ? 'Concedido via coluna TODOS'
                                                                                : !podeEditar ? 'Sem permissão para editar'
                                                                                : undefined
                                                                            }
                                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                                                                forcadoPorTodos
                                                                                    ? 'bg-emerald-500/10 text-emerald-600 cursor-not-allowed border border-emerald-500/20 shadow-sm'
                                                                                    : podeEditar ? 'cursor-pointer active:scale-90 hover:scale-105 shadow-sm' : 'cursor-not-allowed opacity-20 grayscale'
                                                                            } ${
                                                                                !forcadoPorTodos && ativa
                                                                                    ? role === 'TODOS'
                                                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                                                                        : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                                                    : !forcadoPorTodos
                                                                                        ? 'bg-slate-50/50 border border-slate-100 text-transparent hover:border-blue-300 hover:bg-white'
                                                                                        : ''
                                                                            } ${salvandoEste ? 'animate-pulse scale-90' : ''}`}
                                                                        >
                                                                            {(ativa || forcadoPorTodos) && <ShieldCheck size={14} strokeWidth={3} />}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}

                                    {permissoesFiltradas.length === 0 && (
                                        <tr>
                                            <td colSpan={1 + rolesMatriz.length} className="px-10 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                                    <Lock size={40} className="opacity-20" />
                                                    <p className="text-[11px] font-black uppercase tracking-widest">Nenhuma permissão encontrada para "{buscaPermissao}"</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
