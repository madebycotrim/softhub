import { D1Database, KVNamespace } from '@cloudflare/workers-types';

/**
 * Interface para os bindings do ambiente necessários.
 */
interface EnvConfig {
    DB: any;
    softhub_kv?: any;
}

/**
 * Busca uma configuração do sistema com cache no KV.
 * Tenta buscar no KV primeiro, se não encontrar busca no D1 e salva no KV com TTL de 1 hora.
 * @param env Bindings do ambiente (DB e KV).
 * @param chave Chave da configuração.
 * @returns O valor da configuração convertido (JSON parse ou string pura).
 */
export async function obterConfiguracao(env: EnvConfig, chave: string): Promise<any> {
    const { DB, softhub_kv } = env;

    try {
        // 1. Tenta buscar no KV
        let valor = await softhub_kv?.get(chave);

        // 2. Se não estiver no KV, busca no D1
        if (valor === null || valor === undefined) {
            const row = await DB.prepare('SELECT valor FROM configuracoes_sistema WHERE chave = ?').bind(chave).first() as any;
            
            if (row) {
                valor = row.valor;
                // 3. Salva no KV para futuras requisições (TTL 1 hora)
                if (softhub_kv) {
                    await softhub_kv.put(chave, valor, { expirationTtl: 3600 });
                }
            }
        }

        // 4. Se encontrou, tenta fazer parse de JSON
        if (valor) {
            try {
                // Remove aspas extras que o D1/JSON.stringify podem ter colocado se for uma string simples
                if (valor.startsWith('"') && valor.endsWith('"')) {
                    return JSON.parse(valor);
                }
                return JSON.parse(valor);
            } catch {
                return valor;
            }
        }

        return null;
    } catch (e) {
        console.error(`[CONFIG] Erro ao obter configuração "${chave}":`, e);
        return null;
    }
}
