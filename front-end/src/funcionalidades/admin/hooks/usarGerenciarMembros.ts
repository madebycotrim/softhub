import { useState, useCallback } from 'react';
import { api } from '@/compartilhado/servicos/api';
import { usarMembros } from '@/funcionalidades/admin/hooks/usarMembros';
import type { Membro } from '@/funcionalidades/admin/hooks/usarMembros';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { usarToast } from '@/compartilhado/hooks/usarToast';
import { pluralizar } from '@/utilitarios/formatadores';

/**
 * Hook customizado para gerenciar a lógica de administração de membros.
 */
export function usarGerenciarMembros() {
    const {
        membros,
        carregando,
        erro,
        recarregar,
        adicionarMembro,
        deletarMembro,
        atualizarMembro,
    } = usarMembros();

    const [salvandoIds, setSalvandoIds] = useState<Set<string>>(new Set());
    const { exibirToast } = usarToast();
    const { usuario: usuarioAutenticado, atualizarUsuarioLocalmente } = usarAutenticacao();

    const marcarSalvando = useCallback((id: string) => {
        setSalvandoIds(prev => new Set(prev).add(id));
    }, []);

    const desmarcarSalvando = useCallback((id: string) => {
        setSalvandoIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const alterarRole = useCallback(async (membro: Membro, roleNova: string) => {
        if (membro.role === roleNova) return;

        atualizarMembro({ ...membro, role: roleNova });
        marcarSalvando(membro.id);

        try {
            await api.patch(`/api/usuarios/${membro.id}/role`, { role: roleNova });
            exibirToast(`Cargo de ${membro.nome} atualizado.`);

            if (membro.id === usuarioAutenticado?.id) {
                atualizarUsuarioLocalmente({ ...usuarioAutenticado, role: roleNova });
            }
        } catch (e: any) {
            atualizarMembro(membro);
            exibirToast(e.response?.data?.erro ?? 'Erro ao alterar cargo.', 'erro');
        } finally {
            desmarcarSalvando(membro.id);
        }
    }, [atualizarMembro, exibirToast, marcarSalvando, desmarcarSalvando, usuarioAutenticado, atualizarUsuarioLocalmente]);

    const cadastrarMembro = useCallback(async (email: string, role: string) => {
        const res = await adicionarMembro({ email: email.toLowerCase().trim(), role });
        if (res.sucesso) {
            await recarregar();
            exibirToast(`Autorizado: ${email}`);
        } else {
            exibirToast(res.erro ?? 'Erro ao cadastrar.', 'erro');
        }
        return res;
    }, [adicionarMembro, recarregar, exibirToast]);

    const cadastrarMembroLote = useCallback(async (emails: string[], role: string) => {
        try {
            const res = await api.post('/api/usuarios/lote', { emails, role });
            const { criados, pulados, erros } = res.data;

            await recarregar();

            if (criados > 0) {
                exibirToast(`${criados} ${pluralizar(criados, 'membro autorizado', 'membros autorizados')} com sucesso.`);
            }

            if (erros.length > 0) {
                exibirToast(`${erros.length} ${pluralizar(erros.length, 'e-mail falhou', 'e-mails falharam')} na validação.`, 'erro');
            } else if (pulados > 0 && criados === 0) {
                exibirToast('Todos os e-mails já estavam cadastrados.', 'sucesso');
            }

            return { sucesso: true };
        } catch (e: any) {
            exibirToast(e.response?.data?.erro ?? 'Erro ao processar lote.', 'erro');
            return { sucesso: false };
        }
    }, [recarregar, exibirToast]);

    const removerMembro = useCallback(async (m: Membro) => {
        marcarSalvando(m.id);
        const res = await deletarMembro(m.id);
        if (res.sucesso) {
            await recarregar();
            exibirToast(`Acesso de ${m.nome} removido.`);
        } else {
            exibirToast(res.erro ?? 'Erro ao remover.', 'erro');
        }
        desmarcarSalvando(m.id);
        return res;
    }, [deletarMembro, recarregar, exibirToast, marcarSalvando, desmarcarSalvando]);

    return {
        membros,
        carregando,
        erro,
        recarregar,
        salvandoIds,
        alterarRole,
        cadastrarMembro,
        cadastrarMembroLote,
        removerMembro
    };
}
