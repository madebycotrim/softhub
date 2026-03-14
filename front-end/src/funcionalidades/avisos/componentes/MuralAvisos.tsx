import { useState, useMemo, memo } from 'react';
import { Plus, Megaphone } from 'lucide-react';
import { usarAvisos } from '@/funcionalidades/avisos/hooks/usarAvisos';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { EstadoErro } from '@/compartilhado/componentes/EstadoErro';
import { usarPermissao, usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { Modal } from '@/compartilhado/componentes/Modal';
import { FormularioAviso } from './FormularioAviso';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { CardAviso } from './CardAviso';

export const MuralAvisos = memo(() => {
    const { avisos, carregando, erro, removerAviso } = usarAvisos();
    const podeCriar = usarPermissaoAcesso('avisos:criar');
    const podeRemoverGeral = usarPermissaoAcesso('avisos:remover');
    const isAdmin = usarPermissao('ADMIN');
    const [modalAberto, setModalAberto] = useState(false);
    const { usuario } = usarAutenticacao();

    // Ordenamos os avisos para Urgente aparecer primeiro
    const avisosOrdenados = useMemo(() => {
        return [...avisos].sort((a, b) => {
            const pVal: Record<string, number> = { urgente: 3, importante: 2, info: 1 };
            return (pVal[b.prioridade] || 0) - (pVal[a.prioridade] || 0);
        });
    }, [avisos]);

    return (
        <div className="w-full space-y-6 animar-entrada">
            <CabecalhoFuncionalidade
                titulo="Mural de Avisos"
                subtitulo="Comunicados importantes para a equipe ou grupos."
                icone={Megaphone}
                variante="destaque"
            >
                <div className="flex items-center gap-4">
                    {podeCriar && (
                        <button
                            onClick={() => setModalAberto(true)}
                            className="h-11 px-6 bg-primary text-primary-foreground rounded-full flex items-center gap-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>Criar Aviso</span>
                        </button>
                    )}
                </div>
            </CabecalhoFuncionalidade>

            <div className="grid grid-cols-1 gap-4">
                {carregando && avisos.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 w-full bg-card/60 border border-border/40 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : erro ? (
                    <div className="py-24 max-w-lg mx-auto w-full">
                         <EstadoErro titulo="Erro no Mural" mensagem={erro} />
                    </div>
                ) : avisosOrdenados.length === 0 ? (
                    <EstadoVazio 
                        titulo="Mural Silencioso"
                        descricao="Nenhum comunicado importante foi publicado recentemente. Aproveite o foco!"
                    />
                ) : (
                    avisosOrdenados.map((aviso, index) => (
                        <CardAviso 
                            key={aviso.id}
                            aviso={aviso}
                            podeDeletar={isAdmin || podeRemoverGeral || usuario?.id === aviso.criado_por.id}
                            aoRemover={removerAviso}
                            index={index}
                        />
                    ))
                )}
            </div>

            {modalAberto && (
                <Modal aberto={modalAberto} aoFechar={() => setModalAberto(false)} titulo="Criar Novo Aviso" largura="sm">
                    <FormularioAviso aoSalvar={() => setModalAberto(false)} />
                </Modal>
            )}

        </div>
    );
});
 
export default MuralAvisos;
