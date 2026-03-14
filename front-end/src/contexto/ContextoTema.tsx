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
    temaPadrao = "light",
}: ProvedorTemaProps) {
    const [tema, setTemaState] = useState<Tema>("light");


    const [temaReal, setTemaReal] = useState<"dark" | "light">("light");

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add("light");
        setTemaReal("light");
        localStorage.setItem(ChaveTemaStorage, "light");
    }, []);

    const setTema = (novoTema: Tema) => {
        // Ignorar solicitações de mudança de tema para manter sempre claro
        console.log("Modo Claro forçado pelo sistema.");
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
