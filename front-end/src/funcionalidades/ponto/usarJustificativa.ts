import { useState, useEffect } from 'react';
import { api } from '../../compartilhado/servicos/api';
// import { usarAutenticacao } from '../autenticacao/usarAutenticacao';

export interface JustificativaPonto {
    id: string;
    usuario_id: string;
    data: string;
    tipo: 'ausencia' | 'esquecimento' | 'problema_sistema';
    motivo: string;
    status: 'pendente' | 'aprovada' | 'rejeitada';
    motivo_rejeicao: string | null;
    avaliado_por: string | null;
    avaliado_em: string | null;
    criado_em: string;
}

/**
 * Hook de leitura/escrita para o próprio Membro Operacional (Meu Ponto).
 */
export function usarJustificativas() {
    const [justificativas, setJustificativas] = useState<JustificativaPonto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const carregar = async () => {
        try {
            setCarregando(true);
            const res = await api.get('/api/ponto/justificativas', { params: { pagina } });
            setJustificativas(res.data.dados);
            setTotalPaginas(res.data.paginacao?.totalPaginas || 1);
            setErro(null);
        } catch (e: any) {
            setErro(e.response?.data?.erro || 'Erro ao carregar justificativas.');
        } finally {
            setCarregando(false);
        }
    };

    /**
     * Envia uma nova justificativa de erro de ponto.
     */
    const enviarJustificativa = async (dados: { data: string; tipo: string; motivo: string }) => {
        try {
            await api.post('/api/ponto/justificativas', dados);
            await carregar(); // Recarrega view para inserir o card pendente
        } catch (e: any) {
            throw new Error(e.response?.data?.erro || 'Erro ao enviar justificativa.');
        }
    };

    useEffect(() => {
        carregar();
    }, [pagina]);

    return {
        justificativas,
        carregando,
        erro,
        pagina,
        setPagina,
        totalPaginas,
        enviarJustificativa,
        recarregar: carregar
    };
}
