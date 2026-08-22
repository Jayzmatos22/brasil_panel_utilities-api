# Deploy — Brasil Panel

Runbook de publicação. Cobre o que precisa existir **antes** do primeiro deploy,
a ordem correta das etapas e como verificar que subiu de verdade.

---

## 1. Topologia

| Camada | Onde | Hiberna? |
|---|---|---|
| Frontend (build Vite estático) | Vercel ou Cloudflare Pages | Não — arquivos em CDN |
| Backend (JAR Spring Boot) | Render | Free hiberna após ~15 min; **Starter (~US$ 7/mês) não hiberna** |
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

## 2. Variáveis de ambiente — backend (Render)

| Variável | Obrigatória | Observação |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | **Sim** | Valor: `prod`. Ver armadilha #1 abaixo. |
| `JWT_SECRET` | **Sim** | A aplicação **não sobe** sem ela. Ver seção 3. |
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
| `MAIL_FROM_ADDRESS` | Conforme uso | Remetente exibido |
| `MAIL_FROM_NAME` | Conforme uso | |
| `RATE_LIMIT_EMAILS_PER_HOUR` | Não | Default `5`. Teto por cliente em `/auth/register` e `/auth/resend-code`. |
| `RATE_LIMIT_EMAILS_GLOBAL` | Não | Default `60`. Teto da instância inteira, por hora, nas mesmas rotas. |
| `ADMIN_EMAIL` | Opcional | |
| `ADMIN_PASSWORD` | Opcional | Se vazio, o admin **não** é criado no seed |

### Frontend (Vercel / Cloudflare)

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `/api` (com o rewrite configurado) |

Sem essa variável, o build de produção usa o fallback `http://localhost:8080/api`
— ou seja, o site publicado tenta falar com o **localhost do visitante**.

---

## 3. JWT_SECRET

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

## 4. Armadilhas que impedem o boot

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

## 5. Pendências de código antes do primeiro deploy

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

## 6. Ordem de execução

1. **S12 + rewrite** — define a topologia; `VITE_API_URL` depende dela
2. **Pendências da seção 5** — CI verde, CD confiável, health check
3. **Provisionar** — banco no Neon, variáveis no Render
4. **Primeiro boot** — o Flyway cria o schema sozinho; nada a fazer
5. **Upgrade do plano** no Render, se/quando quiser eliminar a hibernação (é só um
   toggle no dashboard — não muda código)

Fazer a seção 5 antes do S12 gera retrabalho: a URL da API muda quando entra o rewrite.

---

## 7. Verificação pós-deploy

- [ ] `GET /actuator/health` responde `200` (após D6)
- [ ] `POST /api/ipea/refresh` (sem sessão) responde `404` e `POST /api/admin/ipea/refresh` responde `401` (após D9)
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

## 8. Rotação de credenciais

As credenciais de desenvolvimento vivem em `application-dev.yml` (gitignored,
nunca versionado). Ainda assim, **não reutilize nenhuma delas em produção**: gere
valores próprios para `JWT_SECRET`, senha do banco, chaves de API e senha do admin.