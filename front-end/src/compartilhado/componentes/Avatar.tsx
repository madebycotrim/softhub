import { User } from 'lucide-react';

interface AvatarProps {
    nome: string;
    fotoPerfil?: string | null;
    tamanho?: 'sm' | 'md' | 'lg';
}

/**
 * Avatar do usuário. Exibe a foto externa ou as iniciais baseadas no nome.
 */
export function Avatar({ nome, fotoPerfil, tamanho = 'md' }: AvatarProps) {
    // Tamanhos mapeados por pixels
    const medidas = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base'
    };

    const tamanhoAtual = medidas[tamanho];

    // Extrair iniciais (ex: "Mateus Silva" -> "MS")
    const getIniciais = (nomeCompleto: string) => {
        if (!nomeCompleto) return <User className="w-1/2 h-1/2" />;

        const pares = nomeCompleto.split(' ').filter(Boolean);
        if (pares.length === 1) return pares[0].substring(0, 2).toUpperCase();

        return `${pares[0][0]}${pares[pares.length - 1][0]}`.toUpperCase();
    };

    // Cores dinâmicas para avatares sem foto baseadas no tamanho do nome (ajuda a separar visualmente)
    const coresFallback = [
        'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600'
    ];
    const corIndex = nome.length % coresFallback.length;
    const corBg = coresFallback[corIndex];

    if (fotoPerfil && fotoPerfil.trim() !== '') {
        return (
            <div className={`relative rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 ${tamanhoAtual}`}>
                <img
                    src={fotoPerfil}
                    alt={`Foto de ${nome}`}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    // Fallback para Iniciais
    return (
        <div
            className={`relative rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-medium border border-white/5 ${tamanhoAtual} ${corBg}`}
            title={nome}
        >
            <span className="opacity-90 leading-none">{getIniciais(nome)}</span>
        </div>
    );
}
