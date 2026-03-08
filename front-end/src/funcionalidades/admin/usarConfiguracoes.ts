import { useState, useCallback, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';

export interface ConfiguracoesSistema {
    funcoes_tecnicas: string[];
    nome_sistema: string;
}

export function usarConfiguracoes() {
    const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const buscarConfiguracoes = useCallback(async () => {
        setCarregando(true);
        try {
            const res = await api.get('/api/configuracoes');
            setConfiguracoes(res.data.configuracoes);
            setErro(null);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar configurações');
        } finally {
            setCarregando(false);
        }
    }, []);

    const atualizarConfiguracao = async (chave: keyof ConfiguracoesSistema, valor: any) => {
        try {
            await api.patch(`/api/configuracoes/${chave}`, { valor });
            await buscarConfiguracoes();
            return { sucesso: true };
        } catch (e: any) {
            return { sucesso: false, erro: e.response?.data?.erro || 'Erro ao atualizar' };
        }
    };

    useEffect(() => {
        buscarConfiguracoes();
    }, [buscarConfiguracoes]);

    return {
        configuracoes,
        carregando,
        erro,
        recarregar: buscarConfiguracoes,
        atualizarConfiguracao
    };
}
