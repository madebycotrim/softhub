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
        azul: 'bg-blue-100 text-blue-700 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.15)]',
        verde: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
        vermelho: 'bg-rose-100 text-rose-700 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)] font-bold',
        amarelo: 'bg-amber-100 text-amber-900 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
        roxo: 'bg-violet-100 text-violet-700 border-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.15)] font-black italic',
        cinza: 'bg-white text-slate-500 border-slate-200',
        alerta: 'bg-orange-100 text-orange-700 border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
    };

    const padroes = 'inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-0.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all';
    const estiloAtivo = estilos[variante];

    return (
        <span className={`${padroes} ${estiloAtivo} ${className}`}>
            {texto}
        </span>
    );
}
