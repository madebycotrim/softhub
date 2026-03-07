import { z } from "zod";

export const esquemaRetrospectiva = z.object({
    o_que_foi_bem: z.string().optional(),
    o_que_melhorar: z.string().optional(),
    acoes_proxima_sprint: z.string().optional(),
});

export type DadosFormularioRetrospectiva = z.infer<typeof esquemaRetrospectiva>;
