import { z } from "zod";

export const esquemaPerfil = z.object({
    bio: z
        .string()
        .max(300, "A biografia pode ter no máximo 300 caracteres")
        .optional(),

    /**
     * Aceita URL válida, string vazia (campo limpo) ou undefined.
     * String vazia é normalizada para null/undefined antes de enviar à API.
     */
    foto_perfil: z
        .string()
        .refine(
            (v) => v === '' || /^https?:\/\/.+/.test(v),
            { message: "Insira uma URL válida para a foto (http/https)" }
        )
        .optional(),
});

export type DadosFormularioPerfil = z.infer<typeof esquemaPerfil>;