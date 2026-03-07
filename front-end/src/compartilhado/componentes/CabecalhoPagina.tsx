import { Bell, Moon, Sun, Menu, Monitor } from 'lucide-react';
import { usarTema } from '../../contexto/ContextoTema';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useLocation, Link } from 'react-router';

/**
 * Cabeçalho do sistema interno. Exibe nome/foto do usuário e botões de ação global.
 */
export function CabecalhoPagina() {
    const { tema, setTema } = usarTema();
    const location = useLocation();

    const alternarTema = () => {
        if (tema === 'dark') setTema('light');
        else if (tema === 'light') setTema('system');
        else setTema('dark');
    };

    // Mapeamento de caminhos para labels amigáveis
    const mapaNomes: Record<string, string> = {
        'dashboard': 'Dashboard',
        'sprints': 'Sprints',
        'ponto': 'Ponto Eletrônico',
        'membros': 'Diretório',
        'avisos': 'Mural de Avisos',
        'admin': 'Administração',
        'logs': 'Painel de Logs',
        'perfil': 'Meu Perfil'
    };

    const segmentos = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = segmentos.map((seg, index) => {
        if (seg === 'app') return null;
        return {
            label: mapaNomes[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
            href: '/' + segmentos.slice(0, index + 1).join('/')
        };
    }).filter(Boolean);

    return (
        <header className="h-20 shrink-0 flex items-center justify-between px-6 pt-4 relative z-[60]">
            <div className="w-full h-full bg-card border border-border rounded-2xl flex items-center justify-between px-6 shadow-sm relative overflow-hidden group">
                {/* Detalhe de Brilho Superior (Sync com estética premium) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

                {/* Lado Esquerdo: Breadcrumbs Técnicos e Limpos */}
                <div className="flex items-center gap-6 relative z-10">
                    <button className="p-2 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-xl lg:hidden transition-all duration-300">
                        <Menu size={20} />
                    </button>

                    <nav className="hidden md:flex items-center text-[11px] font-black uppercase tracking-[0.15em] select-none">
                        <span className="text-muted-foreground/40">Fábrica</span>

                        {breadcrumbs.length > 0 && (
                            <div className="flex items-center">
                                <span className="mx-3 text-border font-light">/</span>
                                {breadcrumbs.map((crumb, idx) => {
                                    const isLast = idx === breadcrumbs.length - 1;
                                    return (
                                        <div key={idx} className="flex items-center">
                                            <Link
                                                to={crumb!.href}
                                                className={`transition-colors duration-300 ${isLast ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'}`}
                                            >
                                                {crumb!.label}
                                            </Link>
                                            {!isLast && <span className="mx-3 text-border font-light">/</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </nav>
                </div>

                {/* Lado Direito: Busca + Ações Profissionais */}
                <div className="flex items-center gap-4 relative z-10">
                    {/* Comando Global Único */}
                    <div className="hidden lg:flex items-center group/search mr-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                <div className="w-4 h-4 border border-border rounded-[4px] flex items-center justify-center text-[9px] font-black text-muted-foreground/40 group-focus-within/search:border-primary/40 group-focus-within/search:text-primary transition-colors">/</div>
                            </div>
                            <input
                                type="text"
                                placeholder="Comando global... (Alt+K)"
                                readOnly
                                className="w-80 h-10 pl-11 pr-4 bg-accent/20 border border-border rounded-xl text-[13px] text-foreground/70 placeholder:text-muted-foreground/40 focus:outline-none focus:bg-accent/40 transition-all duration-300 cursor-default"
                            />
                        </div>
                    </div>

                    <div className="h-6 w-px bg-border hidden sm:block"></div>

                    {/* Alternar Tema */}
                    <button
                        onClick={alternarTema}
                        className="p-2 text-muted-foreground/40 hover:text-primary hover:bg-accent rounded-lg transition-all duration-300 group"
                    >
                        <div className="group-active:scale-90 transition-transform">
                            {tema === 'dark' ? <Moon size={16} /> : tema === 'light' ? <Sun size={16} /> : <Monitor size={16} />}
                        </div>
                    </button>

                    <AuthenticatedTemplate>
                        <button className="p-2 text-muted-foreground/40 hover:text-primary hover:bg-accent rounded-lg transition-all duration-300 relative group">
                            <Bell size={16} className="group-hover:rotate-12 transition-transform" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-destructive rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                        </button>
                    </AuthenticatedTemplate>

                    <UnauthenticatedTemplate>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-4 h-8 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300"
                        >
                            Entrar
                        </button>
                    </UnauthenticatedTemplate>
                </div>
            </div>
        </header>
    );
}
