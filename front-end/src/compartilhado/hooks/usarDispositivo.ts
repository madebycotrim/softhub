import { useState, useEffect } from 'react';

/**
 * Hook para detectar se o dispositivo é mobile baseado no breakpoint 'lg' do Tailwind (1024px).
 * @returns boolean true se for mobile (abaixo de 1024px)
 */
export function usarDispositivo() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        // Verifica inicial
        checkIsMobile();

        // Ouve redimensionamento
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return { isMobile };
}
