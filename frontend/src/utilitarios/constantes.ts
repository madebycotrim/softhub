export const COLUNAS_KANBAN = [
    'backlog',
    'a_fazer',
    'em_andamento',
    'em_revisao',
    'concluido',
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

export const GRAFICO_COR_PRIMARIA = '#2563EB';
export const GRAFICO_COR_SUCESSO = '#10B981';
export const GRAFICO_COR_ALERTA = '#F59E0B';
export const GRAFICO_COR_PERIGO = '#EF4444';
