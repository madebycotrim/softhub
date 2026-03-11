export const COLUNAS_KANBAN = [
    'todo',
    'in_progress',
    'em_revisao',
    'concluida',
] as const;

export type ColunaKanban = typeof COLUNAS_KANBAN[number];

export const CORES_PRIORIDADE = {
    urgente: 'vermelho',
    alta: 'amarelo',
    media: 'amarelo',
    baixa: 'verde',
} as const;

export const LABELS_PRIORIDADE = {
    urgente: 'Urgente',
    alta: 'Alta',
    media: 'Média',
    baixa: 'Baixa',
} as const;

export const LABELS_STATUS = {
    backlog: 'Backlog',
    todo: 'À Fazer',
    in_progress: 'Em Andamento',
    em_revisao: 'Em Revisão',
    concluida: 'Concluída',
} as const;

export const GRAFICO_COR_PRIMARIA = '#2563EB';

export const GRAFICO_COR_SUCESSO = '#10B981';
export const GRAFICO_COR_ALERTA = '#F59E0B';
export const GRAFICO_COR_PERIGO = '#EF4444';

// ID do Projeto Principal (Referência Global)
// Removendo mocks como 'p1' e usando UUID conforme Regra 6
export const PROJETO_PADRAO_ID = 'd62657e4-230b-4680-a292-06b291d2f62b';
