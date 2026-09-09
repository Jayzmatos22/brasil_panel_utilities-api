-- V6 — Segundo fator por e-mail para as ações sensíveis do admin.
--
-- Senha de admin é um ponto único de falha: quem a descobre entra, promove
-- contas, dispara refresh e apaga dados. O segundo fator quebra isso — sem a
-- caixa de entrada do dono, a senha sozinha não vale login.
--
-- Só duas ações exigem confirmação: LOGIN e PASSWORD_CHANGE. As demais rotas de
-- admin seguem protegidas apenas pelo ROLE_ADMIN da sessão, que agora só existe
-- se um código foi confirmado.
--
-- Por que tabela própria e não colunas em `users`: a troca de senha precisa
-- guardar a senha nova PENDENTE até a confirmação chegar, e um desafio tem ciclo
-- de vida próprio (expira, é consumido, acumula tentativas). Enfiar isso em
-- `users` misturaria com verification_code, que é do fluxo de cadastro — dois
-- códigos no mesmo campo, um sobrescrevendo o outro, é bug garantido.
create table admin_challenge (
    id                    uuid         not null,
    user_id               uuid         not null,
    purpose               varchar(30)  not null,
    code                  varchar(6)   not null,

    -- Só em PASSWORD_CHANGE: o hash BCrypt da senha nova, retido até a
    -- confirmação. Fica aqui, e não em users, porque enquanto não confirmado
    -- ele NÃO é a senha da conta — gravar em users.password aplicaria a troca
    -- antes do segundo fator, que é exatamente o que este fluxo impede.
    pending_password_hash varchar(100),

    -- Tentativas erradas neste desafio. Estoura o limite e o desafio morre:
    -- sem isso, 6 dígitos são 10^6 tentativas para quem já tem a senha.
    attempts              integer      not null default 0,

    expires_at            timestamp(6) not null,
    consumed_at           timestamp(6),
    created_at            timestamp(6) not null,

    constraint pk_admin_challenge primary key (id),
    constraint fk_admin_challenge_user foreign key (user_id)
        references users (id) on delete cascade
);

-- A busca quente é "o desafio vigente deste usuário para esta finalidade".
create index idx_admin_challenge_lookup
    on admin_challenge (user_id, purpose, consumed_at);

-- O outbox guarda a INTENÇÃO de enviar e lê o segredo na hora do envio (ver V4).
-- Para o código de verificação isso funciona porque o destinatário É a conta:
-- basta procurar em users pelo recipient. No desafio de admin não funciona — o
-- código vai para o endereço de segurança do dono, que pode não ser o e-mail da
-- conta. Esta coluna diz de qual desafio ler o código.
alter table email_outbox
    add column reference_id uuid;
