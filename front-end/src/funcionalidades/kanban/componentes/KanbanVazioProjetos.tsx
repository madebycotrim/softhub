import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';

interface KanbanVazioProjetosProps {
    podeGerenciarProjetos: boolean;
}

export const KanbanVazioProjetos = memo(({ podeGerenciarProjetos }: KanbanVazioProjetosProps) => {
    const navigate = useNavigate();
    
    return (
        <>
            <EstadoVazio
                titulo="Fábrica Vazia"
                descricao="Parece que ainda não existem projetos cadastrados. Você precisa criar um projeto antes de gerenciar tarefas."
                acao={podeGerenciarProjetos ? {
                    rotulo: "Criar Primeiro Projeto",
                    aoClicar: () => navigate("/app/admin/projetos")
                } : undefined}
            />
            {!podeGerenciarProjetos && (
                <div className="flex justify-center -mt-10 mb-10 animate-in fade-in slide-in-from-top-2 duration-700">
                    <p className="text-[10px] font-black uppercase tracking-widest text-destructive/60 bg-destructive/5 px-4 py-2 rounded-xl border border-destructive/10">
                        Contate um administrador para criar projetos
                    </p>
                </div>
            )}
        </>
    );
});
