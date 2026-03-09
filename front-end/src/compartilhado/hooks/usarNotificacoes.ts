import { useEffect, useState } from 'react';
// import { usarAutenticacao } from '../../funcionalidades/autenticacao/usarAutenticacao';

export interface Notificacao {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'tarefa' | 'ponto' | 'aviso' | 'sistema';
    link?: string;
    lida: boolean;
    criado_em: string;
}

/**
 * Faz polling de notificações não lidas a cada 30 segundos.
 */
export function usarNotificacoes() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    // Não armazena estado de erro explícito para não poluir UI global caso
    // ocorra falha momentânea de rede no polling

    // TODO: Recuperar usuario logado
    // const { estaAutenticado } = usarAutenticacao();
    const estaAutenticado = true;

    useEffect(() => {
        if (!estaAutenticado) return;

        let mounted = true;

        async function buscar() {
            try {
                setCarregando(true);
                // O Endpoint real buscará apenas notificações `lida = 0` do próprio usuário logado
                // const { data } = await api.get('/notificacoes'); 

                // Mocking dados temporariamente (Etapa 1.5)
                const mock: Notificacao[] = [
                    // { id: '1', titulo: 'Teste', mensagem: 'Mensagem', tipo: 'sistema', lida: false, criado_em: new Date().toISOString() }
                ];

                if (mounted) {
                    setNotificacoes(mock);
                }
            } catch (e) {
                // Falha silenciosa em notificações (Regra 5)
                console.error('Falha temporária ao buscar notificações');
            } finally {
                if (mounted) {
                    setCarregando(false);
                }
            }
        }

        // Busca imediata
        buscar();

        // Configurando Polling (30s)
        const timer = setInterval(buscar, 30 * 1000);

        return () => {
            mounted = false;
            clearInterval(timer);
        };
    }, [estaAutenticado]);

    /**
     * Marca uma ou multiplas notificações como "lida".
     */
    const marcarComoLida = async (id: string) => {
        try {
            // await api.patch(`/notificacoes/${id}/lida`);

            // Update local otimista
            setNotificacoes((prev) => prev.filter((n) => n.id !== id));
        } catch (e) {
            console.error('Falha limpar notificação');
        }
    };

    return { notificacoes, carregando, marcarComoLida };
}
