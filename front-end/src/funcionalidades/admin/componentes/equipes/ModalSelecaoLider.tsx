import { useState, useMemo, memo } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { Modal } from '@/compartilhado/componentes/Modal';
import { Avatar } from '@/compartilhado/componentes/Avatar';
import { EstadoVazio } from '@/compartilhado/componentes/EstadoVazio';
import type { MembroSimples } from './tipos';

interface ModalSelecaoLiderProps {
    aberto: boolean;
    aoFechar: () => void;
    membros: MembroSimples[];
    aoConfirmar: (mId: string) => Promise<void>;
    titulo: string;
    valorAtual?: string | null;
    outroId?: string | null;
    tipo?: 'lider' | 'sub_lider';
}

export const ModalSelecaoLider = memo(({ 
    aberto, 
    aoFechar, 
    membros, 
    aoConfirmar, 
    titulo,
    valorAtual,
    outroId,
    tipo
}: ModalSelecaoLiderProps) => {
    const [busca, setBusca] = useState('');
    const [salvando, setSalvando] = useState(false);

    const filtrados = useMemo(() => 
        membros.filter(m => 
            m.nome.toLowerCase().includes(busca.toLowerCase()) || 
            m.email.toLowerCase().includes(busca.toLowerCase())
        ),
    [membros, busca]);

    const handleSelecionar = async (id: string) => {
        setSalvando(true);
        try {
            await aoConfirmar(id);
            aoFechar();
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="auto">
            <div className="space-y-6">
                <div className="relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-blue-500 transition-colors" size={16} />
                    <input
                        autoFocus
                        placeholder="Pesquisar por nome ou e-mail..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white outline-none transition-all"
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                    {filtrados.map(m => {
                        const ehOutro = outroId === m.id;
                        const bloqueado = ehOutro && tipo === 'sub_lider';
                        const selecionado = valorAtual === m.id;
                        
                        return (
                            <button
                                key={m.id}
                                onClick={() => !bloqueado && handleSelecionar(m.id)}
                                disabled={salvando || bloqueado}
                                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group 
                                    ${selecionado ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}
                                    ${bloqueado ? 'opacity-50 cursor-not-allowed grayscale bg-slate-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar nome={m.nome} fotoPerfil={m.foto_perfil} tamanho="md" className={selecionado ? 'ring-2 ring-blue-200' : ''} />
                                    <div>
                                        <p className={`text-sm font-bold transition-colors ${selecionado ? 'text-blue-900' : 'text-slate-900'}`}>{m.nome}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">{m.email}</p>
                                        {ehOutro && (
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">
                                                {tipo === 'lider' ? 'Atualmente Sub-líder' : 'Líder (Indisponível)'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={`shrink-0 transition-all ${selecionado ? 'scale-110 opacity-100' : 'opacity-0 group-hover:opacity-40 scale-75'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selecionado ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        <UserCheck size={14} />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {filtrados.length === 0 && (
                        <EstadoVazio 
                            tipo="pesquisa"
                            titulo="Candidato não encontrado"
                            descricao={`Não encontramos membros com o termo "${busca}".`}
                        />
                    )}
                </div>
            </div>
        </Modal>
    );
});
