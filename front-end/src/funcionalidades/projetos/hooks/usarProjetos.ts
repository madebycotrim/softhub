import { useState, useCallback, useEffect } from 'react';
import { api } from '@/compartilhado/servicos/api';
import { logger } from '@/utilitarios/gerenciador-logs';

export interface ProjetoEquipe {
    equipe_id: string;
    acesso: 'LEITURA' | 'EDICAO' | 'GESTAO';
}

export interface Projeto {
    id: string;
    nome: string;
    descricao: string | null;
    publico: boolean;
    github_repo?: string | null;
    documentacao_url?: string | null;
    figma_url?: string | null;
    setup_url?: string | null;
    total_tarefas?: number;
    equipes?: ProjetoEquipe[];
    criado_em: string;
}

/**
 * Hook para gerenciar projetos.
 * Permite listar, criar, editar e excluir projetos.
 */
export function usarProjetos() {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const buscarProjetos = useCallback(async () => {
        setCarregando(true);
        setErro(null);
        try {
            const res = await api.get('/api/projetos');
            setProjetos(res.data || []);
        } catch (e: any) {
            const msg = e.response?.data?.erro || 'Erro ao carregar projetos';
            setErro(msg);
            logger.erro('Projetos', msg, e);
        } finally {
            setCarregando(false);
        }
    }, []);

    const criarProjeto = async (dados: { nome: string; descricao?: string; publico?: boolean, github_repo?: string }) => {
        setCarregando(true);
        try {
            const res = await api.post('/api/projetos', dados);
            await buscarProjetos();
            logger.sucesso('Projetos', `Projeto "${dados.nome}" criado com sucesso`);
            window.dispatchEvent(new Event('projetos_atualizados'));
            return res.data;
        } catch (e: any) {
            const msg = e.response?.data?.erro || 'Erro ao criar projeto';
            setErro(msg);
            logger.erro('Projetos', msg, e);
            throw e;
        } finally {
            setCarregando(false);
        }
    };

    const editarProjeto = async (id: string, dados: Partial<Projeto>) => {
        setCarregando(true);
        try {
            await api.patch(`/api/projetos/${id}`, dados);
            await buscarProjetos();
            window.dispatchEvent(new Event('projetos_atualizados'));
            logger.sucesso('Projetos', 'Projeto atualizado com sucesso');
        } catch (e: any) {
            const msg = e.response?.data?.erro || 'Erro ao atualizar projeto';
            setErro(msg);
            logger.erro('Projetos', msg, e);
            throw e;
        } finally {
            setCarregando(false);
        }
    };

    const excluirProjeto = async (id: string) => {
        setCarregando(true);
        try {
            await api.delete(`/api/projetos/${id}`);
            await buscarProjetos();
            window.dispatchEvent(new Event('projetos_atualizados'));
            logger.sucesso('Projetos', 'Projeto excluído permanentemente');
        } catch (e: any) {
            const msg = e.response?.data?.erro || 'Erro ao excluir projeto';
            setErro(msg);
            logger.erro('Projetos', msg, e);
            throw e;
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarProjetos();

        const onAtualizacaoGlobal = () => buscarProjetos();
        window.addEventListener('projetos_atualizados', onAtualizacaoGlobal);

        return () => window.removeEventListener('projetos_atualizados', onAtualizacaoGlobal);
    }, [buscarProjetos]);

    return {
        projetos,
        carregando,
        erro,
        recarregar: buscarProjetos,
        criarProjeto,
        editarProjeto,
        excluirProjeto
    };
}
