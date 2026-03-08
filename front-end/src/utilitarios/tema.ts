const ChaveTemaStorage = "vite-ui-theme";

/**
 * Lê do localStorage e aplica a classe 'dark' no <html> para gerenciar
 * renderização inicial (pode ser chamado do main.tsx para prevenção de flash of unstyled content)
 */
export function aplicarTemaSalvo(): void {
    const tema = localStorage.getItem(ChaveTemaStorage) || 'system';

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
}

/**
 * Alterna modo escuro/claro e salva escolha do usuário, aplicando a classe CSS.
 * Nota: Esta função é um fallback, o ideal é usar o setTema do ContextoTema.
 */
export function alternarTema(): string {
    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    const novoTema = isDark ? 'light' : 'dark';

    root.classList.remove('light', 'dark');
    root.classList.add(novoTema);
    localStorage.setItem(ChaveTemaStorage, novoTema);

    return novoTema;
}
