import { useState, useCallback, useEffect } from 'react';
import { api } from '@/compartilhado/servicos/api';

export interface ConfiguracoesSistema {
    funcoes_tecnicas: string[];
    nome_sistema: string;
    permissoes_roles: Record<string, Record<string, boolean>>;
    dominios_autorizados: string[];
    auto_cadastro: boolean;
}

export function usarConfiguracoes() {
    const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const buscarConfiguracoes = useCallback(async () => {
        setCarregando(true);
        try {
            const res = await api.get('/api/configuracoes');
            const dados = res.data.configuracoes || {};

            if (!Array.isArray(dados.funcoes_tecnicas)) {
                dados.funcoes_tecnicas = [];
            }

            if (!dados.permissoes_roles || typeof dados.permissoes_roles !== 'object') {
                dados.permissoes_roles = {};
            }

            if (!Array.isArray(dados.dominios_autorizados)) {
                dados.dominios_autorizados = ['unieuro.com.br', 'unieuro.edu.br'];
            }

            if (typeof dados.auto_cadastro !== 'boolean') {
                dados.auto_cadastro = false;
            }

            setConfiguracoes(dados);
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

    const renomearCargo = async (antigo: string, novo: string) => {
        try {
            await api.patch(`/api/configuracoes/roles/${antigo}/renomear`, { novo });
            await buscarConfiguracoes();
            return { sucesso: true };
        } catch (e: any) {
            return { sucesso: false, erro: e.response?.data?.erro || 'Erro ao renomear cargo' };
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
        atualizarConfiguracao,
        renomearCargo
    };
}
