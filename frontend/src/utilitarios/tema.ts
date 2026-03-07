/**
 * Lê do localStorage e aplica a classe 'dark' no <html> para gerenciar
 * renderização inicial (pode ser chamado do main.tsx para prevenção de flash of unstyled content)
 */
export function aplicarTemaSalvo(): void {
    const isDark = localStorage.getItem('tema_escuro') === 'true'; // Padrão agora é claro

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Alterna modo escuro/claro e salva escolha do usuário, aplicando a classe CSS.
 */
export function alternarTema(): boolean {
    const hasDark = document.documentElement.classList.contains('dark');

    if (hasDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tema_escuro', 'false');
        return false; // Agora está no modo claro
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tema_escuro', 'true');
        return true; // Agora está no modo escuro
    }
}
