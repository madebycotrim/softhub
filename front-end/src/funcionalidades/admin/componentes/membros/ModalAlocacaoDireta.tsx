import { useState, useMemo, memo } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/compartilhado/componentes/Modal';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { Carregando } from '@/compartilhado/componentes/Carregando';

interface ModalAlocacaoDiretaProps {
    aberto: boolean;
    aoFechar: () => void;
    membro: any;
    grupos: any[];
    equipes: any[];
    aoAlocar: (membroId: string, equipeId: string | null, grupoId: string | null) => Promise<any>;
}

/** Componente para alocação rápida de membros sem sair do painel administrativo. */
export const ModalAlocacaoDireta = memo(({ aberto, aoFechar, membro, grupos, equipes, aoAlocar }: ModalAlocacaoDiretaProps) => {
    const [equipe_id, setEquipeId] = useState('');
    const [grupo_id, setGrupoId] = useState('');
    const [salvando, setSalvando] = useState(false);

    const gruposFiltrados = useMemo(() =>
        grupos.filter((g: any) => g.equipe_id === equipe_id),
        [grupos, equipe_id]);

    const handleConfirmar = async () => {
        if (!equipe_id || !grupo_id) return;
        setSalvando(true);
        try {
            if (membro) await aoAlocar(membro.id, equipe_id, grupo_id);
            aoFechar();
        } catch (e) {
            console.error('Falha ao alocar:', e);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Alocação Rápida" largura="sm">
            <div className="space-y-6">
                {membro && (
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/40">
                        <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-foreground">{membro.nome}</p>
                            <p className="text-[10px] text-muted-foreground">{membro.email}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Equipe Destino</label>
                    <select
                        value={equipe_id}
                        onChange={e => setEquipeId(e.target.value)}
                        className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl px-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Selecione uma equipe...</option>
                        {equipes.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Grupo Destino</label>
                    <select
                        value={grupo_id}
                        onChange={e => setGrupoId(e.target.value)}
                        className="w-full h-11 bg-muted/40 border border-border/40 rounded-xl px-4 text-[11px] font-bold outline-none focus:bg-background focus:border-primary/30 transition-all appearance-none cursor-pointer"
                        disabled={!equipe_id}
                    >
                        <option value="">Selecione um grupo...</option>
                        {gruposFiltrados.map((g: any) => <option key={g.id} value={g.id}>{g.nome}</option>)}
                    </select>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleConfirmar}
                        disabled={salvando || !equipe_id || !grupo_id}
                        className="w-full h-12 bg-primary text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-2"
                    >
                        {salvando ? <Carregando Centralizar={false} tamanho="sm" className="border-t-white" /> : (
                            <>
                                <span>Efetivar Alocação</span>
                                <Plus size={16} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
});
