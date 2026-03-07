import { Emblema } from '../../compartilhado/componentes/Emblema';
import type { Tarefa } from '../kanban/usarKanban';
import { GripVertical } from 'lucide-react';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ListaBacklogProps {
    tarefas: Tarefa[];
}

/**
 * Exibe tarefas que ainda não estão em nenhuma sprint.
 */
export function ListaBacklog({ tarefas }: ListaBacklogProps) {

    if (tarefas.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
                <p className="text-muted-foreground">Backlog vazio.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
                <TableHeader className="bg-muted/50 transition-colors">
                    <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-12 text-center"></TableHead>
                        <TableHead className="text-muted-foreground">Título</TableHead>
                        <TableHead className="w-24 text-center text-muted-foreground">Pontos</TableHead>
                        <TableHead className="w-32 text-center text-muted-foreground">Prioridade</TableHead>
                        <TableHead className="w-40 text-right text-muted-foreground">Responsáveis</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tarefas.map(tarefa => (
                        <TableRow
                            key={tarefa.id}
                            className="border-border hover:bg-muted transition-colors cursor-grab active:cursor-grabbing group"
                        >
                            <TableCell className="text-center align-middle">
                                <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground mx-auto transition-colors" />
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                                {tarefa.titulo}
                            </TableCell>
                            <TableCell className="text-center">
                                {tarefa.pontos !== null ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-secondary rounded-full text-xs font-medium text-secondary-foreground">
                                        {tarefa.pontos}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                <Emblema
                                    texto={tarefa.prioridade}
                                    variante={
                                        tarefa.prioridade === 'urgente' ? 'vermelho' :
                                            tarefa.prioridade === 'alta' ? 'amarelo' :
                                                tarefa.prioridade === 'media' ? 'azul' : 'verde'
                                    }
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                {tarefa.responsaveis.length > 0 ? (
                                    <div className="flex -space-x-2 justify-end">
                                        {tarefa.responsaveis.slice(0, 3).map(r => (
                                            <Avatar key={r.id} nome={r.nome} fotoPerfil={r.foto} tamanho="sm" />
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-xs">Não atribuído</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
