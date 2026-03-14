import { memo } from 'react';
import { ConfirmacaoExclusao } from '@/compartilhado/componentes/ConfirmacaoExclusao';
import { FormularioJustificativa } from './FormularioJustificativa';
import type { JustificativaPonto } from '@/funcionalidades/ponto/hooks/usarJustificativa';

interface ModaisPontoProps {
    modalJustificativaAberto: boolean;
    onFecharModalJustificativa: (b: boolean) => void;
    justificativaEditando: JustificativaPonto | null;
    onSalvarJustificativa: (dados: any) => Promise<void>;
    idExcluindo: string | null;
    onFecharConfirmacaoExclusao: (id: string | null) => void;
    onConfirmarExclusao: () => Promise<void>;
}

export const ModaisPonto = memo(({
    modalJustificativaAberto,
    onFecharModalJustificativa,
    justificativaEditando,
    onSalvarJustificativa,
    idExcluindo,
    onFecharConfirmacaoExclusao,
    onConfirmarExclusao
}: ModaisPontoProps) => {
    return (
        <>
            <FormularioJustificativa
                aberto={modalJustificativaAberto}
                aoFechar={onFecharModalJustificativa}
                justificativaAtual={justificativaEditando}
                aoSalvar={onSalvarJustificativa}
            />

            <ConfirmacaoExclusao
                aberto={!!idExcluindo}
                aoFechar={() => onFecharConfirmacaoExclusao(null)}
                aoConfirmar={onConfirmarExclusao}
                titulo="Excluir justificativa?"
                descricao="Apenas justificativas pendentes podem ser excluídas. Esta ação não poderá ser desfeita."
            />
        </>
    );
});
