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
    temaPadrao = "dark",
}: ProvedorTemaProps) {
    const [tema, setTemaState] = useState<Tema>(() => {
        return (localStorage.getItem(ChaveTemaStorage) as Tema) || temaPadrao;
    });

    const [temaReal, setTemaReal] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Determina o tema real (considerando 'system')
        const sistemaDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const modo = tema === "system" ? (sistemaDark ? "dark" : "light") : tema;
        
        root.classList.remove("light", "dark");
        root.classList.add(modo);
        setTemaReal(modo as "dark" | "light");
        
        localStorage.setItem(ChaveTemaStorage, tema);
    }, [tema]);

    const setTema = (novoTema: Tema) => {
        setTemaState(novoTema);
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
