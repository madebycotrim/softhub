import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    role: string;
    foto_perfil?: string;
}

interface ContextoAutenticacaoContrato {
    usuario: Usuario | null;
    token: string | null;
    estaAutenticado: boolean;
    carregando: boolean;
    entrar: (usuario: Usuario, token: string) => void;
    sair: () => void;
    atualizarUsuarioLocalmente: (usuario: Usuario) => void;
}

export const ContextoAutenticacao = createContext<ContextoAutenticacaoContrato | null>(null);

export function usarAutenticacaoContexto() {
    const ctx = useContext(ContextoAutenticacao);
    if (!ctx) throw new Error('usarAutenticacaoContexto deve ser usado dentro de ProvedorAutenticacao');
    return ctx;
}

const CHAVE_TOKEN = 'softhub_token';
const CHAVE_USUARIO = 'softhub_usuario';

/**
 * ProvedorAutenticacao NÃO usa useNavigate — ele vive fora do RouterProvider.
 * A navegação após login é feita pelo componente ProcessadorLoginMsal
 * que fica DENTRO do router (em rotas.tsx).
 */
export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);

    // Restaura sessão do localStorage na inicialização
    useEffect(() => {
        const tokenSalvo = localStorage.getItem(CHAVE_TOKEN);
        const usuarioSalvo = localStorage.getItem(CHAVE_USUARIO);

        if (tokenSalvo && usuarioSalvo) {
            try {
                setToken(tokenSalvo);
                setUsuario(JSON.parse(usuarioSalvo));
            } catch {
                localStorage.removeItem(CHAVE_TOKEN);
                localStorage.removeItem(CHAVE_USUARIO);
            }
        }

        setCarregando(false);
    }, []);

    const entrar = useCallback((novoUsuario: Usuario, novoToken: string) => {
        setUsuario(novoUsuario);
        setToken(novoToken);
        localStorage.setItem(CHAVE_TOKEN, novoToken);
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(novoUsuario));
    }, []);

    const sair = useCallback(() => {
        setUsuario(null);
        setToken(null);
        localStorage.removeItem(CHAVE_TOKEN);
        localStorage.removeItem(CHAVE_USUARIO);

        // Apenas redireciona localmente, sem deslogar da conta Microsoft global
        window.location.href = '/login';
    }, []);

    const atualizarUsuarioLocalmente = useCallback((atualizado: Usuario) => {
        setUsuario(atualizado);
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(atualizado));
    }, []);

    if (carregando) return null;

    return (
        <ContextoAutenticacao.Provider value={{
            usuario, token,
            estaAutenticado: !!token && !!usuario,
            carregando,
            entrar, sair,
            atualizarUsuarioLocalmente,
        }}>
            {children}
        </ContextoAutenticacao.Provider>
    );
}