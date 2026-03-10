-- Migração 003: Suporte a Múltiplas Equipes por Membro
-- Move o vínculo de equipe/grupo da tabela usuarios para uma tabela de junção

-- 1. Cria a nova tabela de vínculos
CREATE TABLE IF NOT EXISTS usuarios_organizacao (
    id TEXT NOT NULL PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    equipe_id TEXT NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    grupo_id TEXT REFERENCES grupos(id) ON DELETE SET NULL,
    criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(usuario_id, equipe_id, grupo_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_org_usuario ON usuarios_organizacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_org_equipe ON usuarios_organizacao(equipe_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_org_grupo ON usuarios_organizacao(grupo_id);

-- 2. Migra os dados existentes da tabela usuarios (apenas se houver equipe_id)
INSERT OR IGNORE INTO usuarios_organizacao (id, usuario_id, equipe_id, grupo_id)
SELECT 
    lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || lower(hex(randomblob(2))) || '-8' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
    id, 
    equipe_id, 
    grupo_id
FROM usuarios 
WHERE equipe_id IS NOT NULL;

-- 3. Nota: Não removeremos as colunas equipe_id e grupo_id de 'usuarios' imediatamente 
-- para garantir compatibilidade com código legado durante a transição, 
-- mas elas devem ser consideradas DEPRECATED.
