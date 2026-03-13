import { memo, useState } from 'react';
import { 
    CheckCircle2, 
    Clock, 
    Trophy, 
    Target,
    ArrowUpRight,
    Briefcase,
    User
} from 'lucide-react';
import { usarPerfil } from '@/funcionalidades/perfil/hooks/usarPerfil';
import { Skeleton } from '@/compartilhado/componentes/Skeleton';
import { ModalEdicaoPerfil } from '@/funcionalidades/perfil/componentes/ModalEdicaoPerfil';

/**
 * Componente de resumo pessoal para o Dashboard.
 * Exibe métricas individuais do usuário, independente do projeto selecionado.
 * Agora integrado com Modal de Ajustes de Perfil.
 */
export const ResumoPessoalDashboard = memo(() => {
    const { perfil, stats, carregando } = usarPerfil();
    const [modalAberto, setModalAberto] = useState(false);

    if (carregando) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-muted/20 rounded-3xl border border-border/40" />
                ))}
            </div>
        );
    }

    if (!perfil) return null;

    return (
        <div className="space-y-6">
            {/* Saudação Personalizada + Ações */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight">
                        Olá, <span className="text-primary">{perfil.nome.split(' ')[0]}</span>! 👋
                    </h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Seu desempenho na Fábrica de Software está <span className="text-primary font-bold">{stats?.tarefas.aproveitamento || 0}%</span> acima da média.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setModalAberto(true)}
                        className="group flex items-center gap-2 px-5 py-2.5 bg-card/40 hover:bg-card border border-border/40 rounded-2xl transition-all active:scale-95 shadow-sm"
                    >
                        <User className="w-4 h-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">Ver Perfil</span>
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            {perfil.equipe_nome || 'Sem Equipe'} • {perfil.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal de Perfil Unificado */}
            <ModalEdicaoPerfil aberto={modalAberto} aoFechar={() => setModalAberto(false)} />

            {/* Grid de Métricas Pessoais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card: Tarefas Concluídas */}
                <div className="group bg-card hover:bg-muted/30 border border-border/60 p-5 rounded-[32px] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={64} className="text-primary" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entregas</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-foreground">{stats?.tarefas.concluidas || 0}</div>
                            <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold mt-1 uppercase">
                                <ArrowUpRight className="w-3 h-3" /> Tarefas Finalizadas
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card: Aproveitamento */}
                <div className="group bg-card hover:bg-muted/30 border border-border/60 p-5 rounded-[32px] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Trophy size={64} className="text-amber-500" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eficiência</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-foreground">{stats?.tarefas.aproveitamento || 0}%</div>
                            <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats?.tarefas.aproveitamento || 0}%` }}
                                />
                            </div>
                            <div className="text-[9px] text-muted-foreground font-bold mt-2 uppercase">Meta: 80%</div>
                        </div>
                    </div>
                </div>

                {/* Card: Frequência (Ponto) */}
                <div className="group bg-card hover:bg-muted/30 border border-border/60 p-5 rounded-[32px] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock size={64} className="text-blue-500" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Presença</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-foreground">{stats?.ponto.batidasMes || 0}</div>
                            <div className="w-full h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min(((stats?.ponto.batidasMes || 0) / 22) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="text-[9px] text-muted-foreground font-bold mt-2 uppercase">Dias úteis: 22</div>
                        </div>
                    </div>
                </div>

                {/* Card: Estimativa de Horas */}
                <div className="group bg-card hover:bg-muted/30 border border-border/60 p-5 rounded-[32px] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Target size={64} className="text-indigo-500" />
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <Target className="w-5 h-5 text-indigo-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tempo</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-foreground">~{stats?.ponto.estimativaHoras || 0}h</div>
                            <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold mt-1 uppercase">
                                <Clock className="w-3 h-3" /> Produtividade Estimada
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
