import { useState, useMemo } from 'react';
import { usarConfiguracoes } from './usarConfiguracoes';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { 
    Plus, Lock, ShieldCheck, 
    Crown, UserCircle, MessageSquare, Activity,
    Settings2, Info, Trash2
} from 'lucide-react';
import { Modal } from '../../compartilhado/componentes/Modal';

/**
 * Página de Configurações & Governança.
 * Design refinado para alta performance e estética premium.
 */
export function PaginaConfiguracoes() {
    const { configuracoes, carregando, erro, atualizarConfiguracao } = usarConfiguracoes();
    
    const [modalCargos, setModalCargos] = useState(false);
    const [novoCargo, setNovoCargo] = useState('');
    const [salvando, setSalvando] = useState<string | null>(null);

    // Agrupa permissões por módulo para visualização
    const permissoesAgrupadas = useMemo(() => {
        if (!configuracoes?.permissoes_roles) return { modulos: [], roles: [] };

        const roles = Object.keys(configuracoes.permissoes_roles);
        const modulosSet = new Set<string>();

        Object.values(configuracoes.permissoes_roles).forEach(perms => {
            Object.keys(perms).forEach(p => modulosSet.add(p.split(':')[0]));
        });

        return { modulos: Array.from(modulosSet), roles };
    }, [configuracoes]);

    if (carregando) return <Carregando />;
    if (erro) return <div className="p-10 text-center text-red-500 font-bold uppercase tracking-widest">{erro}</div>;

    const handleTogglePermissao = async (role: string, permissao: string) => {
        if (!configuracoes) return;
        const chave = `permissoes_roles.${role}.${permissao}`;
        setSalvando(chave);
        
        try {
            const novasPermissoes = { ...configuracoes.permissoes_roles };
            novasPermissoes[role] = { ...novasPermissoes[role], [permissao]: !novasPermissoes[role][permissao] };
            await atualizarConfiguracao('permissoes_roles', novasPermissoes);
        } finally {
            setSalvando(null);
        }
    };

    const handleAddCargo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoCargo || !configuracoes) return;
        
        const novasPermissoes = { 
            ...configuracoes.permissoes_roles, 
            [novoCargo.toUpperCase()]: { 
                "tarefas:visualizar": true,
                "ponto:registrar": true 
            } 
        };

        const res = await atualizarConfiguracao('permissoes_roles', novasPermissoes);
        if (res.sucesso) {
            setNovoCargo('');
            setModalCargos(false);
        }
    };

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
                {/* Coluna Lateral: Widgets Rápidos */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Widget: Cargos */}
                    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[32px] p-6 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-[13px] font-black uppercase tracking-wider text-foreground">Cargos</h3>
                                    <span className="text-[9px] text-muted-foreground/50 font-black uppercase tracking-[0.1em]">Configurar Hierarquia</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setModalCargos(true)}
                                className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all group-hover:scale-110"
                            >
                                <Plus size={18} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 opacity-60">
                            {permissoesAgrupadas.roles.map(r => (
                                <div key={r} className="p-1 bg-muted/20 border border-border/20 rounded-lg text-[8px] font-bold text-muted-foreground uppercase">
                                    {r.slice(0, 3)}
                                </div>
                            ))}
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

                {/* Coluna Principal: Matriz de Permissões */}
                <div className="lg:col-span-9 space-y-6">
                    <section className="bg-card/40 backdrop-blur-md border border-border/40 rounded-[40px] shadow-sm flex flex-col overflow-hidden">
                        <div className="p-8 border-b border-border/20 flex items-center justify-between bg-muted/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Lock size={20} />
                                </div>
                                <h2 className="text-[14px] font-black uppercase tracking-widest text-foreground">Matriz de Controle de Acesso</h2>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/10">
                                        <th className="sticky left-0 bg-card/80 backdrop-blur-md z-10 px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/20">Funcionalidade / Módulo</th>
                                        {permissoesAgrupadas.roles.map(role => (
                                            <th key={role} className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/20">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={role === 'ADMIN' ? 'text-primary' : 'text-foreground'}>{role}</span>
                                                    {role === 'ADMIN' && <Crown size={10} className="text-amber-500" />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {permissoesAgrupadas.modulos.map(modulo => (
                                        <tr key={modulo} className="group hover:bg-primary/[0.02] transition-colors">
                                            <td className="sticky left-0 bg-card/80 backdrop-blur-md z-10 px-8 py-5 border-r border-border/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                                                        {modulo === 'tarefas' && <Activity size={14} />}
                                                        {modulo === 'ponto' && <Activity size={14} />}
                                                        {modulo === 'membros' && <UserCircle size={14} />}
                                                        {modulo === 'avisos' && <MessageSquare size={14} />}
                                                        {!['tarefas', 'ponto', 'membros', 'avisos'].includes(modulo) && <Settings2 size={14} />}
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground/70">{modulo}</span>
                                                </div>
                                            </td>
                                            {permissoesAgrupadas.roles.map(role => {
                                                const permKey = `${modulo}:visualizar`;
                                                const ativa = configuracoes?.permissoes_roles[role]?.[permKey] ?? false;
                                                const salvandoEste = salvando === `permissoes_roles.${role}.${permKey}`;

                                                return (
                                                    <td key={`${role}-${modulo}`} className="px-6 py-5 text-center">
                                                        <button 
                                                            disabled={role === 'ADMIN' || salvandoEste}
                                                            onClick={() => handleTogglePermissao(role, permKey)}
                                                            className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all border ${
                                                                ativa 
                                                                    ? 'bg-primary text-primary-foreground border-transparent shadow-lg shadow-primary/20 scale-110' 
                                                                    : 'bg-muted/10 border-border/40 text-transparent hover:border-primary/40'
                                                            } ${salvandoEste ? 'animate-pulse' : ''}`}
                                                        >
                                                            {ativa && <ShieldCheck size={12} strokeWidth={3} />}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {/* Modal: Gestão de Cargos */}
            <Modal aberto={modalCargos} aoFechar={() => setModalCargos(false)} titulo="Hierarquia de Cargos">
                <div className="space-y-6 pt-4">
                    <form onSubmit={handleAddCargo} className="flex gap-3">
                        <input 
                            required
                            value={novoCargo}
                            onChange={e => setNovoCargo(e.target.value)}
                            placeholder="NOME DO CARGO (EX: LIDER_TECH)"
                            className="flex-1 bg-muted/20 border border-border/40 rounded-2xl px-5 py-3 text-[12px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                        />
                        <button className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                            Adicionar
                        </button>
                    </form>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-2">Cargos Existentes</label>
                        <div className="grid grid-cols-1 gap-2">
                            {permissoesAgrupadas.roles.map(role => (
                                <div key={role} className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-border/5 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                            <ShieldCheck size={14} />
                                        </div>
                                        <span className="text-[12px] font-black text-foreground/80">{role}</span>
                                    </div>
                                    {role !== 'ADMIN' && (
                                        <button 
                                            onClick={() => handleRemoverCargo(role)}
                                            className="p-2 text-muted-foreground/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
