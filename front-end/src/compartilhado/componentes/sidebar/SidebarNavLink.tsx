import { useCallback, memo } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/compartilhado/servicos/api';

interface SidebarNavLinkProps {
    link: { label: string; path: string; icon: any };
    ativo: boolean;
    projetoAtivoId: string | null;
    onNavegar?: () => void;
}

export const SidebarNavLink = memo(({ link, ativo, projetoAtivoId, onNavegar }: SidebarNavLinkProps) => {
    const queryClient = useQueryClient();
    const Icon = link.icon;

    const handlePrefetch = useCallback(() => {
        if (!projetoAtivoId) return;

        if (link.path === '/app/kanban' || link.path === '/app/backlog') {
            queryClient.prefetchQuery({
                queryKey: ['tarefas', projetoAtivoId, undefined, undefined, undefined],
                queryFn: async () => {
                    const res = await api.get('/api/tarefas', { params: { projetoId: projetoAtivoId } });
                    return res.data || [];
                },
                staleTime: 30000,
            });
        }

        if (link.path === '/app/dashboard') {
            queryClient.prefetchQuery({
                queryKey: ['dashboard', projetoAtivoId],
                queryFn: async () => {
                    const res = await api.get(`/api/dashboard/${projetoAtivoId}`);
                    return res.data;
                },
                staleTime: 30000,
            });
        }
    }, [link.path, projetoAtivoId, queryClient]);

    return (
        <Link
            to={link.path}
            onClick={onNavegar}
            onMouseEnter={handlePrefetch}
            className={`
                group relative flex items-center gap-3 px-3 py-1.5 text-sm font-medium
                transition-all duration-200 select-none mx-3 rounded-lg
                ${ativo
                    ? 'text-primary bg-primary/[0.08] dark:bg-primary/15'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
            `}
        >
            <div className={`
                absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-200
                ${ativo
                    ? 'bg-primary opacity-100'
                    : 'bg-muted-foreground/40 opacity-0 group-hover:opacity-100'
                }
            `} />

            <div className={`
                flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-all duration-200
                ${ativo
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
                }
            `}>
                <Icon
                    size={16}
                    strokeWidth={ativo ? 2.2 : 1.8}
                />
            </div>

            <span className={`${ativo ? 'font-semibold' : ''} transition-colors`}>
                {link.label}
            </span>
        </Link>
    );
});
