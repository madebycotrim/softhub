import { Search, X } from 'lucide-react';

interface BarraBuscaProps {
    valor: string;
    aoMudar: (valor: string) => void;
    placeholder?: string;
    className?: string;
}

export function BarraBusca({ valor, aoMudar, placeholder = "Pesquisar...", className = "" }: BarraBuscaProps) {
    return (
        <div className={`relative group ${className}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
                type="text"
                placeholder={placeholder}
                value={valor}
                onChange={e => aoMudar(e.target.value)}
                className="w-full bg-muted/40 border border-border/50 rounded-2xl pl-11 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-sm"
            />
            {valor && (
                <button
                    onClick={() => aoMudar('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Limpar busca"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
