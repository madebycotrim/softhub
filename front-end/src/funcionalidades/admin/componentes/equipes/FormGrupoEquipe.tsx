import { useState, memo } from 'react';
import { Users } from 'lucide-react';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { SeletorBuscavel } from './SeletorBuscavel';

interface FormGrupoEquipeProps {
    titulo: string;
    tipo: 'equipe' | 'grupo';
    equipes?: { id: string; nome: string }[];
    equipeAtivaId?: string;
    aoSalvar: (dados: any) => Promise<void>;
    aoFechar: () => void;
}

export const FormGrupoEquipe = memo(({ titulo, tipo, equipes, equipeAtivaId, aoSalvar, aoFechar }: FormGrupoEquipeProps) => {
    const [salvando, setSalvando] = useState(false);
    const [nome, setNome] = useState('');
    const [equipeId, setEquipeId] = useState(equipeAtivaId || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        try {
            const dados = tipo === 'equipe'
                ? { nome }
                : { nome, equipe_id: equipeId || null };
            await aoSalvar(dados);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Nome {tipo === 'equipe' ? 'da Equipe' : 'do Grupo'}</label>
                    <input
                        required
                        autoFocus
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder={tipo === 'equipe' ? "Ex: Desenvolvimento, Comercial..." : "Ex: Squad Alpha, Operações..."}
                        className="w-full h-12 bg-muted/10 border border-border rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30"
                    />
                </div>

                {tipo === 'grupo' && equipes && !equipeAtivaId && (
                    <SeletorBuscavel
                        label="Equipe Responsável"
                        valor={equipeId}
                        aoAlterar={setEquipeId}
                        opcoes={equipes}
                        placeholderVazio="Selecione a equipe de comando..."
                        icone={Users}
                    />
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                <button 
                    type="button" 
                    onClick={aoFechar} 
                    className="h-12 px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-xl transition-all"
                >
                    Descartar
                </button>
                <button
                    type="submit"
                    disabled={salvando || !nome.trim()}
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl text-[10px] font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-30 flex items-center justify-center uppercase tracking-widest"
                >
                    {salvando ? <Carregando /> : `Confirmar Cadastro`}
                </button>
            </div>
        </form>
    );
});
