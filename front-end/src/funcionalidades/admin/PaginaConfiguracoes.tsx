import React, { useState, useMemo } from 'react';
import { usarConfiguracoes } from './usarConfiguracoes';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { 
    Plus, Lock, ShieldCheck, 
    Crown, UserCircle, MessageSquare,
    Settings2, Info, Trash2,
    FolderKanban, Clock, LayoutDashboard,
    LayoutGrid, FileText, Database
} from 'lucide-react';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';

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
            { chave: 'membros:visualizar', label: 'Visualizar Diretório' },
            { chave: 'membros:editar_perfil', label: 'Editar Perfil Próprio' },
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
        modulo: 'organizacao',
        label: 'Estrutura Organizacional',
        icone: LayoutGrid,
        permissoes: [
            { chave: 'organizacao:visualizar', label: 'Visualizar' },
            { chave: 'organizacao:criar_grupo', label: 'Criar Grupo' },
            { chave: 'organizacao:editar_grupo', label: 'Editar Grupo' },
            { chave: 'organizacao:criar_equipe', label: 'Criar Equipe' },
            { chave: 'organizacao:editar_equipe', label: 'Editar Equipe' },
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
            { chave: 'logs:visualizar', label: 'Visualizar' },
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

/**
 * Página de Configurações & Governança.
 * Gestão de cargos e matriz de permissões completa com todas as funções reais do sistema.
 */
export function PaginaConfiguracoes() {
    const { configuracoes, carregando, erro, atualizarConfiguracao } = usarConfiguracoes();
    
    const [novoCargo, setNovoCargo] = useState('');
    const [salvando, setSalvando] = useState<string | null>(null);

    /** Lista de roles/cargos cadastrados - Sempre garante que ADMIN esteja no topo */
    const roles = useMemo(() => {
        const baseRoles = configuracoes?.permissoes_roles ? Object.keys(configuracoes.permissoes_roles) : [];
        const listaUnica = Array.from(new Set(['ADMIN', ...baseRoles]));
        return listaUnica;
    }, [configuracoes]);

    if (carregando) return <Carregando />;
    if (erro) return <div className="p-10 text-center text-red-500 font-bold uppercase tracking-widest">{erro}</div>;

    /** Alterna uma permissão entre ativo/inativo para um cargo */
    const handleTogglePermissao = async (role: string, permissao: string) => {
        if (!configuracoes) return;
        const chave = `permissoes_roles.${role}.${permissao}`;
        setSalvando(chave);
        
        try {
            const novasPermissoes = { ...configuracoes.permissoes_roles };
            novasPermissoes[role] = { ...novasPermissoes[role], [permissao]: !novasPermissoes[role]?.[permissao] };
            await atualizarConfiguracao('permissoes_roles', novasPermissoes);
        } finally {
            setSalvando(null);
        }
    };

    /** Adiciona um novo cargo com permissões básicas */
    const handleAddCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoCargo || !configuracoes) return;
        
        const novasPermissoes = { 
            ...configuracoes.permissoes_roles, 
            [novoCargo.toUpperCase()]: { 
                "tarefas:visualizar": true,
                "ponto:registrar": true,
                "membros:visualizar": true,
                "membros:editar_perfil": true,
                "avisos:visualizar": true,
                "dashboard:visualizar": true,
            } 
        };

        const res = await atualizarConfiguracao('permissoes_roles', novasPermissoes);
        if (res.sucesso) {
            setNovoCargo('');
        }
    };

    /** Remove um cargo (exceto ADMIN) */
    const handleRemoverCargo = async (role: string) => {
        if (!configuracoes || role === 'ADMIN') return;
        const novasPermissoes = { ...configuracoes.permissoes_roles };
        delete novasPermissoes[role];
        await atualizarConfiguracao('permissoes_roles', novasPermissoes);
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CabecalhoFuncionalidade
                titulo="Configurações"
                subtitulo="Governança, Permissões e Hierarquia do SoftHub"
                icone={Settings2}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Lateral: Gestão de Cargos Inline */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Seção: Cargos */}
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">Cargos</h3>
                                <span className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-[0.1em]">Configurar Hierarquia</span>
                            </div>
                        </div>

                        {/* Formulário para adicionar cargo */}
                        <form onSubmit={handleAddCargo} className="flex gap-2">
                            <input 
                                required
                                value={novoCargo}
                                onChange={e => setNovoCargo(e.target.value)}
                                placeholder="EX: LIDER_TECH"
                                className="flex-1 min-w-0 bg-muted/20 border border-border/40 rounded-xl px-3 py-2.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase placeholder:text-muted-foreground/30"
                            />
                            <button 
                                type="submit"
                                className="p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all hover:bg-indigo-600 shrink-0"
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        </form>

                        {/* Lista de cargos existentes */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 px-1">Cargos</label>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                                {roles.map(role => (
                                    <div 
                                        key={role} 
                                        className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:bg-muted/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                                role === 'ADMIN' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground/60'
                                            }`}>
                                                {role === 'ADMIN' ? <Crown size={12} /> : <ShieldCheck size={12} />}
                                            </div>
                                            <span className={`text-[12px] font-medium tracking-tight ${role === 'ADMIN' ? 'text-amber-600' : 'text-foreground/80'}`}>
                                                {role}
                                            </span>
                                        </div>
                                        {role !== 'ADMIN' && (
                                            <button 
                                                onClick={() => handleRemoverCargo(role)}
                                                className="p-1.5 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Legenda */}
                    <div className="bg-card/30 border border-border/30 rounded-2xl p-5 space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1">Guia Visual</span>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                                    <ShieldCheck size={10} className="text-white" strokeWidth={3} />
                                </div>
                                <span className="text-[11px] text-muted-foreground/60 font-medium">Ativo</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border border-border/60 bg-muted/20" />
                                <span className="text-[11px] text-muted-foreground/60 font-medium">Inativo</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-amber-600 flex items-center justify-center">
                                    <Crown size={10} className="text-white" strokeWidth={3} />
                                </div>
                                <span className="text-[11px] text-muted-foreground/60 font-medium">Admin Global</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                            <Info size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Dica Admin</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                            Alterações nesta página afetam o acesso de todos os membros em tempo real. Use com cautela.
                        </p>
                    </div>
                </div>

                {/* Coluna Principal: Matriz de Permissões Completa */}
                <div className="lg:col-span-9 space-y-6">
                    <section className="bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-border/20 flex items-center justify-between bg-muted/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h2 className="text-[14px] font-black uppercase tracking-widest text-foreground">Matriz de Controle de Acesso</h2>
                                    <p className="text-[10px] text-muted-foreground/40 font-medium mt-1">
                                        {PERMISSOES_SISTEMA.reduce((acc, m) => acc + m.permissoes.length, 0)} permissões em {PERMISSOES_SISTEMA.length} módulos
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/10">
                                        <th className="sticky left-0 bg-muted/5 backdrop-blur-sm z-20 px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 border-b border-border/20 min-w-[250px]">
                                            Funcionalidade
                                        </th>
                                        {roles.map(role => (
                                            <th key={role} className="px-4 py-5 text-center border-b border-border/20 min-w-[90px]">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-[10px] font-bold tracking-widest uppercase ${
                                                        role === 'ADMIN' ? 'text-amber-600/60' : 'text-foreground/40'
                                                    }`}>
                                                        {role}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PERMISSOES_SISTEMA.map((grupo) => {
                                        const IconeModulo = grupo.icone;
                                        return (
                                            <React.Fragment key={grupo.modulo}>
                                                {/* Header do módulo */}
                                                <tr key={`header-${grupo.modulo}`} className="bg-muted/5">
                                                    <td 
                                                        colSpan={1 + roles.length} 
                                                        className="px-8 py-3 border-y border-border/10"
                                                    >
                                                        <div className="flex items-center gap-2.5 opacity-60">
                                                            <IconeModulo size={14} className="text-muted-foreground" />
                                                            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/70">
                                                                {grupo.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Linhas de permissão */}
                                                {grupo.permissoes.map((perm) => (
                                                    <tr key={`${grupo.modulo}-${perm.chave}`} className="group border-b border-border/5">
                                                        <td className="sticky left-0 bg-background/50 backdrop-blur-md z-10 px-8 py-3.5">
                                                            <div className="flex items-center gap-3 pl-4">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/40 transition-colors" />
                                                                <span className="text-[12px] font-medium text-foreground/50 group-hover:text-foreground/80 transition-colors">{perm.label}</span>
                                                            </div>
                                                        </td>
                                                        {roles.map(role => {
                                                            const ativa = role === 'ADMIN' ? true : (configuracoes?.permissoes_roles[role]?.[perm.chave] ?? false);
                                                            const salvandoEste = salvando === `permissoes_roles.${role}.${perm.chave}`;

                                                            return (
                                                                <td key={`${role}-${perm.chave}`} className="px-4 py-3 text-center">
                                                                    <div className="flex justify-center items-center">
                                                                        <button 
                                                                            disabled={role === 'ADMIN' || salvandoEste}
                                                                            onClick={() => handleTogglePermissao(role, perm.chave)}
                                                                            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                                                                                ativa 
                                                                                    ? role === 'ADMIN' 
                                                                                        ? 'bg-amber-600 text-white shadow-sm'
                                                                                        : 'bg-blue-600 text-white shadow-sm' 
                                                                                    : 'bg-muted/30 border border-border/60 text-transparent hover:border-primary/60'
                                                                            } ${salvandoEste ? 'animate-pulse' : ''} ${role === 'ADMIN' ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                                                                        >
                                                                            {ativa && (
                                                                                role === 'ADMIN' 
                                                                                    ? <Crown size={9} strokeWidth={3} />
                                                                                    : <ShieldCheck size={9} strokeWidth={3} />
                                                                            )}
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
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
