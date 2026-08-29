# Deploy — Brasil Panel

Runbook de publicação. Cobre o que precisa existir **antes** de um deploy, a ordem
correta das etapas e como verificar que subiu de verdade.

O primeiro deploy foi ao ar em 27/08/2026. As seções abaixo deixaram de ser previsão:
o que está descrito como armadilha de fato aconteceu, e a verificação da seção 8 foi
executada contra o ambiente publicado. Onde o comportamento real divergiu do
esperado, o texto registra o comportamento real — é isso que economiza tempo na
próxima vez.

| | |
|---|---|
| API | `https://brasil-panel-utilities-api.onrender.com` |
| Health | `/actuator/health` |
| Banco | Neon — PostgreSQL 18.6, região `us-east-2` |

---

## 1. Topologia

| Camada | Onde | Hiberna? |
|---|---|---|
| Frontend (build Vite estático) | Vercel ou Cloudflare Pages | Não — arquivos em CDN |
| Backend (imagem Docker) | Render | Free hiberna após ~15 min; **Starter (~US$ 7/mês) não hiberna** |
| Banco | Neon (PostgreSQL) | Free suspende, mas acorda em ~1s |

> O Postgres do plano free do Render é removido após um período. Por isso o banco
> fica no Neon, e não no próprio Render.

### Por que o frontend faz proxy da API

> **Obrigatório, não opcional.** A sessão usa cookie httpOnly. Sem o rewrite, o
> frontend e a API ficam em domínios distintos, o cookie vira terceira-parte e o
> Safari o bloqueia por padrão — o login simplesmente não funciona nesse navegador.

O frontend deve reescrever `/api/*` para o backend, em vez de chamar o domínio do
Render diretamente. Isso faz o navegador enxergar **uma única origem**, o que:

- permite cookie de sessão como primeira-parte (funciona no Safari, que bloqueia
  cookies de terceiros por padrão);
- dispensa CORS em produção;
- reduz `VITE_API_URL` a `/api`.

