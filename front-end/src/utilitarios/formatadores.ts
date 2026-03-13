import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data e hora para exibição completa.
 * @param {string | Date} data ISO 8601 com Z ou objeto Date
 * @returns {string} 05/03/25 às 14:30
 */
export function formatarDataHora(data: string | Date): string {
    const d = typeof data === 'string' ? new Date(data) : data;
    return format(d, "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}


/**
 * Retorna o tempo decorrido desde a data informada.
 * @param {string | Date} data ISO 8601 com Z ou objeto Date
 * @returns {string} há 5 minutos | há 2 horas
 */
export function formatarTempoAtras(data: string | Date): string {
    const d = typeof data === 'string' ? new Date(data) : data;
    return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

/**
 * Converte valor numérico em minutos para horas decimais.
 * @param {number} minutos Ex: 125
 * @returns {string} 2h 5min
 */
export function formatarHoras(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;

    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;

    return `${h}h ${m}min`;
}

/**
 * Formata a descrição de um evento do histórico de tarefa.
 */
export function formatarEventoHistorico(campo: string, anterior: string, novo: string): string {
    const labels: Record<string, Record<string, string>> = {
        status: {
            a_fazer: 'A Fazer',
            em_andamento: 'Em Andamento',
            em_revisao: 'Em Revisão',
            testando: 'Testando',
            concluido: 'Concluído'
        },
        prioridade: {
            urgente: 'Urgente',
            alta: 'Alta',
            media: 'Média',
            baixa: 'Baixa'
        }
    };

    const nomesCampos: Record<string, string> = {
        status: 'o status',
        prioridade: 'a prioridade',
        titulo: 'o título',
        descricao: 'a descrição',
        responsavel: 'o responsável'
    };

    const campoAmigavel = nomesCampos[campo] || campo;
    const labelAnterior = labels[campo]?.[anterior] ?? anterior;
    const labelNovo = labels[campo]?.[novo] ?? novo;

    if (!anterior || anterior === 'null') {
        return `definiu ${campoAmigavel} como "${labelNovo}"`;
    }

    return `alterou ${campoAmigavel} de "${labelAnterior}" para "${labelNovo}"`;
}
