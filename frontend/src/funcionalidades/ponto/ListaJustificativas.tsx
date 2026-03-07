import { formatarDataHora } from '../../utilitarios/formatadores';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import type { JustificativaPonto } from './usarJustificativa';

interface ListaJustificativasProps {
    justificativas: JustificativaPonto[];
}

export function ListaJustificativas({ justificativas }: ListaJustificativasProps) {
    if (justificativas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 bg-card border border-border rounded-2xl shadow-sm">
                <p className="text-muted-foreground text-sm">Você ainda não enviou justificativas.</p>
            </div>
        );
    }

    const formatarTipo = (tipo: string) => {
        const mapa: Record<string, string> = {
            'ausencia': 'Ausência (Atestado/Falta)',
            'esquecimento': 'Esquecimento de Batida',
            'problema_sistema': 'Falha no Sistema'
        };
        return mapa[tipo] || tipo;
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'aprovada': return <Emblema texto="Aprovada" variante="verde" />;
            case 'rejeitada': return <Emblema texto="Rejeitada" variante="vermelho" />;
            default: return <Emblema texto="Pendente" variante="amarelo" />;
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
                {justificativas.map(just => (
                    <div key={just.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-card-foreground tracking-tight">
                                    Referente a: {just.data}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {formatarTipo(just.tipo)}
                                </span>
                            </div>
                            <StatusBadge status={just.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{just.motivo}</p>

                        <div className="mt-4 pt-3 flex items-center justify-between border-t border-border text-xs text-muted-foreground">
                            <span>Enviado em {formatarDataHora(just.criado_em)}</span>
                            {just.status === 'rejeitada' && just.motivo_rejeicao && (
                                <span className="text-destructive font-medium">Motivo: {just.motivo_rejeicao}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}
