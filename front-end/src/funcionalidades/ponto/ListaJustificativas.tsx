import { formatarDataHora } from '../../utilitarios/formatadores';
import { Emblema } from '../../compartilhado/componentes/Emblema';
import type { JustificativaPonto } from './usarJustificativa';
import { EstadoVazio } from '../../compartilhado/componentes/EstadoVazio';

interface ListaJustificativasProps {
    justificativas: JustificativaPonto[];
}

/** Mapeia o tipo técnico para rótulo amigável. */
const formatarTipo = (tipo: string): string => {
    const mapa: Record<string, string> = {
        ausencia: 'Ausência (Atestado/Falta)',
        esquecimento: 'Esquecimento de Batida',
        problema_sistema: 'Falha no Sistema',
    };
    return mapa[tipo] ?? tipo;
};

/**
 * Lista de justificativas do próprio usuário em formato de tabela padronizada.
 * Exibida no painel de ponto eletrônico.
 */
export function ListaJustificativas({ justificativas }: ListaJustificativasProps) {
    if (justificativas.length === 0) {
        return (
            <div className="py-8">
                <EstadoVazio 
                    titulo="Sem justificativas" 
                    descricao="Você ainda não enviou nenhuma justificativa de ponto." 
                    compacto={true}
                />
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                        <th className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Data
                        </th>
                        <th className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Tipo
                        </th>
                        <th className="px-3 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hidden sm:table-cell">
                            Motivo
                        </th>
                        <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {justificativas.map(just => (
                        <tr key={just.id} className="hover:bg-muted/20 transition-colors">
                            {/* Data */}
                            <td className="px-3 py-3 align-top">
                                <p className="text-xs font-bold text-foreground">{just.data}</p>
                                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
                                    {formatarDataHora(just.criado_em)}
                                </p>
                            </td>

                            {/* Tipo */}
                            <td className="px-3 py-3 align-top">
                                <span className="text-[11px] font-bold text-primary/70 uppercase tracking-wide">
                                    {formatarTipo(just.tipo)}
                                </span>
                            </td>

                            {/* Motivo */}
                            <td className="px-3 py-3 align-top hidden sm:table-cell">
                                <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px]">
                                    {just.motivo}
                                </p>
                                {just.status === 'rejeitada' && just.motivo_rejeicao && (
                                    <p className="text-[10px] text-destructive mt-1 font-medium">
                                        Reprovação: {just.motivo_rejeicao}
                                    </p>
                                )}
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3 align-top text-center">
                                {just.status === 'aprovada' && <Emblema texto="Aprovada" variante="verde" />}
                                {just.status === 'rejeitada' && <Emblema texto="Rejeitada" variante="vermelho" />}
                                {just.status === 'pendente' && <Emblema texto="Pendente" variante="amarelo" />}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
