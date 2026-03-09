import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { msalInstance } from './configuracoes/msal';
import { rotas } from './configuracoes/rotas';
import { aplicarTemaSalvo } from './utilitarios/tema';
import './index.css';

const ERROS_MSAL_ESPERADOS = new Set([
    'no_token_request_cache_error',
    'hash_empty_error',
    'no_cached_authority_error',
    'state_not_found',
    'state_mismatch',
    'interaction_in_progress',
]);

function getRootElement(): HTMLElement {
    const el = document.getElementById('root');
    if (!el) throw new Error('Elemento #root não encontrado no DOM.');
    return el;
}

function renderizarApp(): void {
    aplicarTemaSalvo();
    // RouterProvider é o componente MAIS EXTERNO.
    // MsalProvider e ProvedorAutenticacao ficam DENTRO do router (em rotas.tsx),
    // para que useNavigate (usado internamente pelo MsalProvider v5) funcione.
    ReactDOM.createRoot(getRootElement()).render(
        <React.StrictMode>
            <RouterProvider router={rotas} />
        </React.StrictMode>
    );
}

function renderizarErro(erro: Error): void {
    const paginaStyle: React.CSSProperties = {
        fontFamily: 'Poppins, sans-serif', background: '#020617', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    };
    const containerStyle: React.CSSProperties = { maxWidth: 480, width: '100%', textAlign: 'center', color: '#fff' };
    const tituloStyle: React.CSSProperties = { color: '#ef4444', fontSize: 28, fontWeight: 900, marginBottom: 12 };
    const descricaoStyle: React.CSSProperties = { color: '#94a3b8', marginBottom: 24 };
    const caixaStyle: React.CSSProperties = {
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12, padding: 16, fontSize: 11, color: '#fca5a5',
        textAlign: 'left', wordBreak: 'break-all', whiteSpace: 'pre-wrap', marginBottom: 24,
    };
    const botaoStyle: React.CSSProperties = {
        padding: '12px 32px', background: '#fff', color: '#0f172a',
        fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14,
    };
    ReactDOM.createRoot(getRootElement()).render(
        <div style={paginaStyle}>
            <div style={containerStyle}>
                <h1 style={tituloStyle}>Erro de Sistema</h1>
                <p style={descricaoStyle}>Não foi possível carregar o provedor de identidade Microsoft.</p>
                <pre style={caixaStyle}>{erro.name}: {erro.message}</pre>
                <button style={botaoStyle} onClick={() => window.location.replace(`${window.location.origin}/login`)}>
                    Tentar Novamente
                </button>
            </div>
        </div>
    );
}

async function inicializar(): Promise<void> {
    await msalInstance.initialize();

    try {
        await msalInstance.handleRedirectPromise();
    } catch (e: any) {
        if (!ERROS_MSAL_ESPERADOS.has(e?.errorCode)) {
            console.error('[Main] Erro ao processar promessa de redirect:', e);
        }
    }

    renderizarApp();
}

// Registro do Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[PWA] Service Worker registrado:', reg.scope))
            .catch(err => console.error('[PWA] Erro ao registrar Service Worker:', err));
    });
}

inicializar().catch((erro: unknown) => {
    console.error('[Main] Erro crítico na inicialização MSAL:', erro);
    renderizarErro(erro instanceof Error ? erro : new Error(String(erro)));
});