Exemplo (`vercel.json` na raiz do frontend):

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://SEU-APP.onrender.com/api/:path*" }
  ]
}
```

---

## 2. Criar o serviço no Render

O Render **não tem runtime Java nativo**, então o serviço é publicado como container.
O `Dockerfile` na raiz de `backend/backend/` cobre isso — build multi-estágio (Maven
para compilar, JRE 21 para executar).

Ao criar o Web Service:

| Campo | Valor |
|---|---|
| Source | Git provider → este repositório |
| **Root Directory** | `backend/backend` |
| Runtime / Language | **Docker** |
| Dockerfile Path | `./Dockerfile` (relativo ao Root Directory) |
| **Health Check Path** | `/actuator/health` |

O **Root Directory** é o campo que mais causa erro: o `pom.xml` não está na raiz do
repositório, e sem apontar para `backend/backend` o build não encontra nada para
construir.

Não é preciso definir Build Command nem Start Command — o Dockerfile os contém.

### Porta

O Render injeta `PORT` e faz o health check contra ela. O `application.yaml` usa
`${PORT:8080}`, então isso funciona sem configuração. Se a porta fosse fixa, o
serviço subiria normalmente, o Render não encontraria nada escutando onde espera, e o
deploy falharia por health check — **sem nenhum erro nos logs da aplicação**, que é o
que torna esse diagnóstico demorado.

### Tempo de boot e o falso alarme do scan de porta

Na instância **Free**, o boot completo leva **~150 segundos**. Durante quase todo esse
tempo o Render imprime, repetidamente:

```
==> No open ports detected, continuing to scan...
```

Isso **não é erro**. O Spring Boot só faz o bind da porta no final do refresh do
contexto: `Tomcat initialized with port 10000` aparece cedo e significa apenas que o
conector foi criado. Quem indica que há algo escutando é `Tomcat started on port
10000`, que vem depois de Flyway, Hibernate e Spring Security.

Some-se a isso que o streaming de log do painel do Render cai com frequência e
continua exibindo o que já tinha em cache. A combinação — log parado numa linha
qualquer, scan de porta repetindo — parece uma aplicação travada, e não é.

Para saber o estado real sem depender do log, use a aba **Events** do serviço. Ela
mostra `Deploy live` / `Deploy failed` / `In progress` independentemente do stream.

### O banco vem antes

`DATABASE_URL` é obrigatória para o boot, e o Flyway roda as migrations na primeira
subida. Provisione o Neon **antes** de criar o serviço no Render.

---

## 3. Variáveis de ambiente — backend (Render)

| Variável | Obrigatória | Observação |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **Sim** | Valor: `prod`. Ver armadilha #1 abaixo. |
| `JWT_SECRET` | **Sim** | A aplicação **não sobe** sem ela. Ver seção 4. |
| `DATABASE_URL` | **Sim** | Connection string do Neon |
| `DATABASE_USERNAME` | **Sim** | |
| `DATABASE_PASSWORD` | **Sim** | |
| `COOKIE_SECURE` | **Sim** | Valor: `true`. Faz o cookie de sessão exigir HTTPS. O default é `false` (necessário em dev sobre `http://localhost`). |
| `CORS_ALLOWED_ORIGINS` | **Sim** | Domínio do frontend. O default é `http://localhost:5173` — em produção o front seria bloqueado. Irrelevante se o rewrite estiver ativo, mas mantenha correto. |
| `ALPHA_KEYS` | Sim | Chaves AlphaVantage, separadas por vírgula |
| `METALS_KEY` | Sim | Chave Metals.dev |
| `MAIL_HOST` | **Sim** | Servidor SMTP. **Sem ela a aplicação não sobe** — ver armadilha #3 |
| `MAIL_USERNAME` | **Sim** | Conta SMTP |
| `MAIL_PASSWORD` | **Sim** | Senha de app (não a senha de login da conta) |
| `MAIL_PORT` | **Sim, no Render** | Use **`2587`**. O default do código é `587`, que o Render **bloqueia na saída** — ver armadilha #4. |
| `MAIL_FROM_ADDRESS` | **Sim** | Endereço do **domínio verificado** no provedor. O default (`onboarding@resend.dev`) é o remetente de sandbox do Resend, que só entrega para o e-mail da própria conta — com ele, nenhum usuário real recebe o código. Ver seção 9. |
| `MAIL_FROM_NAME` | Conforme uso | |
| `RATE_LIMIT_EMAILS_PER_HOUR` | Não | Default `5`. Teto por cliente em `/auth/register` e `/auth/resend-code`. |
| `RATE_LIMIT_EMAILS_GLOBAL` | Não | Default `80`. Teto da instância inteira, **por dia**, nas mesmas rotas. Dimensionado sob o limite de 100/dia do plano gratuito do Resend. |
| `CMC_API_KEY` | Não | Chave CoinMarketCap. Sem ela a fonte fica desligada e o painel roda só com o CoinGecko — de propósito, para a aplicação subir sem a chave. |
| `ADMIN_EMAIL` | Recomendada | Default `admin@brasilpanel.com`. É **credencial de login**, não endereço de envio: nada é enviado para ele, e a conta é criada já com `verified = true`. |
| `ADMIN_PASSWORD` | **Sim, na prática** | Sem ela o admin **não é criado** e `/api/admin/**` fica inalcançável — ninguém consegue autenticar como ADMIN. Ver armadilha #6. |

### Frontend (Vercel / Cloudflare)

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `/api` (com o rewrite configurado) |

Sem essa variável, o build de produção usa o fallback `http://localhost:8080/api`
— ou seja, o site publicado tenta falar com o **localhost do visitante**.

---

## 4. JWT_SECRET

Gere com um RNG criptográfico. **Não** use `Get-Random`: ele é um PRNG semeado pelo
relógio, e toda a saída fica determinada por uma semente de 32 bits.

```powershell
$b = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
[Convert]::ToBase64String($b)
```

Regras:

- Mínimo de 32 bytes (HS256). Abaixo disso a aplicação falha com `WeakKeyException`.
- Use um valor **diferente** do usado em desenvolvimento.
- Trocar o secret invalida todos os JWTs emitidos: todos os usuários são deslogados.

