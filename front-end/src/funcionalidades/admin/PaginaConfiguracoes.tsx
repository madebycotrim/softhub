import { useState, useMemo } from 'react';
import { usarConfiguracoes } from './usarConfiguracoes';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { 
    Plus, Lock, ShieldCheck, 
    Crown, UserCircle, MessageSquare,
    Settings2, Info, Trash2,
    FolderKanban, Clock, LayoutDashboard,
    LayoutGrid, FileText, Database, ClipboardCheck
} from 'lucide-react';

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

    /** Lista de roles/cargos cadastrados */
    const roles = useMemo(() => {
        if (!configuracoes?.permissoes_roles) return [];
        return Object.keys(configuracoes.permissoes_roles);
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Settings2 size={24} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">Configurações</h1>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-14">Governança, Permissões e Hierarquia do SoftHub</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Coluna Lateral: Gestão de Cargos Inline */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Seção: Cargos */}
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all space-y-5">
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
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">Cargos existentes</label>
                            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                                {roles.map(role => (
                                    <div key={role} className="flex items-center justify-between p-3 bg-muted/10 rounded-xl border border-border/5 group hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                                {role === 'ADMIN' ? <Crown size={12} /> : <ShieldCheck size={12} />}
                                            </div>
                                            <span className="text-[11px] font-black text-foreground/80">{role}</span>
                                        </div>
                                        {role !== 'ADMIN' && (
                                            <button 
                                                onClick={() => handleRemoverCargo(role)}
                                                className="p-1.5 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {roles.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground/40 text-center py-4">Nenhum cargo cadastrado</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legenda */}
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[28px] p-5 space-y-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Legenda</span>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <ShieldCheck size={10} className="text-primary-foreground" strokeWidth={3} />
                                </div>
                                <span className="text-[10px] text-muted-foreground/60 font-medium">Permissão ativa</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-md bg-muted/10 border border-border/40" />
                                <span className="text-[10px] text-muted-foreground/60 font-medium">Permissão inativa</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Crown size={12} className="text-amber-500 ml-1" />
                                <span className="text-[10px] text-muted-foreground/60 font-medium">ADMIN tem tudo ativo</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 rounded-[28px] border border-primary/10 space-y-3">
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
                    <section className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] shadow-sm flex flex-col overflow-hidden">
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
                                        <th className="sticky left-0 bg-card/80 backdrop-blur-md z-10 px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/20 min-w-[220px]">
                                            Permissão
                                        </th>
                                        {roles.map(role => (
                                            <th key={role} className="px-4 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/20 min-w-[80px]">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={role === 'ADMIN' ? 'text-primary' : 'text-foreground'}>{role}</span>
                                                    {role === 'ADMIN' && <Crown size={10} className="text-amber-500" />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {PERMISSOES_SISTEMA.map((grupo) => {
                                        const IconeModulo = grupo.icone;
                                        return (
                                            <>
                                                {/* Header do módulo */}
                                                <tr key={`header-${grupo.modulo}`} className="bg-muted/5">
                                                    <td 
                                                        colSpan={1 + roles.length} 
                                                        className="sticky left-0 px-6 py-3 border-t border-border/10"
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                <IconeModulo size={14} />
                                                            </div>
                                                            <span className="text-[11px] font-black uppercase tracking-wider text-foreground/80">
                                                                {grupo.label}
                                                            </span>
                                                            <span className="text-[9px] text-muted-foreground/30 font-bold ml-1">
                                                                {grupo.permissoes.length} {grupo.permissoes.length === 1 ? 'permissão' : 'permissões'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Linhas de permissão */}
                                                {grupo.permissoes.map((perm) => (
                                                    <tr key={perm.chave} className="group hover:bg-primary/[0.02] transition-colors">
                                                        <td className="sticky left-0 bg-card/80 backdrop-blur-md z-10 px-6 py-3.5 border-r border-border/5">
                                                            <div className="flex items-center gap-3 pl-9">
                                                                <ClipboardCheck size={12} className="text-muted-foreground/30 shrink-0" />
                                                                <span className="text-[11px] font-semibold text-foreground/60">{perm.label}</span>
                                                            </div>
                                                        </td>
                                                        {roles.map(role => {
                                                            const ativa = role === 'ADMIN' ? true : (configuracoes?.permissoes_roles[role]?.[perm.chave] ?? false);
                                                            const salvandoEste = salvando === `permissoes_roles.${role}.${perm.chave}`;

                                                            return (
                                                                <td key={`${role}-${perm.chave}`} className="px-4 py-3.5 text-center">
                                                                    <button 
                                                                        disabled={role === 'ADMIN' || salvandoEste}
                                                                        onClick={() => handleTogglePermissao(role, perm.chave)}
                                                                        className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all border ${
                                                                            ativa 
                                                                                ? 'bg-primary text-primary-foreground border-transparent shadow-lg shadow-primary/20 scale-110' 
                                                                                : 'bg-muted/10 border-border/40 text-transparent hover:border-primary/40'
                                                                        } ${salvandoEste ? 'animate-pulse' : ''} ${role === 'ADMIN' ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                                                                    >
                                                                        {ativa && <ShieldCheck size={12} strokeWidth={3} />}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </>
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
