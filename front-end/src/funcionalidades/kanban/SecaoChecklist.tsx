import { useState } from 'react';
import { usarChecklist } from './usarChecklist';
import { usarPermissaoAcesso } from '../../compartilhado/hooks/usarPermissao';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { Tooltip } from '../../compartilhado/componentes/Tooltip';
import { Carregando } from '../../compartilhado/componentes/Carregando';

interface SecaoChecklistProps {
    tarefaId: string;
}

export function SecaoChecklist({ tarefaId }: SecaoChecklistProps) {
    const { itens, carregando, adicionarItem, alternarItem, removerItem, totalConcluidos, totalItens, progresso } = usarChecklist(tarefaId);
    const podeGerenciar = usarPermissaoAcesso('tarefas:checklist');
    const [novoTexto, setNovoTexto] = useState('');
    const [enviando, setEnviando] = useState(false);

    const aoAdicionar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoTexto.trim() || enviando) return;

        setEnviando(true);
        try {
            await adicionarItem(novoTexto);
            setNovoTexto('');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Checklist
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded border border-border">
                        {totalConcluidos}/{totalItens}
                    </span>
                </h3>

                {totalItens > 0 && (
                    <div className="w-24 bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-1.5 transition-all duration-500"
                            style={{ width: `${progresso}%` }}
                        />
                    </div>
                )}
            </div>

            <div className="space-y-2">
                {itens.map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition-colors border border-transparent hover:border-border">
                        <button
                            onClick={() => alternarItem(item.id, !item.concluido)}
                            className={`shrink-0 transition-colors ${item.concluido ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {item.concluido ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>

                        <span className={`text-sm flex-1 transition-all ${item.concluido ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.texto}
                        </span>

                        {podeGerenciar && (
                            <Tooltip texto="Remover item">
                                <button
                                    onClick={() => removerItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                ))}
            </div>

            {podeGerenciar && (
                <form onSubmit={aoAdicionar} className="relative mt-2">
                    <input
                        type="text"
                        placeholder="Adicionar item..."
                        value={novoTexto}
                        onChange={(e) => setNovoTexto(e.target.value)}
                        className="w-full bg-background border border-input rounded-xl pl-3 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!novoTexto.trim() || enviando}
                        className="absolute right-2 top-1.5 p-1 text-primary hover:text-primary/80 disabled:opacity-0 transition-all font-sans"
                    >
                        {enviando ? <Carregando /> : <Plus className="w-4 h-4" />}
                    </button>
                </form>
            )}

            {!carregando && totalItens === 0 && !podeGerenciar && (
                <p className="text-xs text-muted-foreground italic py-2">Nenhum item no checklist.</p>
            )}
        </div>
    );
}