O valor de desenvolvimento fica em `application-dev.yml`, que é gitignored.

---

## 5. Armadilhas que impedem o boot

### #1 — O perfil ativo está fixo em `dev`

`application.yaml` declara `spring.profiles.active: dev`. Sem
`SPRING_PROFILES_ACTIVE=prod` no ambiente, a produção sobe com o perfil de
desenvolvimento: aponta para `localhost:5432` e habilita o Swagger. A variável de
ambiente tem precedência e resolve — mas não há aviso se for esquecida.

### #2 — Schema: quem cria é o Flyway

> Esta seção descrevia um primeiro boot com `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
> e DDL aplicado à mão a cada alteração de entidade. **Não faça mais isso** — o
> schema passou a ser versionado.

`application-prod.yml` mantém `ddl-auto: validate`: o Hibernate nunca cria nem altera
o schema. Quem cria é o Flyway, a partir dos scripts em
`src/main/resources/db/migration/`.

**Banco novo (vazio):** nada a fazer. O Flyway roda a `V1__baseline.sql` no primeiro
boot e as demais em sequência, e o `validate` do Hibernate passa em seguida. Sem env
var temporária, sem passo manual. Foi o que aconteceu no Neon: as cinco migrations
aplicaram-se sozinhas no primeiro boot, e as 21 tabelas resultantes correspondem
exatamente às 21 entidades JPA.

**Banco que já existe** com tabelas criadas fora do Flyway: `baseline-on-migrate:
true` faz o Flyway apenas **registrar** a V1 como aplicada, sem executá-la. Nenhum
DDL roda sobre os dados existentes.

**Alteração de entidade daqui em diante:** escreva a migration correspondente
(`V6__descricao.sql`, `V7__…`) no mesmo commit. O CI executa as migrations em H2
limpo e valida contra as entidades, então o desencontro aparece no pull request —
não no deploy.

> **Nota de compatibilidade.** O Neon roda PostgreSQL **18.6** e o Flyway 11.7.2 só
> foi testado até o 17, então todo boot registra um `WARN` de versão não suportada.
> As migrations aplicam normalmente — para DDL comum (`create table`, `alter table
> add column`) não há divergência. Vale subir a versão do Flyway numa passada de
> manutenção; não é bloqueante.

### #3 — SMTP obrigatório

O `EmailService` recebe um `JavaMailSender` por construtor, e a auto-configuração
do Spring Boot só cria esse bean quando `spring.mail.host` existe. Sem `MAIL_HOST`,
`MAIL_USERNAME` e `MAIL_PASSWORD` no ambiente, a aplicação **falha ao subir** — na
injeção de dependência, antes de atender qualquer requisição.

### #4 — O Render bloqueia SMTP na porta 587

O Render descarta tráfego de saída nas portas clássicas de SMTP. O sintoma no log:

```
MailConnectException: Couldn't connect to host, port: smtp.resend.com, 587; timeout 5000
Caused by: java.net.SocketTimeoutException: Connect timed out
```

Repare no tipo do erro. **Timeout, não `Connection refused`** — conexão recusada seria
o servidor respondendo "não"; timeout é pacote sumindo no caminho, que é assinatura de
firewall descartando em silêncio. Erro de credencial também seria outro: viria uma
resposta SMTP `535`, não um estouro de socket.

A solução é a porta alternativa do Resend: **`MAIL_PORT=2587`**. É a mesma 587 com
STARTTLS, apenas num número fora do bloqueio. Não exige mudança de código —
`application-prod.yml` já lê `${MAIL_PORT:587}`.

Se um dia o `2587` também for bloqueado, a saída é trocar SMTP pela **API HTTP do
Resend** (porta 443, que nenhum provedor bloqueia). Isso exige código: substituir o
`JavaMailSender` por um cliente HTTP no `EmailService`.

### #5 — `28P01` não significa "senha errada"

O erro que mais custou tempo no primeiro deploy:

```
FlywaySqlException: Unable to obtain connection from database:
ERROR: password authentication failed for user 'neondb_owner'
SQL State : 28P01
```

A mensagem é enganosa: o PostgreSQL responde **exatamente a mesma coisa** para senha
incorreta e para **usuário inexistente**. Não existe distinção no protocolo — é
proposital, para não revelar quais usuários existem. Então `28P01` significa apenas
"a autenticação falhou", e o nome no texto é só o que o cliente enviou, não uma
confirmação de que o usuário existe.

O que o `28P01` **prova** é que rede, DNS e TLS funcionaram: a conexão chegou ao
servidor e foi rejeitada na autenticação. Host, porta e SNI estão certos.

Como montar as credenciais sem errar: no painel do Neon, troque o formato de
**"Connection string"** para **"Parameters only"**. Ele exibe host, banco, usuário e
senha em campos separados, cada um com botão de copiar — elimina o recorte manual da
string, que é onde os campos se trocam.

Três detalhes que quebram silenciosamente:

- **`channel_binding` não existe no JDBC.** É parâmetro do libpq (psql, drivers em
  C/Python/Node). O driver Java ignora. Na `DATABASE_URL` vai só `?sslmode=require`.
- **Nada de credencial embutida na URL.** `jdbc:postgresql://user:senha@host/...`
  briga com `DATABASE_USERNAME` e `DATABASE_PASSWORD`.
