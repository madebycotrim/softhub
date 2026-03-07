type VarianteEmblema = 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'roxo' | 'cinza' | 'alerta';

interface EmblemaProps {
    texto: string;
    variante?: VarianteEmblema;
    className?: string; // Para sobrescrever tamanhos ou margens customizadas contextualmente
}

/**
 * Badge colorido reutilizável para indicar status, prioridades, papéis, etc.
 */
export function Emblema({ texto, variante = 'cinza', className = '' }: EmblemaProps) {

    const estilos: Record<VarianteEmblema, string> = {
        azul: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        verde: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        vermelho: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        amarelo: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        roxo: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        cinza: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        alerta: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };

    const padroes = 'inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-medium border';
    const estiloAtivo = estilos[variante];

    return (
        <span className={`${padroes} ${estiloAtivo} ${className}`}>
            {texto}
        </span>
    );
}
