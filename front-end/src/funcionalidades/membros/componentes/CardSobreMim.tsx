import { ShieldCheck, MapPin, Mail, Calendar } from 'lucide-react';
import { formatarDataHora } from '../../../utilitarios/formatadores';
import { Emblema } from '../../../compartilhado/componentes/Emblema';

interface CardSobreMimProps {
    membro: any;
}

export function CardSobreMim({ membro }: CardSobreMimProps) {
    return (
        <div>
            <h2 className="text-lg font-bold text-card-foreground mb-4">Sobre mim</h2>
            {membro.bio ? (
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {membro.bio}
                </p>
            ) : (
                <p className="text-muted-foreground italic">Nenhuma biografia informada.</p>
            )}

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {membro.email && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-2xl bg-muted/50 border border-border">
                        <Mail className="w-5 h-5 text-primary" />
                        <a href={`mailto:${membro.email}`} className="hover:text-primary transition-colors truncate">{membro.email}</a>
                    </div>
                )}
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-2xl bg-muted/50 border border-border">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <span>
                        Entrou em {membro.criado_em
                            ? formatarDataHora(membro.criado_em).split(' às')[0]
                            : 'data desconhecida'}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-2xl bg-muted/50 border border-border">
                    <ShieldCheck className="w-5 h-5 text-purple-500" />
                    <div className="flex items-center gap-2">
                        <span>Status:</span>
                        {membro.ativo
                            ? <Emblema texto="Ativo" variante="verde" />
                            : <Emblema texto="Inativo" variante="vermelho" />
                        }
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-2xl bg-muted/50 border border-border">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    <span>Local: UNIEURO</span>
                </div>
            </div>
        </div>
    );
}
