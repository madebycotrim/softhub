import { memo } from 'react';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';

interface DashboardVazioProps {
    podeGerenciarProjetos: boolean;
}

export const DashboardVazio = memo(({ podeGerenciarProjetos }: DashboardVazioProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <EstadoVazio
                titulo="Fábrica Vazia"
                descricao="Ainda não existem projetos cadastrados. Assim que um projeto for atribuído a você, suas métricas aparecerão aqui."
            />
            {!podeGerenciarProjetos && (
                <div className="flex justify-center -mt-10 mb-20 animate-in fade-in slide-in-from-top-2 duration-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/5 px-4 py-2 rounded-xl border border-border/50">
                        O sistema está aguardando a configuração de novos projetos
                    </p>
                </div>
            )}
        </div>
    );
});
