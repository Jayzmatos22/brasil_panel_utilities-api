# Deploy — Brasil Panel

Runbook de publicação. Cobre o que precisa existir **antes** do primeiro deploy,
a ordem correta das etapas e como verificar que subiu de verdade.

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
| `MAIL_PORT` | Não | Default `587` |
| `MAIL_FROM_ADDRESS` | **Sim** | Endereço do **domínio verificado** no provedor. O default (`onboarding@resend.dev`) é o remetente de sandbox do Resend, que só entrega para o e-mail da própria conta — com ele, nenhum usuário real recebe o código. Ver seção 9. |
| `MAIL_FROM_NAME` | Conforme uso | |
| `RATE_LIMIT_EMAILS_PER_HOUR` | Não | Default `5`. Teto por cliente em `/auth/register` e `/auth/resend-code`. |
| `RATE_LIMIT_EMAILS_GLOBAL` | Não | Default `80`. Teto da instância inteira, **por dia**, nas mesmas rotas. Dimensionado sob o limite de 100/dia do plano gratuito do Resend. |
| `ADMIN_EMAIL` | Opcional | |
| `ADMIN_PASSWORD` | Opcional | Se vazio, o admin **não** é criado no seed |

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

### #3 — SMTP obrigatório

O `EmailService` recebe um `JavaMailSender` por construtor, e a auto-configuração
do Spring Boot só cria esse bean quando `spring.mail.host` existe. Sem `MAIL_HOST`,
`MAIL_USERNAME` e `MAIL_PASSWORD` no ambiente, a aplicação **falha ao subir** — na
injeção de dependência, antes de atender qualquer requisição.

### #2 — Schema: quem cria é o Flyway

> Esta seção descrevia um primeiro boot com `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
> e DDL aplicado à mão a cada alteração de entidade. **Não faça mais isso** — o
> schema passou a ser versionado.

`application-prod.yml` mantém `ddl-auto: validate`: o Hibernate nunca cria nem altera
o schema. Quem cria é o Flyway, a partir dos scripts em
`src/main/resources/db/migration/`.

**Banco novo (vazio):** nada a fazer. O Flyway roda a `V1__baseline.sql` no primeiro
boot, cria as 15 tabelas e os 17 índices, e o `validate` do Hibernate passa em
seguida. Sem env var temporária, sem passo manual.

**Banco que já existe** (o caso do Render hoje, cujas tabelas vieram do `update`
antigo): `baseline-on-migrate: true` faz o Flyway apenas **registrar** a V1 como
aplicada, sem executá-la. Nenhum DDL roda sobre os dados existentes.

**Alteração de entidade daqui em diante:** escreva a migration correspondente
(`V2__descricao.sql`, `V3__…`) no mesmo commit. O CI executa as migrations em H2
limpo e valida contra as entidades, então o desencontro aparece no pull request —
não no deploy.

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

---

## 8. Verificação pós-deploy

- [ ] `GET /actuator/health` responde `200` (após D6)
- [ ] `POST /api/ipea/refresh` (sem sessão) responde `404` e `POST /api/admin/ipea/refresh` responde `401` (após D9)
- [ ] Cadastro com e-mail de **outro** provedor entrega o código na caixa de entrada (após seção 9)
- [ ] `select status, count(*) from email_outbox group by status` não mostra `FAILED`
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
   | `MAIL_PORT` | `587` (pode omitir — é o default do código) |
   | `MAIL_USERNAME` | a string literal `resend` — **não** o e-mail da conta |
   | `MAIL_PASSWORD` | a chave de API |
   | `MAIL_FROM_ADDRESS` | endereço do domínio verificado |

   > **Porta 587, nunca 465.** `application-prod.yml` exige
   > `starttls.enable` e `starttls.required`, que é o modo da 587. A 465 usa TLS
   > implícito, um handshake diferente, e a conexão falha.

5. Cadastrar-se com um e-mail de **outro** provedor — não o da conta que criou a chave.
   Com o sandbox só a própria conta recebe, então testar consigo mesmo dá falso
   positivo. O código tem que chegar na **caixa de entrada**, não no spam.

### ⚠️ Só existe UM registro SPF por domínio

Se depois for configurada uma caixa de entrada (Zoho, Workspace), o provedor dela vai
pedir o próprio SPF. Publicar dois registros `v=spf1` separados coloca o domínio em
`PermError` e **derruba os dois** — o e-mail transacional volta a cair em spam, dias
depois, sem ligação óbvia com a causa.

O certo é mesclar num único registro, com os dois `include:`. DKIM não tem esse
problema (cada provedor usa um seletor próprio), e MX afeta só recebimento.

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