- **O banco default do Neon chama-se `neondb`.** A connection string vem com ele a
  menos que você troque no seletor de Database. Colar sem reparar leva o nome errado
  para `DATABASE_URL` — ou, pior, para o campo de usuário.

Um detalhe que ajuda a isolar: **nome de banco errado dá `3D000`** ("database does
not exist"), não `28P01`. Se o erro é `28P01`, o banco foi encontrado.

> Testar a credencial com `psql` da máquina local pode não ser conclusivo: os
> endpoints do Neon respondem em IPv6, e uma rede sem rota IPv6 devolve
> `Network unreachable` — que não diz nada sobre a senha.

### #6 — Sem `ADMIN_PASSWORD` não existe admin

O `AdminSeeder` desiste em silêncio (apenas um `WARN`) quando a senha está vazia:

```
AdminSeeder: ADMIN_PASSWORD não configurada — admin NÃO foi criado.
```

A aplicação sobe normalmente, e só quando alguém tenta usar `/api/admin/**` o
problema aparece — não há usuário com `ROLE_ADMIN` para autenticar.

**O seeder só cria; nunca atualiza.** Ele verifica `findByEmail(...).isPresent()` e
pula se a conta já existir. Duas consequências:

- Trocar `ADMIN_PASSWORD` depois **não redefine** a senha do admin existente.
- Trocar `ADMIN_EMAIL` depois **cria um segundo admin** em vez de renomear o primeiro.

E como não há recuperação de senha por e-mail em nenhum fluxo do projeto, perder a
senha do admin exige intervenção no banco: apagar a linha para o seeder recriar no
próximo boot, ou gravar um hash BCrypt novo à mão.

### #7 — Health check acoplado a serviço externo derruba a aplicação

O Spring Boot autoconfigura um `MailHealthIndicator` que **abre uma conexão SMTP real
a cada checagem** de `/actuator/health`. Como a plataforma usa esse endpoint para
decidir se a instância está viva, um SMTP lento ou bloqueado devolvia `DOWN` e o
serviço nunca entrava em serviço — com banco, cache e todos os endpoints operando
normalmente.

`application.yaml` desliga esse indicador (`management.health.mail.enabled: false`).
O envio aqui é assíncrono: a mensagem vai para o outbox e é drenada pelo scheduler,
então indisponibilidade do provedor atrasa e-mails, não impede a API de atender.

A regra geral, ao adicionar qualquer health indicator daqui em diante: **o health
check só deve refletir o que torna a aplicação incapaz de servir requisição.**
Incluir uma dependência opcional ali converte uma degradação em queda total, e ainda
por cima com reinício em loop.

Vale notar que os timeouts de SMTP em `application-prod.yml` são o que manteve isso
diagnosticável: os três timeouts do JavaMail são **infinitos** por padrão e o Spring
Boot não os preenche, então sem eles a thread do health check ficaria pendurada para
sempre em vez de falhar em 5s.

---

## 6. Pendências de código antes do primeiro deploy

Todas concluídas:

| ID | Item | Situação |
|---|---|---|
| D1 | CI verde | ✅ `mvn test` roda com H2 (11 testes); `npm run lint` substituiu o `npm test` inexistente |
| D2 | `compose.yaml` alinhado ao dev | ✅ `postgres:18`, porta fixa, volume e healthcheck |
| D3 | `.env.example` do frontend | ✅ |
| D4 | `curl -fsS` no `cd.yml` | ✅ |
| D5 | CD depende de verificação | ✅ job `verificar` roda testes e build antes de publicar |
| D6 | `/actuator/health` | ✅ público; demais endpoints não expostos |
| D7 | `artifactId` sem espaços | ✅ JAR sai como `backend-0.0.1-SNAPSHOT.jar` |
| D8 | H2 em escopo `test` | ✅ fora do JAR de produção |
| D9 | `POST /api/admin/ipea/refresh` | 🔒 exige ROLE_ADMIN — antes respondia em `/api/ipea/refresh`, sem autenticação |

---

## 7. Ordem de execução

1. **S12 + rewrite** — define a topologia; `VITE_API_URL` depende dela
2. **Pendências da seção 6** — CI verde, CD confiável, health check
3. **Provisionar** — banco no Neon, variáveis no Render
4. **Primeiro boot** — o Flyway cria o schema sozinho; nada a fazer
5. **Upgrade do plano** no Render, se/quando quiser eliminar a hibernação (é só um
   toggle no dashboard — não muda código)

Fazer a seção 6 antes do S12 gera retrabalho: a URL da API muda quando entra o rewrite.

### Deploy vs. instância — o que cada botão faz

Um mal-entendido comum ao olhar a lista de deploys: os deploys antigos são
**histórico**, não processos vivos. Deploy não acrescenta uma aplicação — ele
**substitui a versão em execução**. O Render sobe a instância nova, espera passar no
health check e só então derruba a antiga; em nenhum momento há duas atendendo. A
quantidade de instâncias é definida pelo plano e pelas configurações de escala, não
pelo número de deploys.

| Objetivo | Onde |
|---|---|
| Tirar o serviço do ar (reversível com **Resume**) | Settings → **Suspend Web Service** |
| Voltar a uma versão anterior | **Rollback** no deploy desejado |
| Apagar de vez | Settings → **Delete Web Service** |

Salvar variáveis no Environment **já dispara um deploy sozinho** — variável de
ambiente só entra em processo novo. Se você salvar e ainda clicar em Manual Deploy, o
Render cancela o anterior e mantém o último.

### ⚠️ Rollback não desfaz migration

**Rollback volta o código; não volta o banco.** As migrations aplicadas continuam
aplicadas, e o Flyway valida o histórico contra os arquivos presentes no JAR.

Voltar para um deploy anterior a uma migration faz o Flyway encontrar no
`flyway_schema_history` uma versão que não existe no jar e **recusar-se a subir**:
`detected applied migration not resolved locally`. A aplicação não inicia.

Ou seja: rollback só é seguro entre versões que compartilham o mesmo estado de
migrations. Não é motivo para evitá-lo — é motivo para saber que, quando há migration
envolvida, desfazer exige pensar no banco também, não só clicar no botão.

---

## 8. Verificação pós-deploy

Executada em 27/08/2026 contra `brasil-panel-utilities-api.onrender.com`. O que já
foi provado no ambiente publicado:

| Verificação | Evidência |
|---|---|
| Imagem Docker constrói e roda | Java 21.0.12, PID 1, usuário não-root `brasilpanel` |
| Perfil correto | `The following 1 profile is active: "prod"` |
| Porta dinâmica | `Tomcat started on port 10000` — o `${PORT:8080}` funcionou |
| Banco conecta | `HikariPool-1 - Added connection` |
| Migrations | `Successfully validated 5 migrations` · `Schema "public" is up to date` |
| Schema bate com as entidades | `ddl-auto: validate` passou; 21 repositórios JPA carregados |
| Admin criado | `AdminSeeder: admin '…' criado com sucesso.` |
| Serviço no ar | `Your service is live` |
| Cadastro | `POST /api/auth/register` → `201 Created` em 1,86s |
| E-mail entregue | código de verificação recebido na caixa de entrada |

> As rotas `/api/**` e `/actuator/health` são as únicas que existem. `GET /` responde
> **404 — e isso é o correto**: este serviço é a API, não o site. O HTML é servido
> pelo frontend, em outro host. Swagger não responde em produção (só no perfil `dev`).

### Checklist completo

- [ ] `GET /actuator/health` responde `200` (após D6)
- [ ] `POST /api/ipea/refresh` (sem sessão) responde `404` e `POST /api/admin/ipea/refresh` responde `401` (após D9)
- [ ] Cadastro com e-mail de **outro** provedor entrega o código na caixa de entrada (após seção 9)
- [ ] `select status, count(*) from email_outbox group by status` não mostra `FAILED`
      (colunas em inglês: `status`, `attempts`, `last_error`, `created_at`)
- [ ] Login com senha correta retorna `200`
- [ ] Login com senha errada retorna **401**, não 500
- [ ] 6 tentativas seguidas de senha errada retornam **429**
- [ ] A resposta do login traz `Set-Cookie` com `HttpOnly`, `Secure` e `SameSite=Lax`
- [ ] O corpo da resposta do login **não** contém o campo `token`
- [ ] `localStorage` guarda apenas a chave `session` — nenhum JWT
- [ ] Logout apaga o cookie (`Max-Age=0`) e devolve **204**
- [ ] Login funciona no **Safari** — é o navegador que denuncia cookie de terceiros
- [ ] Swagger **não** acessível (só é liberado no perfil `dev`)
- [ ] Frontend carrega dados reais — se der "Erro de conexão", verifique
      `VITE_API_URL` e o rewrite
- [ ] Um admin não consegue revogar o próprio acesso

---

## 9. E-mail: domínio e provedor

O envio usa SMTP de terceiro — o Render não oferece serviço de e-mail. A configuração
aponta para o Resend (`application.yaml`, `app.mail.from-address`), mas qualquer
provedor com SMTP serve sem mudar código.

### Por que o domínio próprio não é opcional

O default `onboarding@resend.dev` é o remetente de **sandbox**: só entrega para o
e-mail da conta que criou a chave. Em produção, com ele, o cadastro de qualquer
visitante falha silenciosamente — a fila registra o envio, o Resend recusa o
destinatário, e o usuário nunca recebe o código.

Além disso, sem domínio verificado não há SPF nem DKIM alinhados, e e-mail
transacional sem autenticação de domínio cai em spam com frequência alta no Gmail e
no Outlook. Para um fluxo de confirmação de cadastro isso equivale a não funcionar.

### Enviar não é o mesmo que ter caixa de entrada

A aplicação **não precisa de caixa de e-mail nenhuma**, e essa é a confusão mais
comum neste ponto. O provedor verifica o *domínio*, não um endereço: publicados SPF e
DKIM no DNS, ele fica autorizado a enviar como qualquer endereço `@dominio`.
`nao-responda@...` é só o cabeçalho `From` — não existe como caixa, não recebe nada, e
não precisa receber. O template diz explicitamente "não responda"
(`EmailService.buildPlainText`), e nenhum fluxo do projeto espera resposta.

Ter um `contato@dominio` para receber é decisão separada, que não bloqueia o deploy.
Gmail e Outlook **gratuitos não hospedam domínio próprio** — isso exige Google
Workspace ou Microsoft 365, ambos pagos. As alternativas são encaminhar para uma caixa
que já se usa (grátis) ou um serviço como o Zoho Mail.

### Passos

1. Registrar o domínio (registro.br, para `.com.br`).

2. **Verificar o domínio.** No painel do Resend, adicionar o domínio e publicar no DNS
   os registros que ele indicar — SPF, DKIM e, de preferência, DMARC. Copiar os
   valores do painel: o DKIM é gerado por conta e não pode ser copiado de tutorial.
   A propagação leva de minutos a horas; enquanto não estiver verificado, todo envio
   com o domínio é recusado.

3. **Criar a chave de API**, que é a senha do SMTP.

4. No Render, definir as variáveis. O padrão do Resend é este — confira no painel:

   | Variável | Valor |
   |---|---|
   | `MAIL_HOST` | `smtp.resend.com` |
   | `MAIL_PORT` | **`2587`** no Render — ver abaixo |
   | `MAIL_USERNAME` | a string literal `resend` — **não** o e-mail da conta |
   | `MAIL_PASSWORD` | a chave de API |
   | `MAIL_FROM_ADDRESS` | endereço do domínio verificado |

   > **Nunca 465.** `application-prod.yml` exige `starttls.enable` e
   > `starttls.required`, que é o modo das portas STARTTLS (587 e 2587). A 465 usa
   > TLS implícito, um handshake diferente, e a conexão falha.
   >
   > **No Render, use 2587 e não 587.** A 587 é bloqueada na saída — ver armadilha
   > #4. A 2587 é a alternativa que o Resend expõe exatamente para esse caso: mesmo
   > protocolo, mesmo STARTTLS, número diferente.

5. Cadastrar-se com um e-mail de **outro** provedor — não o da conta que criou a chave.
   Com o sandbox só a própria conta recebe, então testar consigo mesmo dá falso
   positivo. O código tem que chegar na **caixa de entrada**, não no spam.

### ⚠️ Só existe UM registro SPF por *hostname*

A regra é por hostname, não por domínio — e a distinção importa aqui.

O Resend publica os registros dele num **subdomínio** (`send.brasilpanel.com.br`).
Um provedor de caixa de entrada (Zoho, Workspace) pede SPF no **domínio raiz**. Como
são hostnames diferentes, os dois convivem sem conflito e **não** precisam ser
mesclados.

O problema aparece quando dois serviços querem SPF no **mesmo** hostname. Aí publicar
dois registros `v=spf1` separados coloca aquele hostname em `PermError` e **derruba os
dois** — o e-mail transacional volta a cair em spam dias depois, sem ligação óbvia com
a causa. Nesse caso o certo é um único registro com os dois `include:`.

DKIM nunca tem esse problema (cada provedor usa um seletor próprio), e MX afeta só
recebimento.

### DMARC precisa de destino verificável

Um `rua=mailto:` apontando para endereço em **outro** domínio exige que o domínio de
destino publique um registro autorizando o recebimento (RFC 7489 §7.1) — sem isso os
relatórios são descartados em silêncio. Se não for usar relatórios, o registro mínimo
`v=DMARC1; p=none` já cumpre o papel de alinhamento sem prometer um destino que não
funciona.

### Cota do plano gratuito

O plano gratuito do Resend é de 3.000 e-mails/mês com teto de **100 por dia** — e é o
diário que morde primeiro. O teto global da aplicação
(`RATE_LIMIT_EMAILS_GLOBAL`, default 80/dia) fica deliberadamente abaixo disso: sem
ele, um pico estouraria a cota do provedor e os envios passariam a ser recusados.

Ao mudar de plano, suba os dois juntos — o teto da aplicação não deve ficar acima do
teto de quem cobra a conta.

### A fila

O envio não acontece na thread da requisição: o cadastro grava uma linha em
`email_outbox` e responde na hora, e o `EmailOutboxScheduler` drena a cada 10
segundos, com retry e backoff exponencial. Consequências operacionais:

- **Falha de SMTP não derruba o cadastro.** A entrada fica `PENDING` e é retentada.
- **Diagnóstico é uma consulta**: `select status, count(*) from email_outbox group by status`.
  Entradas em `FAILED` são as que esgotaram as 5 tentativas e ficam 30 dias no banco.
- **`OBSOLETE` não é erro** — é a fila descartando envio para conta que já se
  verificou ou foi removida no meio do caminho.

---

## 10. Rotação de credenciais

As credenciais de desenvolvimento vivem em `application-dev.yml` (gitignored,
nunca versionado). Ainda assim, **não reutilize nenhuma delas em produção**: gere
valores próprios para `JWT_SECRET`, senha do banco, chaves de API e senha do admin.