import { Octokit } from '@octokit/rest';

// Constantes via Variáveis de Ambiente
const TOKEN = import.meta.env.VITE_GITHUB_STORAGE_TOKEN;
const OWNER = import.meta.env.VITE_GITHUB_STORAGE_OWNER;

// O Octokit só é instanciado se houver token, evitando erros no build ou se o usuário esquecer
const octokit = TOKEN ? new Octokit({ auth: TOKEN }) : null;

export interface ArquivoGithub {
    name: string;
    path: string;
    sha: string;
    size: number;
    download_url: string;
}

export const githubStorage = {
    /**
     * Lista os arquivos de uma determinada pasta no repositório.
     * Padrão será a pasta "docs".
     */
    async listarDocumentos(repo: string, pasta: string = 'docs/softhub'): Promise<ArquivoGithub[]> {
        if (!octokit || !repo || !OWNER) return [];
        try {
            const response = await octokit.repos.getContent({
                owner: OWNER,
                repo,
                path: pasta,
            });
            
            // Retorna apenas se for um diretório (array de arquivos)
            if (Array.isArray(response.data)) {
                return response.data.filter((file: any) => file.type === 'file') as ArquivoGithub[];
            }
            return [];
        } catch (error: any) {
            if (error.status === 404) return []; // Pasta ainda não existe no GitHub
            console.error('[GitHub Storage] Erro ao listar:', error);
            throw new Error('Falha ao listar documentos. Verifique se o repositório existe e se o token tem permissão.');
        }
    },

    /**
     * Faz upload de um arquivo para o repositório transformando-o em Base64.
     */
    async fazerUploadDocumento(repo: string, arquivo: File, pathFolder: string = 'docs/softhub'): Promise<void> {
        if (!octokit || !repo || !OWNER) throw new Error('Github Storage não configurado no .env ou repositório não vinculado.');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(arquivo);
            reader.onload = async () => {
                const base64Data = reader.result as string;
                // FileReader retorna algo como "data:application/pdf;base64,JVBE..." 
                // A API do GitHub exige apenas o payload após a vírgula.
                const content = base64Data.split(',')[1];

                try {
                    await octokit.repos.createOrUpdateFileContents({
                        owner: OWNER,
                        repo,
                        path: `${pathFolder}/${arquivo.name}`,
                        message: `Upload de documento: ${arquivo.name} via SoftHub`,
                        content: content,
                    });
                    resolve();
                } catch (error) {
                    console.error('[GitHub Storage] Erro no upload:', error);
                    reject(new Error('Falha ao fazer upload para o GitHub. Verifique as permissões.'));
                }
            };
            reader.onerror = () => reject(new Error('Falha ao processar arquivo localmente.'));
        });
    },

    /**
     * Deleta um arquivo específico do repositório baseado no SHA dele.
     */
    async deletarDocumento(repo: string, path: string, sha: string): Promise<void> {
        if (!octokit || !repo || !OWNER) throw new Error('Github Storage não configurado');
        try {
            await octokit.repos.deleteFile({
                owner: OWNER,
                repo,
                path,
                message: `Remoção do documento ${path.split('/').pop()} via SoftHub`,
                sha
            });
        } catch (error) {
            console.error('[GitHub Storage] Erro ao deletar:', error);
            throw new Error('Falha ao deletar arquivo do GitHub.');
        }
    }
};
