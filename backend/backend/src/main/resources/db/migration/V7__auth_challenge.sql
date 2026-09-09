-- V7 — Generaliza o desafio de segundo fator para além do admin.
--
-- A V6 criou `admin_challenge` para as duas ações sensíveis do admin. A
-- recuperação de senha precisa exatamente do mesmo mecanismo — código de 6
-- dígitos, prazo, teto de tentativas, uso único — só que para qualquer usuário.
--
-- Duplicar a tabela e a lógica seria pior que renomear: a parte delicada
-- (comparação em tempo constante, queimar o desafio no limite de tentativas,
-- consumir de uma vez só) passaria a existir em duas cópias, livres para
-- divergir. Um bug corrigido numa e esquecido na outra é o modo de falha
-- clássico desse tipo de duplicação.
--
-- Só o nome muda. Estrutura, índice e chave estrangeira seguem iguais, e a
-- coluna `purpose` — que já distinguia LOGIN de PASSWORD_CHANGE — passa a
-- distinguir também PASSWORD_RESET.
alter table admin_challenge rename to auth_challenge;

alter index idx_admin_challenge_lookup rename to idx_auth_challenge_lookup;

-- As constraints herdam o nome antigo no rename da tabela. Renomeadas junto para
-- que um erro de integridade em produção cite um objeto que ainda existe com
-- esse nome no código e nas migrations.
alter table auth_challenge rename constraint pk_admin_challenge to pk_auth_challenge;
alter table auth_challenge rename constraint fk_admin_challenge_user to fk_auth_challenge_user;
