-- Migration 001 - Tabelas Base (Criação Inicial)

-- Tabela Usuários
CREATE TABLE usuarios (
  id TEXT NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'MEMBRO', -- LIDER_EQUIPE, LIDER_GRUPO, ADMIN, VISITANTE
  ativo INTEGER NOT NULL DEFAULT 1, -- boolean SQLite: 0 falso, 1 verdadeiro
  foto_perfil TEXT,
  bio TEXT,
  criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Demais tabelas como Sprints, Tarefas, Logs etc viriam em sequencia 
-- conforme o desenho completo da Etapa 4 de migrations ou Etapas de Módulos (Workflow 16).
