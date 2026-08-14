-- V3 — perfil profissional coletado no onboarding.
--
-- Colunas em `users` e não tabela à parte: são quatro campos opcionais, 1:1 com
-- o usuário e sem ciclo de vida próprio. Uma entidade e um JOIN a mais não se
-- pagariam aqui.
--
-- Todas nullable, inclusive para quem já está cadastrado: o perfil é opcional
-- por definição -- a tela oferece "pular por agora" -- e nenhuma das linhas
-- existentes teria valor para preencher.
--
-- Um ALTER por coluna, e não a forma condensada com vírgulas: agrupar vários
-- ADD COLUMN numa instrução só é sintaxe exclusiva do PostgreSQL, e o H2 dos
-- testes (application-test.yml) executa estas migrations de verdade.

ALTER TABLE users ADD COLUMN profession varchar(120);
ALTER TABLE users ADD COLUMN area varchar(40);
ALTER TABLE users ADD COLUMN education_level varchar(40);
ALTER TABLE users ADD COLUMN institution varchar(160);

-- Marca a passagem pelo onboarding — preenchido ou pulado. NULL distingue "ainda
-- não viu a etapa" de "viu e não quis responder".
ALTER TABLE users ADD COLUMN onboarding_completed_at timestamp(6);

-- Os CHECK espelham o que a coluna `role` já faz: o enum vive no Java, mas o
-- banco recusa valor fora da lista, então um bug de serialização não consegue
-- gravar lixo. Ampliar qualquer um dos dois enums exige migration nova -- que é
-- exatamente o ponto.
ALTER TABLE users ADD CONSTRAINT users_area_check
    CHECK (area IN ('TECNOLOGIA', 'FINANCAS', 'EDUCACAO', 'SAUDE',
                    'INDUSTRIA', 'COMERCIO_SERVICOS', 'SETOR_PUBLICO', 'OUTRA'));

ALTER TABLE users ADD CONSTRAINT users_education_level_check
    CHECK (education_level IN ('ENSINO_FUNDAMENTAL', 'ENSINO_MEDIO', 'ENSINO_TECNICO',
                               'SUPERIOR_CURSANDO', 'SUPERIOR_COMPLETO',
                               'POS_GRADUACAO', 'MESTRADO_DOUTORADO'));
