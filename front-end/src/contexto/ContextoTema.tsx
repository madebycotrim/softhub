import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Tema = "dark" | "light" | "system";

type ContextoTemaTipo = {
    tema: Tema;
    temaReal: "dark" | "light";
    setTema: (tema: Tema) => void;
};

const ChaveTemaStorage = "vite-ui-theme";

const ContextoTema = createContext<ContextoTemaTipo | undefined>(undefined);

interface ProvedorTemaProps {
    children: ReactNode;
    temaPadrao?: Tema;
}

export function ProvedorTema({
    children,
}: ProvedorTemaProps) {
    // Forçamos o tema claro (light) permanentemente enquanto a troca de tema estiver desativada
    const [tema] = useState<Tema>("light");
    const [temaReal] = useState<"dark" | "light">("light");

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove qualquer classe de tema anterior e fixa na light
        root.classList.remove("dark");
        root.classList.add("light");
        
        // Garante que o localStorage reflita o estado forçado
        localStorage.setItem(ChaveTemaStorage, "light");
    }, []);

    const setTema = () => {
        // Função de troca desativada temporariamente
        console.warn("Troca de tema desativada: O sistema está fixado no tema CLARO.");
    };

    return (
        <ContextoTema.Provider value={{ tema, temaReal, setTema }}>
            {children}
        </ContextoTema.Provider>
    );
}

export const usarTema = () => {
    const context = useContext(ContextoTema);

    if (context === undefined)
        throw new Error("usarTema deve ser usado dentro de um ProvedorTema");

    return context;
};
