-- V8 — Denylist de tokens revogados (jti), para o logout valer de verdade.
--
-- O JWT é stateless: o servidor não guarda sessão, então "sair" apagava só o
-- cookie no navegador. O token em si continuava assinado, dentro da validade e
-- aceito por qualquer requisição que o apresentasse — por até 24 h depois do
-- logout. Quem tivesse uma cópia (dispositivo compartilhado, backup do
-- navegador, captura em trânsito) seguia autenticado, e a ação que o usuário
-- toma justamente para encerrar o acesso não encerrava nada.
--
-- A V5 já resolveu o caso da TROCA DE SENHA, comparando o `iat` do token com
-- users.password_changed_at. Mas aquilo derruba TODAS as sessões da conta de
-- uma vez, o que é certo para troca de senha e errado para logout: sair em um
-- aparelho não deve desconectar os outros. Por isso a granularidade aqui é o
-- token individual, identificado pelo `jti` que o JwtService já emitia — e que
-- até agora nada consultava.
--
-- POR QUE EM TABELA E NÃO EM MEMÓRIA. Uma denylist em memória se esvazia a cada
-- restart, e no Render isso acontece em todo deploy e em todo despertar após
-- ociosidade. Cada restart ressuscitaria todos os tokens revogados que ainda
-- não tivessem expirado, o que esvazia a correção na prática.
--
-- expires_at existe para o expurgo: depois que o token expira por conta própria,
-- a linha não tem mais função — a validação de `exp` já o recusa. O expurgo
-- diário mantém a tabela do tamanho do volume de logouts de um dia.

create table revoked_token (
    jti        varchar(64)  not null,
    expires_at timestamp(6) not null,
    revoked_at timestamp(6) not null,
    constraint pk_revoked_token primary key (jti)
);

-- O expurgo varre por expires_at; a PK não ajuda nessa busca.
create index idx_revoked_token_expires_at on revoked_token (expires_at);
