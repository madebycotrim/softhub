-- Migração 011: Sessões de Login por QR Code
-- Permite um fluxo onde o celular autoriza o login no desktop

CREATE TABLE sessoes_qr (
  id              TEXT NOT NULL PRIMARY KEY, -- UUID da sessão
  status          TEXT NOT NULL DEFAULT 'pendente', -- pendente, autorizado, expirado, consumido
  usuario_id      TEXT REFERENCES usuarios(id), -- preenchido quando autorizado
  token_acesso    TEXT, -- JWT interno gerado após autorização
  criado_em       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  expira_em       TEXT NOT NULL, -- tempo de vida curto (ex: 2 minutos)
  ip_origem       TEXT, -- IP do desktop que gerou o QR
  user_agent      TEXT  -- Browser do desktop
);

-- Índice para limpeza automática e busca rápida
CREATE INDEX idx_sessoes_qr_status ON sessoes_qr(status);
CREATE INDEX idx_sessoes_qr_expira ON sessoes_qr(expira_em);

-- Inserir log de migração
INSERT INTO logs (id, acao, modulo, descricao)
VALUES (
  lower(hex(randomblob(16))),
  'MIGRACAO_EXECUTADA',
  'sistema',
  'Criação da tabela sessoes_qr para login via celular'
);
