-- V4 — Fila de envio de e-mail (padrão outbox).
--
-- Antes, o cadastro enviava o e-mail na própria thread da requisição: o usuário
-- era salvo e, na linha seguinte, o SMTP era chamado. Isso trazia três problemas:
--
--   1. Falha no envio virava 500 DEPOIS do usuário já existir no banco. Tentar
--      cadastrar de novo dava "e-mail já cadastrado", e a tela de verificação só
--      é alcançável pela navegação do cadastro bem-sucedido -- conta criada, não
--      verificada, sem caminho de volta pela interface.
--   2. Nenhum retry. Uma falha transitória do SMTP e o código nunca chegava.
--   3. A resposta do cadastro só saía depois do handshake SMTP inteiro.
--
-- A tabela guarda a INTENÇÃO de enviar, não o conteúdo: o código de verificação
-- continua vivendo só em users.verification_code e é lido na hora do envio. Isso
-- evita duplicar um segredo em duas tabelas e faz a fila se autocorrigir -- se o
-- usuário pedir reenvio antes do drain rodar, sai o código vigente, não o antigo.
--
-- Instância única e um scheduler só drenando: não há disputa entre consumidores,
-- então a tabela não precisa de lock nem de coluna de posse.

create table email_outbox (
    id                uuid         not null,
    recipient         varchar(320) not null,
    email_type        varchar(40)  not null,
    status            varchar(20)  not null,
    attempts          integer      not null default 0,
    next_attempt_at   timestamp(6) not null,
    last_error        varchar(500),
    created_at        timestamp(6) not null,
    completed_at      timestamp(6),
    primary key (id)
);

-- Índice do drain: "pendentes cujo horário já chegou, mais antigos primeiro".
-- Sem ele o scheduler varreria a tabela inteira a cada 10 segundos.
create index idx_email_outbox_drain
    on email_outbox (status, next_attempt_at);

-- Índice do expurgo diário, que apaga por data de conclusão.
create index idx_email_outbox_completed
    on email_outbox (completed_at);
