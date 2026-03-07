import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Tema = "dark" | "light" | "system";

type ContextoTemaTipo = {
    tema: Tema;
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
    temaPadrao = "system",
}: ProvedorTemaProps) {
    const [tema, setTemaState] = useState<Tema>(
        () => (localStorage.getItem(ChaveTemaStorage) as Tema) || temaPadrao
    );

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        if (tema === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";

            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(tema);
    }, [tema]);

    const setTema = (novoTema: Tema) => {
        localStorage.setItem(ChaveTemaStorage, novoTema);
        setTemaState(novoTema);
    };

    return (
        <ContextoTema.Provider value={{ tema, setTema }}>
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
