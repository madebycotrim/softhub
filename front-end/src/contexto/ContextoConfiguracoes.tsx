import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/compartilhado/servicos/api';

export interface IConfiguracoes {
    hierarquia_roles: string[];
    permissoes_roles: Record<string, Record<string, boolean>>;
}

// Define uma configuração inicial vazia, sem valores hardcoded.
const configInicialVazia: IConfiguracoes = {
    hierarquia_roles: [],
    permissoes_roles: {},
};

// O contexto é inicializado com a configuração vazia.
const ContextoConfiguracoes = createContext<IConfiguracoes>(configInicialVazia);

export const ProvedorConfiguracoes = ({ children }: { children: ReactNode }) => {
    const [configuracoes, setConfiguracoes] = useState<IConfiguracoes>(configInicialVazia);
    // Adiciona um estado de carregamento para evitar renderizações com dados vazios.
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            setCarregando(true);
            try {
                const { data } = await api.get('/api/configuracoes/publico');
                // Atualiza com os dados da API ou mantém vazio se a API não retornar nada.
                setConfiguracoes({
                    hierarquia_roles: data.hierarquia_roles || [],
                    permissoes_roles: data.permissoes_roles || {},
                });
            } catch (error) {
                console.error("Falha grave ao carregar configurações do sistema. Usando configuração vazia.", error);
                // Em caso de falha, mantém a configuração vazia.
                setConfiguracoes(configInicialVazia);
            } finally {
                setCarregando(false);
            }
        };

        fetchConfig();
    }, []);
    
    // Previne a renderização do aplicativo até que as configurações sejam carregadas.
    // Em um aplicativo real, isso poderia ser um componente de spinner global.
    if (carregando) {
        return null;
    }

    return (
        <ContextoConfiguracoes.Provider value={configuracoes}>
            {children}
        </ContextoConfiguracoes.Provider>
    );
};

export const usarConfiguracoes = () => useContext(ContextoConfiguracoes);