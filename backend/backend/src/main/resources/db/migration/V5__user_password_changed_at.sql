-- V5 — Marca temporal da última troca de senha.
--
-- O JWT é stateless: não existe store de sessão para invalidar. Sem esta coluna,
-- trocar a senha NÃO derrubava as sessões abertas -- o token anterior seguia
-- válido até expirar (24 h). Ou seja, quem tivesse acesso indevido à conta
-- continuava dentro mesmo depois de a vítima trocar a senha, que é justamente a
-- ação que ela toma para expulsá-lo.
--
-- Com a coluna, o JwtFilter compara o `iat` do token com este instante e recusa
-- qualquer token emitido antes. Uma linha no banco substitui o store de sessão.
--
-- Anulável de propósito: NULL significa "senha nunca trocada desde o cadastro",
-- e nesse caso não há nada a invalidar. Contas existentes ficam NULL e seguem
-- funcionando normalmente.

alter table users
    add column password_changed_at timestamp(6);
