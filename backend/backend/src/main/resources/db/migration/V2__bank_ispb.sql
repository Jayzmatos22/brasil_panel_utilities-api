-- V2 — ISPB passa a ser chave natural da tabela de bancos.
--
-- O ISPB (Identificador de Sistema de Pagamentos Brasileiro) é o identificador
-- único real de uma instituição: tem sempre 8 dígitos e existe para todas elas,
-- inclusive as que não possuem código de compensação COMPE. A coluna estava
-- varchar(10), anulável e sem unicidade — mapeamento que permitia ISPB repetido
-- ou ausente, e o front usa exatamente esse campo como chave de lista React.
--
-- A tabela `banks` é um espelho da BrasilAPI: não guarda nada que o usuário
-- tenha criado e é integralmente rederivável. Por isso a migração a esvazia em
-- vez de tentar consertar linhas legadas — o StaticDataSeeder a repovoa no
-- próximo startup, já respeitando o NOT NULL.

TRUNCATE TABLE banks;

ALTER TABLE banks ALTER COLUMN ispb TYPE varchar(8);
ALTER TABLE banks ALTER COLUMN ispb SET NOT NULL;

ALTER TABLE banks ADD CONSTRAINT uq_bank_ispb UNIQUE (ispb);
