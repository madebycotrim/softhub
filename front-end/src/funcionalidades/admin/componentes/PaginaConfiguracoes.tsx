import { useState, useMemo, Fragment, type FormEvent } from 'react';
import { usarConfiguracoes } from '@/funcionalidades/admin/hooks/usarConfiguracoes';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import {
    Plus, Lock, ShieldCheck, UserCircle,
    MessageSquare,
    Settings2, Trash2,
    FolderKanban, Clock, LayoutDashboard,
    LayoutGrid, FileText, Database, Globe,
    Pencil, Check, X, UserPlus, Shield
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
        label: 'Kanban & Backlog',
        icone: FolderKanban,
        permissoes: [
            { chave: 'tarefas:visualizar_kanban', label: 'Visualizar Quadro Kanban' },
            { chave: 'tarefas:visualizar_backlog', label: 'Visualizar Backlog' },
            { chave: 'tarefas:visualizar_detalhes', label: 'Ver Detalhes da Tarefa' },
            { chave: 'tarefas:criar', label: 'Criar' },
            { chave: 'tarefas:editar', label: 'Editar' },
            { chave: 'tarefas:mover', label: 'Mover' },
            { chave: 'tarefas:arquivar', label: 'Arquivar' },
            { chave: 'tarefas:comentar', label: 'Comentar' },
            { chave: 'tarefas:checklist', label: 'Checklist' },
            { chave: 'tarefas:visualizar_historico', label: 'Ver Histórico da Tarefa' },
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
            { chave: 'ponto:exportar', label: 'Exportar Relatório (CSV)' },
        ],
    },
    {
        modulo: 'membros',
        label: 'Membros',
        icone: UserCircle,
        permissoes: [
            { chave: 'membros:gerenciar', label: 'Gerenciar Membros (Lista)' },
            { chave: 'membros:alterar_role', label: 'Alterar Cargo' },
            { chave: 'membros:desativar', label: 'Desativar Membro' },
        ],
    },
    {
        modulo: 'avisos',
        label: 'Avisos & Notificações',
        icone: MessageSquare,
        permissoes: [
            { chave: 'avisos:visualizar', label: 'Visualizar Mural' },
            { chave: 'avisos:criar', label: 'Criar Aviso' },
            { chave: 'avisos:remover', label: 'Remover Aviso' },
            { chave: 'sistema:notificacoes', label: 'Receber Notificações Críticas' },
        ],
    },
    {
        modulo: 'equipes',
        label: 'Estrutura de Equipes',
        icone: LayoutGrid,
        permissoes: [
            { chave: 'equipes:visualizar', label: 'Visualizar Organograma' },
            { chave: 'equipes:criar_grupo', label: 'Criar Grupo' },
            { chave: 'equipes:editar_grupo', label: 'Editar Grupo' },
            { chave: 'equipes:criar_equipe', label: 'Criar Equipe' },
            { chave: 'equipes:editar_equipe', label: 'Editar Equipe' },
            { chave: 'equipes:alocar_membro', label: 'Alocar/Mover Membros' },
        ],
    },
    {
        modulo: 'dashboard',
        label: 'Dashboard',
        icone: LayoutDashboard,
        permissoes: [
            { chave: 'dashboard:visualizar', label: 'Visualizar Métricas Gerais' },
        ],
    },
    {
        modulo: 'relatorios',
        label: 'Relatórios',
        icone: FileText,
        permissoes: [
            { chave: 'relatorios:visualizar', label: 'Visualizar Relatórios' },
            { chave: 'relatorios:imprimir', label: 'Exportar/Imprimir Dados' },
        ],
    },
    {
        modulo: 'logs',
        label: 'Painel de Logs',
        icone: Database,
        permissoes: [
            { chave: 'logs:visualizar', label: 'Ver histórico global (Auditoria completa)' },
        ],
    },
    {
        modulo: 'configuracoes',
        label: 'Configurações',
        icone: Settings2,
        permissoes: [
            { chave: 'configuracoes:visualizar', label: 'Visualizar Painel' },
            { chave: 'configuracoes:editar', label: 'Editar Governança' },
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

    const [novoDominio, setNovoDominio] = useState('');
    const [salvandoGov, setSalvandoGov] = useState<string | null>(null);
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
    const handleAddCargo = async (e: FormEvent) => {
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

            {/* Banner de Erro Local */}
            {erroLocal && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Alerta tipo="erro" mensagem={erroLocal} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                    {/* Modo de Manutenção - PRIORIDADE MÁXIMA */}
                    <div className={`border rounded-2xl shadow-lg transition-all duration-500 overflow-hidden ${
                        configuracoes?.modo_manutencao 
                        ? 'bg-rose-500/10 border-rose-500/40 shadow-rose-500/5' 
                        : 'bg-card border-border shadow-sm'
                    }`}>
                        <div className={`p-5 flex items-center gap-3 ${configuracoes?.modo_manutencao ? 'bg-rose-500/5' : 'bg-muted/10'}`}>
                            <div className={`p-2.5 rounded-xl shadow-sm transition-all duration-300 ${
                                configuracoes?.modo_manutencao ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-500/10 text-slate-500'
                            }`}>
                                <Settings2 size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className={`text-xs font-black uppercase tracking-[0.15em] leading-none ${configuracoes?.modo_manutencao ? 'text-rose-600' : 'text-foreground'}`}>
                                    SISTEMA
                                </h3>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Status Global</span>
                            </div>
                        </div>
                        <div className="p-5">
                            <button 
                                onClick={async () => {
                                    if (!configuracoes) return;
                                    setSalvandoGov('modo_manutencao');
                                    await atualizarConfiguracao('modo_manutencao', !configuracoes.modo_manutencao);
                                    setSalvandoGov(null);
                                }}
                                className={`w-full group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                                    configuracoes?.modo_manutencao 
                                    ? 'bg-rose-600 text-white border-rose-400' 
                                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {configuracoes?.modo_manutencao ? 'Manutenção Ativa' : 'Sistema Online'}
                                </span>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${configuracoes?.modo_manutencao ? 'bg-white/30' : 'bg-muted-foreground/20'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${configuracoes?.modo_manutencao ? 'left-4.5' : 'left-0.5'}`} />
                                </div>
                            </button>
                            <p className="mt-3 text-[9px] text-muted-foreground font-medium leading-relaxed px-1">
                                <span className="font-black text-rose-500/80 mr-1 uppercase">Atenção:</span>
                                Ativar o modo de manutenção bloqueia o acesso de todos os membros, exceto administradores.
                            </p>
                        </div>
                    </div>

                    {/* Seção 1: Governança & Segurança */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 shadow-sm shadow-indigo-500/5">
                                <Shield size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Governança</h3>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Controle Crítico</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Switch de Auto-cadastro */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 block ml-1">Auto-cadastro</label>
                                <button 
                                    disabled={!podeEditar || salvandoGov === 'auto_cadastro'}
                                    onClick={async () => {
                                        if (!configuracoes) return;
                                        setSalvandoGov('auto_cadastro');
                                        await atualizarConfiguracao('auto_cadastro', !configuracoes.auto_cadastro);
                                        setSalvandoGov(null);
                                    }}
                                    className={`w-full group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                        configuracoes?.auto_cadastro 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' 
                                        : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${configuracoes?.auto_cadastro ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-muted'}`}>
                                            <UserPlus size={16} />
                                        </div>
                                        <div className="flex flex-col items-start translate-y-[-1px]">
                                            <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                                                {configuracoes?.auto_cadastro ? 'Ativado' : 'Bloqueado'}
                                            </span>
                                            <span className="text-[9px] font-bold opacity-70 mt-1">
                                                {configuracoes?.auto_cadastro ? 'Registro Aberto' : 'Acesso Restrito'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-9 h-5 rounded-full relative transition-colors ${configuracoes?.auto_cadastro ? 'bg-emerald-500/40' : 'bg-muted-foreground/20'}`}>
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${configuracoes?.auto_cadastro ? 'left-5' : 'left-1'}`} />
                                    </div>
                                </button>
                            </div>

                            {/* Domínios Autorizados */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 block ml-1">Domínios Válidos</label>
                                <div className="space-y-2">
                                    {(configuracoes?.dominios_autorizados || ['unieuro.edu.br']).map(dominio => (
                                        <div key={dominio} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40 group/dom hover:bg-muted/40 transition-colors">
                                            <span className="text-[11px] font-bold text-foreground/80 lowercase tracking-wide">@{dominio}</span>
                                            {podeEditar && (configuracoes?.dominios_autorizados || []).length > 1 && (
                                                <button 
                                                    onClick={async () => {
                                                        if (!configuracoes) return;
                                                        const novos = configuracoes.dominios_autorizados.filter(d => d !== dominio);
                                                        await atualizarConfiguracao('dominios_autorizados', novos);
                                                    }}
                                                    className="opacity-0 group-hover/dom:opacity-100 p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {podeEditar && (
                                    <form 
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!novoDominio || !configuracoes) return;
                                            const limpo = novoDominio.replace('@', '').toLowerCase();
                                            if (configuracoes.dominios_autorizados?.includes(limpo)) return;
                                            const novos = [...(configuracoes.dominios_autorizados || []), limpo];
                                            await atualizarConfiguracao('dominios_autorizados', novos);
                                            setNovoDominio('');
                                        }}
                                        className="flex gap-2"
                                    >
                                        <input 
                                            placeholder="Ex: dominio.com"
                                            value={novoDominio}
                                            onChange={e => setNovoDominio(e.target.value)}
                                            className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none focus:bg-background focus:border-indigo-500/30 transition-all placeholder:text-muted-foreground/30"
                                        />
                                        <button className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/10 active:scale-95 transition-all hover:bg-indigo-600 flex items-center justify-center">
                                            <Plus size={18} strokeWidth={3} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* IPs Autorizados para Ponto */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shadow-sm shadow-amber-500/5">
                                <Database size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Rede Ponto</h3>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Whitelist de IPs</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                {(configuracoes?.ips_autorizados_ponto || []).length === 0 ? (
                                    <span className="text-[10px] text-muted-foreground/50 italic px-1 block">Nenhuma restrição de IP configurada.</span>
                                ) : (
                                    (configuracoes?.ips_autorizados_ponto || []).map(ip => (
                                        <div key={ip} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40 group/ip hover:bg-muted/40 transition-colors">
                                            <span className="text-[11px] font-mono font-bold text-foreground/80 tracking-widest">{ip}</span>
                                            {podeEditar && (
                                                <button 
                                                    onClick={async () => {
                                                        if (!configuracoes) return;
                                                        const novos = configuracoes.ips_autorizados_ponto.filter(i => i !== ip);
                                                        await atualizarConfiguracao('ips_autorizados_ponto', novos);
                                                    }}
                                                    className="opacity-0 group-hover/ip:opacity-100 p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {podeEditar && (
                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.currentTarget);
                                        const ip = formData.get('ip') as string;
                                        if (!ip || !configuracoes) return;
                                        if (configuracoes.ips_autorizados_ponto?.includes(ip)) return;
                                        const novos = [...(configuracoes.ips_autorizados_ponto || []), ip];
                                        await atualizarConfiguracao('ips_autorizados_ponto', novos);
                                        (e.target as HTMLFormElement).reset();
                                    }}
                                    className="flex gap-2"
                                >
                                    <input 
                                        name="ip"
                                        placeholder="Ex: 192.168.1.1"
                                        className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none focus:bg-background focus:border-amber-500/30 transition-all placeholder:text-muted-foreground/30 font-mono"
                                    />
                                    <button className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all hover:bg-amber-600 flex items-center justify-center">
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Seção 2: Gestão de Cargos */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm shadow-primary/5">
                                <ShieldCheck size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Cargos</h3>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Hierarquia do Time</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Formulário para adicionar cargo */}
                            {podeEditar && (
                                <form onSubmit={handleAddCargo} className="flex gap-2">
                                    <input
                                        required
                                        value={novoCargo}
                                        onChange={e => setNovoCargo(e.target.value)}
                                        placeholder="EX: LIDER_TECH"
                                        className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all uppercase placeholder:text-muted-foreground/30"
                                    />
                                    <button
                                        type="submit"
                                        className="p-2.5 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10 active:scale-95 transition-all hover:bg-primary/90 flex items-center justify-center"
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </form>
                            )}

                            {/* Lista de cargos */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 block ml-1">Cargos Ativos</label>
                                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                                    {roles.filter(r => r !== 'TODOS' && r !== 'ADMIN').map(role => (
                                        <div
                                            key={role}
                                            className="group/card flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/30 hover:bg-muted/20 hover:border-border transition-all"
                                        >
                                            <div className="flex items-center flex-1 min-w-0">
                                                <div className="w-1 h-1 rounded-full bg-muted-foreground/30 mr-3 transition-all group-hover/card:bg-primary group-hover/card:scale-125" />
                                                
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    {editandoRole === role ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                autoFocus
                                                                value={nomeRoleTemp}
                                                                onChange={e => setNomeRoleTemp(e.target.value)}
                                                                className="flex-1 bg-transparent border-b border-primary/20 outline-none text-[10px] font-black uppercase text-foreground py-0.5"
                                                            />
                                                            <button onClick={() => handleRenomearRoleAction(role)} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded-md transition-colors">
                                                                 <Check size={12} strokeWidth={3} />
                                                            </button>
                                                            <button onClick={() => setEditandoRole(null)} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-md transition-colors">
                                                                <X size={12} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70 group-hover/card:text-foreground transition-colors truncate">
                                                                {role}
                                                            </span>
                                                            {podeEditar && !CARGOS_FIXOS.includes(role) && (
                                                                <button onClick={() => { setEditandoRole(role); setNomeRoleTemp(role); }} className="opacity-0 group-hover/card:opacity-100 p-1 text-muted-foreground hover:text-primary transition-all">
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
                                                    className="opacity-0 group-hover/card:opacity-100 p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção 3: Governança de Dados (Compliance) */}
                    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-fit">
                        <div className="p-5 border-b border-border bg-muted/10 flex items-center gap-3">
                            <div className="p-2.5 bg-slate-500/10 rounded-xl text-slate-500 shadow-sm shadow-slate-500/5">
                                <Database size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-foreground leading-none">Dados</h3>
                                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Compliance & Retenção</span>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col gap-3">
                            <button 
                                className="w-full h-12 flex items-center justify-center gap-3 px-4 bg-muted/20 border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-all rounded-xl group/exp"
                                onClick={() => alert('Esta funcionalidade requer confirmação via token de segurança.')}
                            >
                                <Trash2 size={14} className="group-hover/exp:scale-110 transition-transform" />
                                Limpar Auditoria ({'>'} 6 meses)
                            </button>
                            <p className="text-[8.5px] text-muted-foreground/60 leading-relaxed text-center px-4">
                                Conforme Marco Civil da Internet (Art. 15), logs de acesso devem ser mantidos por 6 meses.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Coluna Principal: Matriz de Permissões Completa */}
                <div className="lg:col-span-9 space-y-6">
                    <section className="bg-card border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all group/matriz">
                        {/* Header da Matriz */}
                        <div className="px-6 py-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-muted/10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10">
                                    <Lock size={20} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-[13px] font-black uppercase tracking-[0.15em] text-foreground leading-none">Matriz de Controle de Acesso</h2>
                                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 opacity-60">
                                        {PERMISSOES_SISTEMA.reduce((acc, m) => acc + m.permissoes.length, 0)} Regras Ativas • {PERMISSOES_SISTEMA.length} Domínios
                                    </span>
                                </div>
                            </div>

                            <div className="relative group/search max-w-xs w-full">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors">
                                    <Plus className="rotate-45" size={14} strokeWidth={3} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Filtrar por nome ou módulo..."
                                    value={buscaPermissao}
                                    onChange={(e) => setBuscaPermissao(e.target.value)}
                                    className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl pl-11 pr-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar bg-card border-x border-border/20">
                            <table className="w-full border-collapse">
                                <thead className="relative z-30">
                                    <tr className="border-b border-border bg-muted/5">
                                        <th className="sticky left-0 bg-card/90 backdrop-blur-md z-40 px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 min-w-[300px] border-r border-border/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                                            Capacidade / Módulo
                                        </th>
                                        {rolesMatriz.map(role => (
                                            <th key={role} className={`px-6 py-4 text-center min-w-[140px] border-r border-border/30 last:border-0 ${role === 'TODOS' ? 'bg-emerald-500/[0.03]' : ''}`}>
                                                <div className="flex flex-col items-center gap-2">
                                                    {role === 'TODOS' && <Globe size={14} className="text-emerald-500 mb-1" />}
                                                    <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${role === 'ADMIN' ? 'text-primary' : role === 'TODOS' ? 'text-emerald-600' : 'text-foreground/80'}`}>
                                                        {role}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissoesFiltradas.map((grupo) => {
                                        const IconeModulo = grupo.icone;
                                        return (
                                            <Fragment key={grupo.modulo}>
                                                {/* Separador de módulo */}
                                                <tr className="bg-muted/5">
                                                    <td
                                                        colSpan={1 + rolesMatriz.length}
                                                        className="px-6 py-3 border-y border-border/40"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-background border border-border/60 rounded-xl shadow-sm">
                                                                <IconeModulo size={14} className="text-primary/60" />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/50">
                                                                {grupo.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Linhas de permissão */}
                                                {grupo.permissoes.map((perm) => (
                                                    <tr key={`${grupo.modulo}-${perm.chave}`} className="group transition-all hover:bg-muted/10">
                                                        <td className="sticky left-0 bg-card/95 backdrop-blur-md z-10 px-6 py-4 border-b border-border/40 border-r border-border/20 shadow-[8px_0_15px_-5px_rgba(0,0,0,0.01)] transition-colors group-hover:bg-muted/20">
                                                            <div className="flex items-center gap-3 pl-2 group-hover:translate-x-1 transition-transform duration-300">
                                                                <div className="w-1 h-1 rounded-full bg-border group-hover:bg-primary group-hover:scale-125 transition-all outline outline-4 outline-transparent group-hover:outline-primary/5" />
                                                                <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors tracking-tight">{perm.label}</span>
                                                            </div>
                                                        </td>
                                                        {rolesMatriz.map(role => {
                                                            const ativa = configuracoes?.permissoes_roles[role]?.[perm.chave] ?? false;
                                                            const universal = (configuracoes?.permissoes_roles['TODOS'] as any)?.[perm.chave] ?? false;
                                                            const salvandoEste = salvando === `permissoes_roles.${role}.${perm.chave}`;
                                                            const forcadoPorTodos = role !== 'TODOS' && universal;

                                                            return (
                                                                <td key={`${role}-${perm.chave}`} className={`px-4 py-4 text-center border-b border-border/40 border-r border-border/10 last:border-r-0 ${role === 'TODOS' ? 'bg-emerald-500/[0.01]' : ''}`}>
                                                                    <div className="flex justify-center items-center">
                                                                        <button
                                                                            disabled={salvandoEste || !podeEditar || forcadoPorTodos}
                                                                            onClick={() => podeEditar && !forcadoPorTodos && handleTogglePermissao(role, perm.chave)}
                                                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${forcadoPorTodos
                                                                                    ? 'bg-emerald-500/20 text-emerald-600 cursor-not-allowed'
                                                                                    : podeEditar ? 'cursor-pointer active:scale-90 hover:scale-105 shadow-sm' : 'cursor-not-allowed opacity-20'
                                                                                } ${!forcadoPorTodos && ativa
                                                                                    ? role === 'TODOS'
                                                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                                                                        : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                                                                    : !forcadoPorTodos
                                                                                        ? 'bg-muted/40 border border-border/30 text-transparent hover:border-primary/40'
                                                                                        : ''
                                                                                } ${salvandoEste ? 'animate-pulse scale-90' : ''}`}
                                                                        >
                                                                            {(ativa || forcadoPorTodos) && <ShieldCheck size={16} strokeWidth={2.5} />}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </Fragment>
                                        );
                                    })}

                                    {permissoesFiltradas.length === 0 && (
                                        <tr>
                                            <td colSpan={1 + rolesMatriz.length} className="px-10 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 text-muted-foreground/30">
                                                    <Lock size={48} strokeWidth={1} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma permissão para "{buscaPermissao}"</p>
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
