import { Context } from 'hono';

export async function lidarExcecao(erro: Error, c: Context) {
    console.error(`[EXCEÇÃO GLOBAL] ${c.req.method} ${c.req.url} - `, erro);

    // Regra: Nunca vazar stack trace!
    return c.json({
        erro: 'Erro interno no servidor.',
        // Apenas passamos a mensagem de erro original de forma genérica se for muito necessário.
        // Em Cloudflare Workers não existe process.env, dependemos de c.env injetado por bindings.
        mensagem: erro.message
    }, 500);
}
