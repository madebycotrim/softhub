/**
 * Utilitários para feedback háptico e micro-interações sonoras.
 * Proporciona uma experiência de "app nativo" no PWA.
 */

/**
 * Vibra o dispositivo por um curto período.
 * @param duracao Milissegundos (padrão 50ms para feedback sutil)
 */
export const vibrar = (duracao = 50) => {
    if ('vibrate' in navigator) {
        navigator.vibrate(duracao);
    }
};

/**
 * Padrão de vibração para erro (curto, curto, longo)
 */
export const vibrarErro = () => {
    if ('vibrate' in navigator) {
        navigator.vibrate([40, 30, 40, 30, 100]);
    }
};

/**
 * Som sutil de "click" para botões e interações.
 */
export const somClick = () => {
    try {
        const audio = new Audio('/sons/click.mp3');
        audio.volume = 0.2;
        audio.play().catch(() => { /* Abafa erros de política de auto-play */ });
    } catch (e) {
        console.warn('[Haptics] Erro ao tocar som:', e);
    }
};

/**
 * Som de sucesso/confirmação.
 */
export const somSucesso = () => {
    try {
        const audio = new Audio('/sons/sucesso.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => { /* Abafa erros de política de auto-play */ });
    } catch (e) {
        console.warn('[Haptics] Erro ao tocar som:', e);
    }
};
