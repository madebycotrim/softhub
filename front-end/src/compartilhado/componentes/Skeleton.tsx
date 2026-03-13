import { HTMLAttributes } from 'react';

/**
 * Componente de Skeleton para estados de carregamento.
 * Segue o design sistemático da Fábrica de Software.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-muted/40 ${className}`}
            {...props}
        />
    );
}

/**
 * Skeleton para Cartões (Dashboard/Kanban).
 */
export function SkeletonCard() {
    return (
        <div className="bg-card border border-border/60 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-full" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Skeleton para Linhas de Tabela.
 */
export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 py-4 px-6 border-b border-border/20">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/6 opacity-50" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
    );
}
