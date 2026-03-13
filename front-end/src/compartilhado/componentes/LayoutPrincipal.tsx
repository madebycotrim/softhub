import { useState, useEffect, type ReactNode } from 'react';
import { BarraLateral } from './BarraLateral';
import { Menu, X, QrCode, Sun, Moon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { usarTema } from '@/contexto/ContextoTema';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarProjetos } from '@/funcionalidades/projetos/hooks/usarProjetos';
import { Modal } from './Modal';
import ScannerQR from '@/funcionalidades/autenticacao/componentes/ScannerQR';


interface LayoutPrincipalProps {
    children: ReactNode;
}

/**
 * Layout base de todas as páginas internas da aplicação.
 * Implementa navegação responsiva: Sidebar fixa no Desktop e Drawer no Mobile.
 */
export function LayoutPrincipal({ children }: LayoutPrincipalProps) {
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const [scannerAberto, setScannerAberto] = useState(false);
    const { tema, setTema } = usarTema();
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
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300" />
                    
                    {/* Drawer Content */}
                    <div 
                        className="absolute inset-y-0 left-0 w-[280px] bg-sidebar border-r border-sidebar-border animate-in slide-in-from-left duration-300"
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

            <div className="flex flex-col flex-1 overflow-hidden relative">
                {/* Mobile Header: Só aparece em telas pequenas */}
                <header className="lg:hidden h-16 shrink-0 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
                    <Tooltip texto="Abrir Menu" posicao="right">
                        <button 
                            onClick={() => setSidebarAberta(true)}
                            className="p-2.5 -ml-1 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all active:scale-90"
                        >
                            <Menu size={22} strokeWidth={2.5} />
                        </button>
                    </Tooltip>
                    
                    <div className="flex flex-col  leading-none">
                        <span className="text-[13px] font-black text-foreground uppercase tracking-widest text-center">Fábrica de Software</span>
                        <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-0.5 opacity-60">SoftHub</span>
                    </div>

                    <div className="flex items-center gap-2 -mr-1">
                        <Tooltip texto="Conectar via QR Code">
                            <button
                                onClick={() => setScannerAberto(true)}
                                className="p-2 text-muted-foreground hover:text-primary transition-colors bg-sidebar-accent/5 rounded-2xl border border-border/40"
                            >
                                <QrCode size={18} />
                            </button>
                        </Tooltip>
                        <Tooltip texto={tema === 'dark' ? "Modo Claro" : "Modo Escuro"}>
                            <button
                                onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
                                className="p-2 text-muted-foreground hover:text-primary transition-colors bg-sidebar-accent/5 rounded-2xl border border-border/40"
                            >
                                {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </Tooltip>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto relative z-10 transition-all overflow-x-hidden">
                    {children}
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
