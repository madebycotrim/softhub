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
    temaPadrao = "system",
}: ProvedorTemaProps) {
    const [tema, setTemaState] = useState<Tema>(
        () => (localStorage.getItem(ChaveTemaStorage) as Tema) || temaPadrao
    );

    const [temaReal, setTemaReal] = useState<"dark" | "light">(() => {
        if (tema !== "system") return tema;
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    });

    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove("light", "dark");

        let temaAplicado: "dark" | "light";

        if (tema === "system") {
            temaAplicado = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light";
        } else {
            temaAplicado = tema;
        }

        root.classList.add(temaAplicado);
        setTemaReal(temaAplicado);

        // Listener para mudanças no sistema se estiver em modo system
        if (tema === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = (e: MediaQueryListEvent) => {
                const novoTema = e.matches ? "dark" : "light";
                root.classList.remove("light", "dark");
                root.classList.add(novoTema);
                setTemaReal(novoTema);
            };
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, [tema]);

    const setTema = (novoTema: Tema) => {
        localStorage.setItem(ChaveTemaStorage, novoTema);
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
