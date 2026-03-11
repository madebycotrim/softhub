import axios from 'axios';
import { ambiente } from '@/configuracoes/ambiente';

/**
 * Instância axios pré-configurada apontando para a URL do backend (Hono Worker).
 */
export const api = axios.create({
    baseURL: ambiente.apiUrl,
});

/**
 * Interceptador de request:
 * Insere o Bearer Token do localStorage em todas as requisições, caso ele exista.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('softhub_token');

        if (token) {
            if (!config.headers) {
                config.headers = axios.AxiosHeaders.from({});
            }
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (erro) => {
        return Promise.reject(erro);
    }
);

/**
 * Interceptador de response:
 * Capta respostas de erro 401 (Não Autorizado) visando deslogar o usuário,
 * forçando o recarregamento na tela de login.
 */
api.interceptors.response.use(
    (resposta) => {
        // Trata sucesso normalmente
        return resposta;
    },
    (erro) => {
        // Caso receba 401 do backend, token expirou ou é inválido
        if (erro.response && erro.response.status === 401) {
            // Limpa storage forçadamente
            localStorage.removeItem('softhub_token');
            localStorage.removeItem('softhub_usuario');

            // Se não estivermos rodando no servidor, redireciona o browser.
            // Observação: React Router seria o ideal para evitar full-page reload, mas o redirecionamento
            // tradicional costuma ser à prova de falhas na camada da API.
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(erro);
    }
);
