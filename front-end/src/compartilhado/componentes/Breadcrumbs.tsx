import { useLocation, Link } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Mapeamento de rotas para nomes amigáveis.
 */
const NOMES_ROTAS: Record<string, string> = {
    'app': 'Início',
    'dashboard': 'Dashboard',
    'backlog': 'Backlog',
    'projeto': 'Projeto',
    'kanban': 'Kanban',
    'ponto': 'Ponto Eletrônico',
    'avisos': 'Mural de Avisos',
    'admin': 'Administração',
    'membros': 'Gerenciar Membros',
    'equipes': 'Gestão de Equipes',
    'projetos': 'Configurar Projetos',
    'relatorios': 'Relatórios',
    'logs': 'Logs do Sistema',
    'configuracoes': 'Governança',
    'justificativas': 'Auditoria de Ponto'
};

/**
 * Componente de navegação hierárquica (Breadcrumbs).
 * Design coeso com o sistema — discreto, com mesma tipografia dos labels.
 */
export function Breadcrumbs() {
    const location = useLocation();
    const paths = useMemo(() => {
        return location.pathname.split('/').filter(p => p && p !== '');
    }, [location.pathname]);

    if (paths.length <= 1 || paths.includes('dashboard')) return null;

    return (
        <nav className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-none whitespace-nowrap animar-entrada">
            <Link 
                to="/app/dashboard" 
                className="p-1 text-muted-foreground/30 hover:text-primary transition-colors rounded"
            >
                <Home size={13} strokeWidth={1.8} />
            </Link>

            {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const label = NOMES_ROTAS[path] || path;
                const to = `/${paths.slice(0, index + 1).join('/')}`;

                return (
                    <div key={to} className="flex items-center gap-1.5">
                        <ChevronRight size={11} className="text-border shrink-0" />
                        
                        {isLast ? (
                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.15em]">
                                {label}
                            </span>
                        ) : (
                            <Link
                                to={to}
                                className="text-[10px] font-medium text-muted-foreground/30 hover:text-foreground/50 transition-colors uppercase tracking-[0.15em]"
                            >
                                {label}
                                {path === 'app' && <span className="sr-only">Início</span>}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
