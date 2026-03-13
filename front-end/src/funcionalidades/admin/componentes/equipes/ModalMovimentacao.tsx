import { useState, useEffect, memo } from 'react';
import { LayoutGrid, ArrowRightLeft } from 'lucide-react';
import { Modal } from '@/compartilhado/componentes/Modal';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { SeletorBuscavel } from './SeletorBuscavel';
import type { MembroSimples } from './tipos';
import type { Grupo } from '@/funcionalidades/admin/hooks/usarEquipes';

interface ModalMovimentacaoProps {
    aberto: boolean;
    aoFechar: () => void;
    membro: MembroSimples | null;
    grupos: Grupo[];
    equipeId: string;
    aoMover: (membroId: string, equipeId: string, grupoDestinoId: string) => Promise<void>;
}

export const ModalMovimentacao = memo(({ aberto, aoFechar, membro, grupos, equipeId, aoMover }: ModalMovimentacaoProps) => {
    const [grupoDestinoId, setGrupoDestinoId] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (aberto) {
            setGrupoDestinoId('');
        }
    }, [aberto]);

    const handleMover = async () => {
        if (!membro || !grupoDestinoId) return;
        setSalvando(true);
        try {
            await aoMover(membro.id, equipeId, grupoDestinoId);
            aoFechar();
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Mover para outro Grupo" largura="sm">
            <div className="space-y-6">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Avatar nome={membro?.nome || ''} fotoPerfil={membro?.foto_perfil || null} tamanho="md" />
                    <div>
                        <p className="text-sm font-bold text-slate-900">{membro?.nome}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{membro?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <SeletorBuscavel
                        label="Grupo de Destino"
                        valor={grupoDestinoId}
                        aoAlterar={setGrupoDestinoId}
                        opcoes={grupos.map(g => ({ id: g.id, nome: g.nome }))}
                        placeholderVazio="Selecione o grupo..."
                        icone={LayoutGrid}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-slate-100">
                    <button type="button" onClick={aoFechar} className="w-full sm:flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
                        CANCELAR
                    </button>
                    <button
                        onClick={handleMover}
                        disabled={salvando || !grupoDestinoId}
                        className="w-full sm:flex-[2] h-12 bg-blue-600 text-white rounded-2xl text-[10px] font-black shadow-md hover:bg-blue-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {salvando ? <Carregando Centralizar={false} tamanho="sm" className="border-t-white border-white/30" /> : (
                            <>
                                <span>Mover Agora</span>
                                <ArrowRightLeft size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
});
