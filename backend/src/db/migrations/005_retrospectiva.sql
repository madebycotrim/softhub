-- Migration 005_retrospectiva
-- Documenta o fim da sprint permitindo preenchimento de lições aprendidas e melhorias
-- Apenas líderes/admins poderão alimentar essa base via Rota

CREATE TABLE IF NOT EXISTS retrospectivas (
  id                   TEXT NOT NULL PRIMARY KEY,
  sprint_id            TEXT NOT NULL UNIQUE REFERENCES sprints(id) ON DELETE CASCADE,
  o_que_foi_bem        TEXT,
  o_que_melhorar       TEXT,
  acoes_proxima_sprint TEXT,
  atualizado_em        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
