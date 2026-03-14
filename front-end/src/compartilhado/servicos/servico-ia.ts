import { api } from './api';

/**
 * Interface para a resposta de análise de justificativa
 */
export interface AnaliseJustificativa {
    sugestao: 'aprovar' | 'rejeitar' | 'analisar_mais';
    analise: string;
}

/**
 * Interface para a resposta de refinamento de aviso
 */
export interface AvisoRefinado {
    titulo: string;
    conteudo: string;
}

const cacheIA = new Map<string, any>();

/**
 * Serviço frontend para interagir com as funcionalidades de IA.
 * Inclui cache em memória para economizar a cota diária de tokens do usuário.
 */
export const servicoIA = {
    /**
     * Sugere prioridade com base no texto da tarefa
     */
    sugerirPrioridade: async (texto: string) => {
        const chave = `prioridade:${texto}`;
        if (cacheIA.has(chave)) return cacheIA.get(chave);

        const res = await api.post('/api/ia/prioridade', { texto });
        cacheIA.set(chave, res.data);
        return res.data;
    },

    /**
     * Analisa profissionalismo de uma justificativa de ponto
     */
    analisarJustificativa: async (motivo: string): Promise<AnaliseJustificativa> => {
        const chave = `justificativa:${motivo}`;
        if (cacheIA.has(chave)) return cacheIA.get(chave);

        const res = await api.post('/api/ia/analisar-justificativa', { motivo });
        cacheIA.set(chave, res.data);
        return res.data;
    },

    /**
     * Refina um rascunho de aviso para tom corporativo
     */
    refinarAviso: async (rascunho: string): Promise<AvisoRefinado> => {
        const chave = `aviso:${rascunho}`;
        if (cacheIA.has(chave)) return cacheIA.get(chave);

        const res = await api.post('/api/ia/refinar-aviso', { rascunho });
        cacheIA.set(chave, res.data);
        return res.data;
    },

    /**
     * Aprimora e estrutura a descrição de uma tarefa
     */
    aprimorarDescricao: async (titulo: string, descricao: string): Promise<string> => {
        const chave = `descricao:${titulo}:${descricao}`;
        if (cacheIA.has(chave)) return cacheIA.get(chave);

        const res = await api.post('/api/ia/aprimorar-descricao', { titulo, descricao });
        const resultado = res.data.descricao;
        cacheIA.set(chave, resultado);
        return resultado;
    }
};
