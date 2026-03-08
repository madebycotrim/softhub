import type { Sprint } from './usarBacklog';
import { formatarDataHora } from '../../utilitarios/formatadores';
import { Play, CheckCircle2, CircleDashed, FileText } from 'lucide-react';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import { usarPermissao } from '../../compartilhado/hooks/usarPermissao';

interface PainelSprintsProps {
    sprints: Sprint[];
    aoEncerrar?: (id: string) => void;
    aoEditarRetrospectiva?: (sprint: Sprint) => void;
}

/**
 * Exibe a sprint ativa e o histórico das encerradas.
 */
export function PainelSprints({ sprints, aoEncerrar, aoEditarRetrospectiva }: PainelSprintsProps) {
    const podeEditarRetroSprints = usarPermissao('LIDER_GRUPO'); // Somente Lider de Grupo+ 

    const ativa = sprints.find(s => s.status === 'ativa');
    const historico = sprints.filter(s => s.status === 'encerrada').sort((a, b) =>
        new Date(b.data_inicio!).getTime() - new Date(a.data_inicio!).getTime()
    );

    return (
        <div className="space-y-8 flex-1 min-w-0">

            {/* Sprint Atual */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground tracking-tight">
                        Sprint Ativa
                    </h2>
                    {ativa && aoEncerrar && podeEditarRetroSprints && (
                        <button
                            onClick={() => aoEncerrar(ativa.id)}
                            className="text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Encerrar Sprint
                        </button>
                    )}
                </div>

                {ativa ? (
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Play className="w-24 h-24 text-primary" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-primary">{ativa.nome}</h3>
                                <Emblema texto="Em Andamento" variante="azul" />
                            </div>
                            <p className="text-foreground mb-6 max-w-lg">{ativa.objetivo || 'Sem objetivo principal definido.'}</p>

                            <div className="flex items-center gap-6 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">Iniciada em</p>
                                    <p className="font-medium text-foreground">{formatarDataHora(ativa.data_inicio!)}</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div>
                                    <p className="text-muted-foreground mb-1">Velocity Planejado</p>
                                    <p className="font-medium text-foreground">{ativa.velocity_planejado || 0} pts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center border-2 border-dashed border-border rounded-2xl bg-muted/50">
                        <CircleDashed className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-foreground font-medium">Nenhuma sprint ativa.</p>
                        <p className="text-muted-foreground text-sm mt-1">Planeje e inicie uma sprint para focar o trabalho da equipe.</p>
                    </div>
                )}
            </section>

            {/* Histórico Recente */}
            {historico.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">
                        Histórico Recente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {historico.slice(0, 4).map(sprint => (
                            <div key={sprint.id} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-medium text-card-foreground">{sprint.nome}</h4>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {sprint.data_fim ? formatarDataHora(sprint.data_fim).split(' às')[0] : ''}
                                    </span>
                                    <span className="font-medium px-2 py-1 bg-accent rounded-md text-foreground">
                                        Entregou: <span className="text-emerald-500">{sprint.velocity_realizado || 0} pts</span>
                                    </span>
                                </div>

                                {/* Seção da Retrospectiva */}
                                <div className="mt-4 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            Retrospectiva
                                        </h5>
                                        {aoEditarRetrospectiva && podeEditarRetroSprints && (
                                            <button
                                                onClick={() => aoEditarRetrospectiva(sprint)}
                                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                            >
                                                Editar Retrospectiva
                                            </button>
                                        )}
                                    </div>

                                    {!sprint.retrospectiva ? (
                                        <p className="text-sm text-muted-foreground italic">Retrospectiva não preenchida ainda.</p>
                                    ) : (
                                        <div className="space-y-3 mt-3 ml-2 border-l-2 border-border pl-3">
                                            {sprint.retrospectiva.o_que_foi_bem && (
                                                <div>
                                                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">O que foi bem</p>
                                                    <p className="text-sm text-foreground">{sprint.retrospectiva.o_que_foi_bem}</p>
                                                </div>
                                            )}
                                            {sprint.retrospectiva.o_que_melhorar && (
                                                <div>
                                                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">O que melhorar</p>
                                                    <p className="text-sm text-foreground">{sprint.retrospectiva.o_que_melhorar}</p>
                                                </div>
                                            )}
                                            {sprint.retrospectiva.acoes_proxima_sprint && (
                                                <div>
                                                    <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Ações Livres</p>
                                                    <p className="text-sm text-foreground">{sprint.retrospectiva.acoes_proxima_sprint}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
}
