import { Camera, KeyRound } from 'lucide-react';
import { usarMembros } from './usarMembros';
import { Avatar } from '../../compartilhado/componentes/Avatar';
import { Carregando } from '../../compartilhado/componentes/Carregando';
import { DadosTokenId } from '../../compartilhado/componentes/DadosTokenId';
import { useEffect, useState } from 'react';
import { api } from '../../compartilhado/servicos/api';
import { usarAutenticacao } from '../autenticacao/usarAutenticacao';
import { useMsal } from '@azure/msal-react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { esquemaPerfil, type DadosFormularioPerfil } from './perfil.schema';
import { CardSobreMim } from './componentes/CardSobreMim';
import { CardEstatisticas } from './componentes/CardEstatisticas';
import { ModalEditarPerfil } from './componentes/ModalEditarPerfil';

/**
 * Exibe as informações detalhadas de um usuário específico.
 * Simula a rota de Perfil.
 */
export function PerfilMembro({ membroId }: { membroId: string }) {
    const { membros, carregando: carregandoMembros, erro: erroMembros, atualizarMembro, recarregar } = usarMembros();
    const [editando, setEditando] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const { usuario, atualizarUsuarioLocalmente } = usarAutenticacao();
    const ehODono = usuario?.id === membroId;

    const form = useForm<DadosFormularioPerfil>({
        resolver: zodResolver(esquemaPerfil),
        defaultValues: {
            bio: '',
            foto_perfil: '',
        },
    });

    const { instance } = useMsal();
    const contaAtiva = instance.getActiveAccount();

    const membro = membros.find(m => m.id === membroId);

    // Preenche o formulário quando os dados do membro estiverem disponíveis
    useEffect(() => {
        if (membro && ehODono) {
            form.reset({
                bio: membro.bio ?? '',
                foto_perfil: membro.foto_perfil ?? '',
            });
        }
        // form.reset é estável — não precisa entrar nas deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membro?.id, membro?.bio, membro?.foto_perfil, ehODono]);

    async function aoSubmeterPerfil(dados: DadosFormularioPerfil) {
        setSalvando(true);
        try {
            // Normaliza string vazia para null antes de enviar
            const payload = {
                bio: dados.bio || null,
                foto_perfil: dados.foto_perfil || null,
            };

            await api.patch('/api/usuarios/perfil', payload);

            // 1. Atualiza o contexto de autenticação
            atualizarUsuarioLocalmente({
                ...usuario!,
                foto_perfil: payload.foto_perfil || undefined,
            });

            // 2. Atualiza a lista local de membros sem reload de página
            if (membro) {
                atualizarMembro({
                    ...membro,
                    bio: payload.bio,
                    foto_perfil: payload.foto_perfil,
                });
            }

            setEditando(false);
        } catch (erro) {
            console.error('[PerfilMembro] Falha ao salvar perfil:', erro);
            // Recarrega para garantir consistência em caso de erro inesperado
            await recarregar();
        } finally {
            setSalvando(false);
        }
    }

    if (carregandoMembros) return <Carregando />;

    if (erroMembros) {
        return (
            <div className="p-12 text-center text-red-400 border border-red-900/20 bg-red-900/10 rounded-2xl shadow-sm">
                {erroMembros}
                <Button variant="link" onClick={() => recarregar()} className="block mx-auto mt-2">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    if (!membro) {
        return (
            <div className="p-12 text-center text-muted-foreground border border-border bg-muted/50 rounded-2xl shadow-sm">
                Membro não encontrado.
            </div>
        );
    }

    return (
        <div className="w-full space-y-10 pb-20 animate-in fade-in duration-500">

            {/* Header do Perfil (Capa e Avatar) */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm relative">
                <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-900 via-indigo-900 to-[#020817] w-full relative">
                    {/* Botão de alterar capa — visível para o dono do perfil */}
                    {ehODono && (
                        <button
                            aria-label="Alterar capa do perfil"
                            className="absolute top-4 right-4 p-2 bg-background/50 hover:bg-background/80 rounded-full text-foreground backdrop-blur-sm transition-colors"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="px-6 pb-6 relative sm:flex sm:items-end sm:justify-between">
                    <div className="sm:flex sm:items-center sm:gap-6 -mt-16 sm:-mt-20">
                        <div className="relative inline-block">
                            <div className="ring-4 ring-background rounded-full bg-secondary">
                                <Avatar nome={membro.nome} fotoPerfil={membro.foto_perfil} tamanho="lg" />
                            </div>
                            {ehODono && (
                                <button
                                    onClick={() => setEditando(true)}
                                    aria-label="Alterar foto de perfil"
                                    className="absolute bottom-2 right-0 p-1.5 bg-primary hover:bg-primary/90 rounded-full text-primary-foreground transition-colors border-2 border-background"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pt-16 pb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                {membro.nome}
                            </h1>
                            <p className="text-primary font-medium">
                                {membro.role.replace('_', ' ')}
                            </p>
                        </div>
                    </div>

                    {ehODono && (
                        <div className="mt-6 sm:mt-0">
                            <Button
                                variant="outline"
                                className="bg-accent border-border hover:bg-accent/80 hover:text-accent-foreground text-foreground"
                                onClick={() => setEditando(true)}
                            >
                                Editar Perfil
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Coluna Esquerda: Sobre */}
                <div className="bg-card border border-border rounded-2xl p-6 md:col-span-2 space-y-8 shadow-sm">
                    <CardSobreMim membro={membro} />

                    {/* Claims do Token (Tutorial MSAL) — visível só para o dono */}
                    {ehODono && contaAtiva && (
                        <div className="pt-8 border-t border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/20 rounded-lg">
                                    <KeyRound className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-lg font-bold text-card-foreground">
                                    Segurança e Escopos
                                </h2>
                            </div>
                            <DadosTokenId idTokenClaims={contaAtiva.idTokenClaims} />
                        </div>
                    )}
                </div>

                {/* Coluna Direita: Metadados / Resumo */}
                <div className="space-y-6 md:col-span-1">
                    <CardEstatisticas />
                </div>

            </div>

            {/* Modal de Editar Perfil */}
            <ModalEditarPerfil
                editando={editando}
                setEditando={setEditando}
                form={form}
                aoSubmeterPerfil={aoSubmeterPerfil}
                salvando={salvando}
            />
        </div>
    );
}