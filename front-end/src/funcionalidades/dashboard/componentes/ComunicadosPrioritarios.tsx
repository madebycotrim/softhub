import { memo } from 'react';
import { Megaphone } from 'lucide-react';
import { formatarDataHora } from '@/utilitarios/formatadores';
import { Avatar } from '@/compartilhado/componentes/Avatar';

interface ComunicadosProps {
    avisos: any[];
}

export const ComunicadosPrioritarios = memo(({ avisos }: ComunicadosProps) => {
    const avisosFiltrados = avisos.filter(a => a.prioridade === 'urgente' || a.prioridade === 'importante').slice(0, 2);

    if (avisosFiltrados.length === 0) return null;

    return (
        <section className="space-y-4 animar-entrada atraso-1">
            <div className="flex items-center gap-2 px-1">
                <Megaphone className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Comunicados Prioritários</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {avisosFiltrados.map(aviso => (
                    <div key={aviso.id} className="relative group overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-lg transition-all hover:border-primary/30">
                        <div className={`absolute top-0 left-0 w-1 h-full ${aviso.prioridade === 'urgente' ? 'bg-destructive' : 'bg-primary'}`} />
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-2xl ${aviso.prioridade === 'urgente' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                        {aviso.prioridade}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium opacity-60">
                                        {formatarDataHora(aviso.criado_em)}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary leading-tight">
                                    {aviso.titulo}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed opacity-80">
                                    {aviso.conteudo}
                                </p>
                            </div>
                            <div className="shrink-0">
                                <Avatar 
                                    nome={aviso.criado_por.nome} 
                                    fotoPerfil={aviso.criado_por.foto || null} 
                                    tamanho="md" 
                                />
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
});
