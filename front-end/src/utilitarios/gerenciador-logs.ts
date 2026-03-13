
/**
 * Gerenciador de Logs Centralizado do SoftHub.
 * Garante que logs técnicos sejam exibidos apenas para Administradores.
 */

const CHAVE_USUARIO = 'softhub_usuario';

function podeVerLogs(): boolean {
    // Em ambiente de desenvolvimento (localhost), sempre mostra logs
    if (import.meta.env.DEV) return true;

    try {
        const usuarioJson = localStorage.getItem(CHAVE_USUARIO);
        if (!usuarioJson) return false;
        const usuario = JSON.parse(usuarioJson);
        return usuario.role === 'ADMIN';
    } catch {
        return false;
    }
}

const ESTILO_MODULO = 'font-weight: bold; padding: 2px 5px; border-radius: 4px;';

export const logger = {
    info: (modulo: string, mensagem: string, ...extras: any[]) => {
        if (!podeVerLogs()) return;
        console.log(
            `%c${modulo.toUpperCase()}%c ${mensagem}`,
            `background: #3b82f6; color: white; ${ESTILO_MODULO}`,
            'color: inherit;',
            ...extras
        );
    },

    sucesso: (modulo: string, mensagem: string, ...extras: any[]) => {
        if (!podeVerLogs()) return;
        console.log(
            `%c${modulo.toUpperCase()}%c ✅ ${mensagem}`,
            `background: #22c55e; color: white; ${ESTILO_MODULO}`,
            'color: #22c55e; font-weight: bold;',
            ...extras
        );
    },

    aviso: (modulo: string, mensagem: string, ...extras: any[]) => {
        if (!podeVerLogs()) return;
        console.warn(
            `%c${modulo.toUpperCase()}%c ⚠️ ${mensagem}`,
            `background: #eab308; color: black; ${ESTILO_MODULO}`,
            'color: #eab308; font-weight: bold;',
            ...extras
        );
    },

    erro: (modulo: string, mensagem: string, ...extras: any[]) => {
        if (!podeVerLogs()) return;
        console.error(
            `%c${modulo.toUpperCase()}%c ❌ ${mensagem}`,
            `background: #ef4444; color: white; ${ESTILO_MODULO}`,
            'color: #ef4444; font-weight: bold;',
            ...extras
        );
    }
};
