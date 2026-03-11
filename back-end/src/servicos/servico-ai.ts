/**
 * Serviço de IA - Utiliza Cloudflare Workers AI (10k neurônios/dia grátis)
 * Modelos recomendados: @cf/meta/llama-3.1-8b-instruct ou @cf/mistral/mistral-7b-instruct-v0.1
 */

interface RespostaIA {
    conteudo: string;
    json?: any;
}

/**
 * Função genérica para chamar o modelo de chat da IA
 */
async function chamarIA(ai: any, prompt: string, sistema?: string): Promise<RespostaIA> {
    const model = '@cf/meta/llama-3.1-8b-instruct';
    
    try {
        const response = await ai.run(model, {
            messages: [
                { role: 'system', content: sistema || 'Você é um assistente útil e conciso.' },
                { role: 'user', content: prompt }
            ]
        });

        const conteudo = response.response || '';
        
        // Tenta extrair JSON se o prompt pedir
        let json = null;
        if (conteudo.includes('{')) {
            try {
                const match = conteudo.match(/\{[\s\S]*\}/);
                if (match) json = JSON.parse(match[0]);
            } catch (e) {
                console.warn('[AI] Falha ao parsear JSON da resposta:', e);
            }
        }

        return { conteudo, json };
    } catch (error: any) {
        console.error('[AI] Erro ao chamar Workers AI:', error.message);
        throw new Error('Falha na comunicação com a IA.');
    }
}

/**
 * 1. Resumo automático de tarefas
 */
export async function resumirTarefa(ai: any, titulo: string, descricao: string) {
    const prompt = `Gere um título curto e profissional (máximo 40 caracteres) para uma tarefa. 
    Contexto: Título original "${titulo}", Descrição: "${descricao}". 
    Responda APENAS o título curto, sem aspas ou explicações.`;
    
    const res = await chamarIA(ai, prompt, 'Você é um gerente de projetos focado em concisão em Português Brasileiro.');
    return res.conteudo.trim();
}

/**
 * 2. Classificação de prioridade
 */
export async function sugerirPrioridade(ai: any, texto: string) {
    const prompt = `Analise o texto da tarefa e sugira uma prioridade entre: baixa, media, alta, urgente.
    Texto: "${texto}"
    Responda em formato JSON: {"prioridade": "...", "justificativa": "..."}`;
    
    const res = await chamarIA(ai, prompt, 'Você é um algoritmo de classificação de urgência.');
    return res.json || { prioridade: 'baixa', justificativa: 'Não foi possível analisar.' };
}

/**
 * 3. Justificativa de ponto inteligente
 */
export async function analisarJustificativa(ai: any, motivo: string) {
    const prompt = `Como gestor, analise esta justificativa de falta/atraso: "${motivo}".
    Avalie se o motivo parece plausível e profissional. 
    Responda em JSON: {"sugestao": "aprovar" | "rejeitar" | "analisar_mais", "analise": "texto curto do porquê"}`;

    const res = await callingIA(ai, prompt, 'Você é um gestor de RH compreensivo porém rigoroso no Brasil.');
    return res.json;
}

// Pequeno typo na chamada acima detectado durante criação, corrigindo...
async function callingIA(ai: any, prompt: string, sistema?: string) { return chamarIA(ai, prompt, sistema); }

/**
 * 4. Geração de avisos profissionais
 */
export async function formatarAviso(ai: any, rascunho: string) {
    const prompt = `Transforme este rascunho informal em um aviso corporativo profissional para o mural da empresa.
    Rascunho: "${rascunho}"
    Responda em JSON: {"titulo": "Título impactante", "conteudo": "Texto refinado em MD"}`;

    const res = await callingIA(ai, prompt, 'Você é um redator de comunicação interna profissional em Português Brasileiro.');
    return res.json;
}
