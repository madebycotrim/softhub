import { useState, useMemo, Fragment } from 'react';
import { CabecalhoFuncionalidade } from '../../compartilhado/componentes/CabecalhoFuncionalidade';
import { usarConfiguracoes } from './usarConfiguracoes';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { 
    Settings, Plus, X, Lock, ShieldCheck, LayoutGrid, Clock, Users, 
    ChevronRight, Crown, UserCircle, MessageSquare, Activity
} from 'lucide-react';
import { usarOrganizacao } from './usarOrganizacao';
import { usarMembros } from '../membros/usarMembros';

/**
 * Página de Configurações Globais do Sistema.
 * Permite que administradores gerenciem parâmetros de negócio e permissões.
 */
export function PaginaConfiguracoes() {
    const { configuracoes, carregando: carregandoConfig, erro: erroConfig, atualizarConfiguracao } = usarConfiguracoes();
    const { grupos, equipes, criarEquipe, criarGrupo, editarGrupo } = usarOrganizacao();
    const { membros } = usarMembros();
    
    const [novoCargo, setNovoCargo] = useState('');
    const [novoGrupoNome, setNovoGrupoNome] = useState('');
    const [novaEquipeNome, setNovaEquipeNome] = useState('');
    const [grupoAlvo, setGrupoAlvo] = useState('');
    const [salvando, setSalvando] = useState<string | null>(null);

    // Sincroniza o grupo alvo inicial quando os grupos carregam
    useMemo(() => {
        if (grupos.length > 0 && !grupoAlvo) {
            setGrupoAlvo(grupos[0].id);
        }
    }, [grupos, grupoAlvo]);

    const carregando = carregandoConfig; // Organizacao ja trata loading internamente ou nao e critico
    const erro = erroConfig;

    // Agrupamento de permissões por módulo e ordenação de roles por hierarquia
    const permissoesAgrupadas = useMemo(() => {
        if (!configuracoes?.permissoes_roles) return { groups: {}, roles: [] };
        
        const hierarchy = ['VISITANTE', 'MEMBRO', 'LIDER_EQUIPE', 'LIDER_GRUPO', 'ADMIN'];
        const roles = Object.keys(configuracoes.permissoes_roles).sort((a, b) => {
            const indexA = hierarchy.indexOf(a);
            const indexB = hierarchy.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        const gruposPerms: Record<string, { id: string; titulo: string; icone: any; permissoes: string[] }> = {
            kanban: { 
                id: 'kanban', 
                titulo: '📦 Kanban & Tarefas', 
                icone: LayoutGrid, 
                permissoes: ['criar_tarefa', 'mover_tarefa', 'arquivar_tarefa', 'comentar_tarefa', 'gerenciar_checklist', 'ver_historico_tarefa', 'gerenciar_sprint'] 
            },
            ponto: { 
                id: 'ponto', 
                titulo: '🕒 Registro de Ponto', 
                icone: Clock, 
                permissoes: ['bater_ponto', 'ver_proprio_ponto', 'justificar_ponto', 'aprovar_justificativa', 'exportar_relatorio_ponto'] 
            },
            membros: { 
                id: 'membros', 
                titulo: '👥 Gestão de Membros', 
                icone: Users, 
                permissoes: ['ver_lista_membros', 'cadastrar_membros', 'alterar_papeis', 'desativar_membros', 'limpar_definitivamente'] 
            },
            estrutura: { 
                id: 'estrutura', 
                titulo: '🏢 Organização & Estrutura', 
                icone: ShieldCheck, 
                permissoes: ['gerenciar_grupos', 'gerenciar_equipes', 'alocar_membros', 'publicar_portfolio'] 
            },
            comunicacao: { 
                id: 'comunicacao', 
                titulo: '📢 Avisos & Dashboard', 
                icone: MessageSquare, 
                permissoes: ['criar_avisos', 'remover_avisos', 'ver_dashboard_equipe', 'ver_dashboard_geral'] 
            },
            sistema: { 
                id: 'sistema', 
                titulo: '🛡️ Administração & Audit', 
                icone: Activity, 
                permissoes: ['configurar_sistema', 'ver_logs_globais', 'gerenciar_backups'] 
            }
        };

        return { groups: gruposPerms, roles };
    }, [configuracoes]);

    // Formatador de labels para as roles
    const formatarRole = (role: string) => {
        const config: Record<string, { label: string; icone: any; cor: string }> = {
            'VISITANTE': { label: 'Visitante', icone: UserCircle, cor: 'text-slate-400' },
            'MEMBRO': { label: 'Membro', icone: Users, cor: 'text-blue-400' },
            'LIDER_EQUIPE': { label: 'Líder Equipe', icone: ShieldCheck, cor: 'text-emerald-400' },
            'LIDER_GRUPO': { label: 'Líder Grupo', icone: Crown, cor: 'text-amber-400' },
            'ADMIN': { label: 'Admin', icone: ShieldCheck, cor: 'text-purple-400' }
        };
        const res = config[role] || { label: role, icone: UserCircle, cor: 'text-muted-foreground' };
        return res;
    };

    if (carregando) return <Carregando />;
    if (erro) return <div className="p-10 text-center text-red-500 font-medium bg-red-500/5 rounded-2xl border border-red-500/20">{erro}</div>;

    const handleAddCargo = async () => {
        if (!novoCargo.trim() || !configuracoes) return;
        const roleName = novoCargo.trim().toUpperCase().replace(/\s+/g, '_');
        if (configuracoes.permissoes_roles[roleName]) return;

        const novasPermissoes = { ...configuracoes.permissoes_roles };
        novasPermissoes[roleName] = {};
        
        Object.values(permissoesAgrupadas.groups).forEach(grupo => {
            grupo.permissoes.forEach(p => {
                novasPermissoes[roleName][p] = false;
            });
        });

        setSalvando('cargos');
        await atualizarConfiguracao('permissoes_roles' as any, novasPermissoes);
        setNovoCargo('');
        setSalvando(null);
    };

    const handleRemoveCargo = async (role: string) => {
        if (!configuracoes || role === 'ADMIN') return;
        const novasPermissoes = { ...configuracoes.permissoes_roles };
        delete novasPermissoes[role];
        
        setSalvando('cargos');
        await atualizarConfiguracao('permissoes_roles' as any, novasPermissoes);
        setSalvando(null);
    };

    const handleTogglePermissao = async (role: string, permissao: string, atual: boolean) => {
        if (!configuracoes) return;
        const novasPermissoes = { ...configuracoes.permissoes_roles };
        novasPermissoes[role] = { ...novasPermissoes[role], [permissao]: !atual };
        await atualizarConfiguracao('permissoes_roles' as any, novasPermissoes);
    };

    const handleQuickCriarGrupo = async () => {
        if (!novoGrupoNome.trim()) return;
        try {
            setSalvando('grupos');
            await criarGrupo({ 
                nome: novoGrupoNome.trim(), 
                descricao: 'Criado via configurações rápidas'
            });
            setNovoGrupoNome('');
        } finally {
            setSalvando(null);
        }
    };

    const handleUpdateGrupoLider = async (grupoId: string, campo: 'lider_id' | 'sub_lider_id', valor: string) => {
        const grupo = grupos.find(g => g.id === grupoId);
        if (!grupo) return;
        
        try {
            setSalvando(`grupo-${grupoId}`);
            await editarGrupo(grupoId, {
                nome: grupo.nome,
                descricao: grupo.descricao || '',
                lider_id: grupo.lider_id || undefined,
                sub_lider_id: grupo.sub_lider_id || undefined,
                [campo]: valor === 'none' ? null : valor
            });
        } finally {
            setSalvando(null);
        }
    };

    const handleQuickCriarEquipe = async () => {
        if (!novaEquipeNome.trim() || !grupoAlvo) return;
        try {
            setSalvando('equipes');
            await criarEquipe({ 
                nome: novaEquipeNome.trim(), 
                descricao: 'Criada via configurações rápidas',
                grupo_id: grupoAlvo
            });
            setNovaEquipeNome('');
        } finally {
            setSalvando(null);
        }
    };

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">
            <CabecalhoFuncionalidade
                titulo="Configurações Globais"
                subtitulo="Gerencie cargos, estrutura organizacional e permissões do sistema."
                icone={Settings}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Coluna da Esquerda: Gestão de Categorias */}
                <div className="space-y-6 lg:col-span-1">
                    {/* 1. Gestão de Cargos */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all">
                        <div className="p-5 border-b border-border flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">Cargos</h2>
                                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Hierarquia & Papéis</span>
                            </div>
                        </div>
                        <div className="p-5 space-y-6">
                            <div className="flex flex-wrap gap-2">
                                {permissoesAgrupadas.roles.map(role => {
                                    const info = formatarRole(role);
                                    return (
                                        <div key={role} className="group flex items-center gap-2 px-2.5 py-1.5 bg-muted/30 border border-border/50 rounded-xl hover:border-indigo-500/30 transition-all cursor-default text-[11px] font-bold text-foreground/70">
                                            <info.icone size={12} className={info.cor} />
                                            <span>{info.label}</span>
                                            {role !== 'ADMIN' && (
                                                <button onClick={() => handleRemoveCargo(role)} className="ml-1 text-muted-foreground/30 hover:text-red-500 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={novoCargo}
                                    onChange={e => setNovoCargo(e.target.value)}
                                    placeholder="Novo cargo..."
                                    className="flex-1 bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                                <button 
                                    onClick={handleAddCargo}
                                    disabled={salvando === 'cargos' || !novoCargo.trim()}
                                    className="p-2 bg-indigo-500 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-30"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* 2. Gestão de Grupos */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all">
                        <div className="p-5 border-b border-border flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                <LayoutGrid className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">Grupos</h2>
                                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Divisões & Liderança</span>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {grupos.map(grupo => (
                                    <div key={grupo.id} className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">{grupo.nome}</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-lg border border-border/30">
                                                <Crown size={10} className="text-amber-500" />
                                                <select 
                                                    value={grupo.lider_id || 'none'}
                                                    onChange={e => handleUpdateGrupoLider(grupo.id, 'lider_id', e.target.value)}
                                                    className="flex-1 bg-transparent text-[9px] font-bold outline-none cursor-pointer text-muted-foreground"
                                                >
                                                    <option value="none">Líder...</option>
                                                    {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-lg border border-border/30">
                                                <UserCircle size={10} className="text-muted-foreground" />
                                                <select 
                                                    value={grupo.sub_lider_id || 'none'}
                                                    onChange={e => handleUpdateGrupoLider(grupo.id, 'sub_lider_id', e.target.value)}
                                                    className="flex-1 bg-transparent text-[9px] font-bold outline-none cursor-pointer text-muted-foreground"
                                                >
                                                    <option value="none">Sub-Líder...</option>
                                                    {membros.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    value={novoGrupoNome}
                                    onChange={e => setNovoGrupoNome(e.target.value)}
                                    placeholder="Novo grupo..."
                                    className="flex-1 bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-amber-500/20 transition-all"
                                />
                                <button onClick={handleQuickCriarGrupo} disabled={salvando === 'grupos' || !novoGrupoNome.trim()} className="p-2 bg-amber-500 text-white rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-30">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* 3. Gestão de Equipes */}
                    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all">
                        <div className="p-5 border-b border-border flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">Equipes</h2>
                                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">Sprints & Squads</span>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1">
                                {grupos.map(grupo => {
                                    const equipesDoGrupo = equipes.filter(e => e.grupo_id === grupo.id);
                                    return (
                                        <div key={grupo.id} className="space-y-1.5">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.2em] px-1">{grupo.nome}</span>
                                            <div className="grid gap-1 pl-1">
                                                {equipesDoGrupo.length > 0 ? equipesDoGrupo.map(e => (
                                                    <div key={e.id} className="flex items-center justify-between px-3 py-1.5 bg-muted/10 rounded-lg border border-border/30 text-[10px] font-bold text-muted-foreground">
                                                        <span>{e.nome}</span>
                                                        <ChevronRight size={10} className="opacity-20" />
                                                    </div>
                                                )) : (
                                                    <span className="text-[8px] italic text-muted-foreground/30 px-2">Nenhuma equipe</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <select value={grupoAlvo} onChange={e => setGrupoAlvo(e.target.value)} className="w-[85px] bg-muted/20 border border-border rounded-xl px-2 text-[10px] font-bold outline-none text-muted-foreground">
                                        {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                                    </select>
                                    <input value={novaEquipeNome} onChange={e => setNovaEquipeNome(e.target.value)} placeholder="Nova equipe..." className="flex-1 bg-muted/20 border border-border rounded-xl px-3 py-2 text-xs outline-none" />
                                </div>
                                <button onClick={handleQuickCriarEquipe} disabled={!novaEquipeNome.trim() || !grupoAlvo} className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Adicionar</button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Coluna da Direita: Matriz de Permissões */}
                <div className="lg:col-span-3">
                    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-200px)]">
                        <div className="p-6 border-b border-border flex items-center gap-4 shrink-0">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">Matriz de Permissões</h2>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 opacity-60">Controle granular de acesso por papel</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-20 bg-card border-b border-border shadow-sm">
                                    <tr>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 bg-muted/5 min-w-[240px]">Recurso do Sistema</th>
                                        {permissoesAgrupadas.roles.map(role => {
                                            const info = formatarRole(role);
                                            return (
                                                <th key={role} className="p-5 text-center min-w-[100px] border-l border-border/30">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <info.icone size={14} className={info.cor} />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-foreground/70">{info.label}</span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {Object.values(permissoesAgrupadas.groups).map(grupo => (
                                        <Fragment key={grupo.id}>
                                            <tr className="bg-muted/10">
                                                <td colSpan={permissoesAgrupadas.roles.length + 1} className="p-3 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <grupo.icone size={12} className="text-purple-500/60" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">{grupo.titulo}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {grupo.permissoes.map(permissao => (
                                                <tr key={permissao} className="hover:bg-accent/5 transition-colors group">
                                                    <td className="p-4 pl-10 text-[11px] font-medium text-foreground/70 capitalize border-r border-border/30">
                                                        {permissao.replace(/_/g, ' ')}
                                                    </td>
                                                    {permissoesAgrupadas.roles.map(role => {
                                                        const tem = (configuracoes as any).permissoes_roles[role]?.[permissao];
                                                        return (
                                                            <td key={role + permissao} className="p-4 text-center border-l border-border/30">
                                                                <button 
                                                                    onClick={() => handleTogglePermissao(role, permissao, !!tem)}
                                                                    disabled={role === 'ADMIN'}
                                                                    className={`w-5 h-5 rounded-md flex items-center justify-center mx-auto transition-all ${tem ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/40 text-muted-foreground/10 hover:text-muted-foreground/30'}`}
                                                                >
                                                                    {tem ? <ShieldCheck size={12} strokeWidth={2.5} /> : <X size={10} />}
                                                                </button>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
