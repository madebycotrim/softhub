import { useState, useEffect, type ReactNode } from 'react';
import { BarraLateral } from './BarraLateral';
import { Menu, X } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { Modal } from './Modal';
import ScannerQR from '@/funcionalidades/autenticacao/componentes/ScannerQR';
import { ErrorBoundary } from './ErrorBoundary';
import { SincronizadorGlobal } from './SincronizadorGlobal';
import { Breadcrumbs } from './Breadcrumbs';


interface LayoutPrincipalProps {
    children: ReactNode;
}

/**
 * Layout base de todas as páginas internas da aplicação.
 * Sidebar fixa no Desktop e Drawer no Mobile. Sem cabeçalho global.
 */
export function LayoutPrincipal({ children }: LayoutPrincipalProps) {
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const [scannerAberto, setScannerAberto] = useState(false);
    const { projetoAtivoId } = usarAutenticacao();
    const { projetos } = usarProjetos();

    // Dinamismo Inteligente: Atualiza o título da aba com o nome do projeto ativo
    useEffect(() => {
        const projeto = projetos.find(p => p.id === projetoAtivoId);
        if (projeto) {
            document.title = `${projeto.nome} | SoftHub`;
        } else {
            document.title = 'Fábrica de Software | SoftHub';
        }
    }, [projetoAtivoId, projetos]);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden transition-colors duration-300 font-sans">
            <SincronizadorGlobal />

            {/* Sidebar Desktop */}
            <div className="hidden lg:flex shrink-0 w-[280px]">
                <BarraLateral aoAbrirScanner={() => setScannerAberto(true)} />
            </div>

            {/* Mobile: Overlay & Drawer Sidebar */}
            {sidebarAberta && (
                <div
                    className="fixed inset-0 z-50 lg:hidden"
                    onClick={() => setSidebarAberta(false)}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animar-entrada" />

                    {/* Drawer Content */}
                    <div
                        className="absolute inset-y-0 left-0 w-[280px] bg-sidebar border-r border-sidebar-border animar-entrada"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full relative">
                            {/* Botão fechar móvel */}
                            <Tooltip texto="Fechar" posicao="right">
                                <button
                                    onClick={() => setSidebarAberta(false)}
                                    className="absolute top-4 right-4 z-50 p-2 text-sidebar-foreground/40 hover:text-primary transition-colors bg-sidebar-accent/30 rounded-2xl"
                                >
                                    <X size={20} />
                                </button>
                            </Tooltip>
                            <BarraLateral
                                aoNavegar={() => setSidebarAberta(false)}
                                aoAbrirScanner={() => setScannerAberto(true)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 overflow-hidden relative min-w-0">
                {/* Botão de menu mobile flutuante */}
                <button
                    onClick={() => setSidebarAberta(true)}
                    className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg text-muted-foreground hover:text-primary transition-all active:scale-95"
                >
                    <Menu size={20} strokeWidth={2.5} />
                </button>

                <main className="flex-1 p-6 overflow-y-auto relative z-10 transition-all overflow-x-hidden animar-entrada scrollbar-none bg-background/50 min-w-0">
                    <Breadcrumbs />
                    <ErrorBoundary modulo="Módulo Selecionado">
                        {children}
                    </ErrorBoundary>
                </main>
            </div>

            {/* Modal Scanner QR (Global via Layout) */}
            <Modal
                aberto={scannerAberto}
                aoFechar={() => setScannerAberto(false)}
                titulo="Conectar via QR Code"
                largura="sm"
            >
                <ScannerQR aoFechar={() => setScannerAberto(false)} />
            </Modal>
        </div>
    );
}
