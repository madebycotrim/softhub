import { memo, useState } from 'react';
import { 
    CheckCircle2, 
    AlertCircle, 
    Clock,
    Target,
    Zap,
    User,
    Briefcase
} from 'lucide-react';
import { ModalEdicaoPerfil } from '@/funcionalidades/perfil/componentes/ModalEdicaoPerfil';
import { usarPerfil } from '@/funcionalidades/perfil/hooks/usarPerfil';

interface CabecalhoDashboardProps {
    nomeUsuario: string;
    projetosAtivos: string[];
    metricas: {
        totalTarefas: number;
        tarefasConcluidas: number;
        tarefasAtrasadas: number;
        horasRegistradasHoje: number;
        progressoGeral: number;
    } | null;
}

/**
 * Cabeçalho de destaque do Dashboard com saudação e métricas rápidas.
 * Integração total com perfil e métricas em tempo real (Visão Global).
 */
export const CabecalhoDashboard = memo(({ nomeUsuario, projetosAtivos, metricas }: CabecalhoDashboardProps) => {
    const { perfil } = usarPerfil();
    const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
    const primeiroNome = nomeUsuario?.split(' ')[0] || 'Desenvolvedor';
    const ehGlobal = projetosAtivos.length > 1 || projetosAtivos.length === 0;

    return (
        <div className="space-y-8 mb-12">
            {/* Saudação e Ações Rápidas */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground sm:text-6xl drop-shadow-sm">
                            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-400">{primeiroNome}</span>! 👋
                        </h1>
                        {ehGlobal && (
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full animate-pulse">
                                <Zap className="w-3 h-3 text-primary fill-primary" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Global</span>
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground font-medium text-sm sm:text-base max-w-2xl">
                        {ehGlobal 
                            ? "Acompanhando a operação consolidada de todos os seus projetos ativos."
                            : `Status atual da operação no projeto ${projetosAtivos[0] || 'selecionado'}.`
                        }
                    </p>
                    
                    {/* Lista de Projetos Monitorados */}
                    {projetosAtivos.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mr-1">Monitorando:</span>
                            {projetosAtivos.map(p => (
                                <div key={p} className="px-3 py-1 bg-muted/30 border border-border/40 rounded-xl text-[10px] font-bold text-muted-foreground">
                                    {p}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setModalPerfilAberto(true)}
                        className="group flex items-center gap-2.5 px-6 py-3 bg-card/40 hover:bg-card border border-border/40 rounded-3xl transition-all active:scale-95 shadow-sm hover:shadow-md"
                    >
                        <User className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80">Configurações de Perfil</span>
                    </button>

                    <div className="flex items-center gap-2.5 px-5 py-3 bg-primary/5 border border-primary/10 rounded-3xl backdrop-blur-sm">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">
                                {perfil?.equipe_nome || 'S/ Equipe'}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                                {perfil?.role || 'Membro'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Perfil Unificado */}
            <ModalEdicaoPerfil aberto={modalPerfilAberto} aoFechar={() => setModalPerfilAberto(false)} />

            {/* Grid de Performance Operacional (Vision System Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Ativas */}
                <div className="group relative bg-card hover:bg-card/80 dark:bg-[#0f172a] dark:hover:bg-[#1e293b] border border-blue-500/10 hover:border-blue-500/30 p-6 rounded-[32px] transition-all duration-500 shadow-xl shadow-blue-500/5 overflow-hidden active:scale-95">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700" />
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/10 dark:border-blue-500/20 shadow-inner">
                                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Hub de Demandas</span>
                        </div>
                        <div className="text-5xl font-black text-foreground tracking-tighter">{metricas?.totalTarefas || 0}</div>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-50">Volume Ativo em {projetosAtivos.length} projetos</p>
                    </div>
                </div>

                {/* Entregues */}
                <div className="group relative bg-card hover:bg-card/80 dark:bg-[#0f172a] dark:hover:bg-[#1e293b] border border-emerald-500/10 hover:border-emerald-500/30 p-6 rounded-[32px] transition-all duration-500 shadow-xl shadow-emerald-500/5 overflow-hidden active:scale-95">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/10 dark:border-emerald-500/20 shadow-inner">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Entregues</span>
                        </div>
                        <div className="text-5xl font-black text-foreground tracking-tighter">{metricas?.tarefasConcluidas || 0}</div>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest">Sucesso Metodológico</p>
                    </div>
                </div>

                {/* Críticas */}
                <div className="group relative bg-card hover:bg-card/80 dark:bg-[#0f172a] dark:hover:bg-[#1e293b] border border-rose-500/10 hover:border-rose-500/30 p-6 rounded-[32px] transition-all duration-500 shadow-xl shadow-rose-500/5 overflow-hidden active:scale-95">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700" />
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center border border-rose-500/10 dark:border-rose-500/20 shadow-inner">
                                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Fogo Cruzado</span>
                        </div>
                        <div className="text-5xl font-black text-foreground tracking-tighter">{metricas?.tarefasAtrasadas || 0}</div>
                        <p className="text-[9px] text-rose-600 dark:text-rose-500 font-black uppercase tracking-widest">Urgência Crítica</p>
                    </div>
                </div>

                {/* Eficiência / Progresso */}
                <div className="group relative bg-card hover:bg-card/80 dark:bg-[#0f172a] dark:hover:bg-[#1e293b] border border-primary/20 hover:border-primary/40 p-6 rounded-[32px] transition-all duration-500 shadow-xl shadow-primary/5 overflow-hidden active:scale-95">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/30 flex items-center justify-center border border-primary/20 shadow-inner">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Aproveitamento</span>
                        </div>
                        <div>
                            <div className="text-5xl font-black text-primary tracking-tighter">{metricas?.progressoGeral || 0}%</div>
                            <div className="w-full h-1.5 bg-primary/10 rounded-full mt-3 overflow-hidden border border-primary/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${metricas?.progressoGeral || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
});


