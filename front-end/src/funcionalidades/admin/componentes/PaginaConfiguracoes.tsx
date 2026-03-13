import { useState, useMemo, memo } from 'react';
import { usarConfiguracoes } from '@/funcionalidades/admin/hooks/usarConfiguracoes';
import { Carregando } from '@/compartilhado/componentes/Carregando';
import { usarPermissaoAcesso } from '@/compartilhado/hooks/usarPermissao';
import { usarAutenticacao } from '@/contexto/ContextoAutenticacao';
import { Settings2 } from 'lucide-react';
import { CabecalhoFuncionalidade } from '@/compartilhado/componentes/CabecalhoFuncionalidade';
import { Alerta } from '@/compartilhado/componentes/Alerta';

import { SecaoSistema } from './configuracoes/SecaoSistema';
import { SecaoGovernanca } from './configuracoes/SecaoGovernanca';
import { SecaoRedePonto } from './configuracoes/SecaoRedePonto';
import { SecaoJornada } from './configuracoes/SecaoJornada';
import { SecaoCargos } from './configuracoes/SecaoCargos';
import { SecaoDados } from './configuracoes/SecaoDados';
import { SecaoMatrizAcesso } from './configuracoes/SecaoMatrizAcesso';

/**
 * Página de Configurações & Governança.
 * Arquitetada em módulos para otimização de renderização e manutenção.
 */
export const PaginaConfiguracoes = memo(() => {
    const { configuracoes, carregando, erro, atualizarConfiguracao, renomearCargo } = usarConfiguracoes();
    const { usuario } = usarAutenticacao();
    const podeEditar = usarPermissaoAcesso('configuracoes:editar');
    const temAcessoCritico = usarPermissaoAcesso('configuracoes:matriz_governanca');
    const isAdmin = usuario?.role === 'ADMIN';

    const [erroLocal, setErroLocal] = useState<string | null>(null);

    /** Lista de roles/cargos — ADMIN e TODOS sempre presentes */
    const roles = useMemo(() => {
        const baseRoles = configuracoes?.permissoes_roles ? Object.keys(configuracoes.permissoes_roles) : [];
        return Array.from(new Set(['ADMIN', 'TODOS', ...baseRoles]));
    }, [configuracoes]);

    /** Roles exibidos na matriz (ADMIN oculto — acesso total por padrão) */
    const rolesMatriz = useMemo(() => roles.filter(r => r !== 'ADMIN'), [roles]);

    const mostrarErroTemporario = (mensagem: string) => {
        setErroLocal(mensagem);
        setTimeout(() => setErroLocal(null), 5000);
    };

    if (carregando) return <Carregando />;
    if (erro) return <div className="p-10 flex justify-center"><Alerta tipo="erro" mensagem={erro} /></div>;

    return (
        <div className="w-full animar-entrada pb-10 relative">
            <CabecalhoFuncionalidade
                titulo="Configurações"
                subtitulo="Governança, Permissões e Hierarquia do SoftHub"
                icone={Settings2}
            />

            {/* Banner de Erro Local */}
            {erroLocal && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Alerta tipo="erro" mensagem={erroLocal} />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                    {(isAdmin || temAcessoCritico) && (
                        <>
                            <SecaoSistema 
                                configuracoes={configuracoes} 
                                atualizarConfiguracao={atualizarConfiguracao} 
                            />
                            
                            <SecaoGovernanca 
                                configuracoes={configuracoes} 
                                atualizarConfiguracao={atualizarConfiguracao} 
                                podeEditar={podeEditar} 
                            />
                            
                            <SecaoRedePonto 
                                configuracoes={configuracoes} 
                                atualizarConfiguracao={atualizarConfiguracao} 
                                podeEditar={podeEditar} 
                            />
                        </>
                    )}

                    <SecaoJornada 
                        configuracoes={configuracoes} 
                        atualizarConfiguracao={atualizarConfiguracao} 
                        podeEditar={podeEditar} 
                    />

                    <SecaoCargos 
                        configuracoes={configuracoes} 
                        atualizarConfiguracao={atualizarConfiguracao} 
                        renomearCargo={renomearCargo}
                        podeEditar={podeEditar}
                        roles={roles}
                    />

                    <SecaoDados />
                </div>

                {/* Coluna Principal: Matriz de Permissões e Acesso */}
                <div className="lg:col-span-9 space-y-6">
                    <SecaoMatrizAcesso 
                        configuracoes={configuracoes} 
                        atualizarConfiguracao={atualizarConfiguracao} 
                        podeEditar={podeEditar} 
                        isAdmin={isAdmin}
                        temAcessoCritico={temAcessoCritico}
                        rolesMatriz={rolesMatriz}
                        onErroTemporario={mostrarErroTemporario}
                    />
                </div>
            </div>
        </div>
    );
});
 
export default PaginaConfiguracoes;
