export function CardEstatisticas() {
    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Estatísticas</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground text-sm">Tarefas Em Andamento</span>
                    <span className="font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">2</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground text-sm">Tarefas Concluídas</span>
                    <span className="font-medium bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full text-xs">45</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground text-sm">Sprints Participadas</span>
                    <span className="text-foreground font-medium">8</span>
                </div>
            </div>
        </div>
    );
}
