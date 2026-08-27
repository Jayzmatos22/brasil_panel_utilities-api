<div align="center">

<img src="https://img.shields.io/badge/Brasil%20Panel-Utilities%20API-FFD700?style=for-the-badge&logoColor=white" alt="Brasil Panel" />

# 🇧🇷 Brasil Panel

**Painel de dados econômicos e financeiros do Brasil.**  
Indicadores oficiais, cotações ao vivo, séries históricas e dados geográficos reunidos em uma interface limpa e rápida.

<br/>

![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Stack](#-stack)
- [Arquitetura](#-arquitetura)
- [APIs Externas Integradas](#-apis-externas-integradas)
- [Endpoints do Backend](#-endpoints-do-backend)
- [Banco de Dados](#-banco-de-dados)
- [Frontend — Páginas](#-frontend--páginas)
- [Fluxo de Autenticação](#-fluxo-de-autenticação)
- [Cache](#-cache)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar](#-como-executar)
- [Produção](#-produção)
- [Segurança e Credenciais](#-segurança-e-credenciais)

---

## 🎯 Visão Geral

O **Brasil Panel** é um monorepo full-stack que agrega dados de 10 APIs públicas e privadas, persiste tudo em PostgreSQL e exibe em um dashboard interativo com autenticação JWT.

```
frontend (React 19 + Vite)  ──►  backend (Spring Boot 3.5)  ──►  APIs externas
                                           │
                                    PostgreSQL 18
                        dev: Docker local · prod: Neon (serverless)
```

Em produção o backend roda como container no Render e o banco fica no Neon —
ver [DEPLOY.md](DEPLOY.md).

---

## 🛠 Stack

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| ![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white) | 21 | Linguagem principal |
| ![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=flat-square&logo=springboot&logoColor=white) | 3.5 | Framework base |
| ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=springsecurity&logoColor=white) | 6 | Autenticação JWT |
| ![JPA](https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=flat-square&logo=spring&logoColor=white) | 3.5 | ORM / repositórios |
| ![Hibernate](https://img.shields.io/badge/Hibernate_6.6-59666C?style=flat-square&logo=hibernate&logoColor=white) | 6.6 | Implementação JPA |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_18-316192?style=flat-square&logo=postgresql&logoColor=white) | 18 | Banco de dados |
| ![HikariCP](https://img.shields.io/badge/HikariCP-6DB33F?style=flat-square&logoColor=white) | 6.3 | Pool de conexões |
| ![Caffeine](https://img.shields.io/badge/Caffeine_Cache-6DB33F?style=flat-square&logo=spring&logoColor=white) | — | Cache em memória |
| ![Lombok](https://img.shields.io/badge/Lombok-BC4521?style=flat-square&logoColor=white) | — | Redução de boilerplate |
| ![Swagger](https://img.shields.io/badge/Swagger_UI-85EA2D?style=flat-square&logo=swagger&logoColor=black) | — | Documentação interativa |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| ![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB) | 19 | UI framework |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) | 5 | Tipagem estática |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | 6 | Build tool |
| ![Tailwind](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | 4 | Estilização |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query_v5-FF4154?style=flat-square&logoColor=white) | 5 | Fetching, cache e estado assíncrono |
| ![React Router](https://img.shields.io/badge/React_Router_7-CA4245?style=flat-square&logo=react-router&logoColor=white) | 7 | Roteamento SPA |
| ![Lucide](https://img.shields.io/badge/Lucide_React-F56565?style=flat-square&logoColor=white) | — | Ícones |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER  :5173                               │
│   React 19 · TailwindCSS 4 · TanStack Query v5 · React Router 7    │
│                                                                     │
│  /login-usuario  /registro-usuario                                  │
│  /dashboard/economia  /acoes  /metais  /cambio  /cripto             │
│  /dashboard/pib  /salario  /ibge  /bancos  /ipea                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  REST/JSON  —  Bearer JWT
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT 3.5  :8080                           │
│                                                                     │
│  JwtFilter ──► SecurityConfig ──► Controllers                       │
│                                                                     │
│  /api/auth       /api/bcb         /api/quote                        │
│  /api/metals     /api/coingecko   /api/frankfurter                  │
│  /api/ibge       /api/ipea        /api/worldbank                    │
│  /api/banks      /api/viacep                                        │
│                                                                     │
│  Services ──► FinancialDataService / SnapshotService                │
│            ──► StaticDataService                                    │
│                                                                     │
│  Caffeine Cache  (@Cacheable — TTL por domínio)                     │
└──────────┬───────────────────────────────────────────────────────── ┘
           │  HikariCP                      │  RestClient (HTTP/1.1)
           ▼                                ▼
┌──────────────────────┐     ┌──────────────────────────────────────┐
│  PostgreSQL 18        │     │  APIs Externas                       │
│  Docker (dev)         │     │                                      │
│  Neon    (prod)       │     │                                      │
│                       │     │  🏦 BCB      📊 IPEA                │
│  financial_series     │     │  📈 Alpha Vantage                   │
│  financial_data_points│     │  🥇 Metals Dev                      │
│  stock_snapshots      │     │  ₿  CoinGecko                       │
│  metal_snapshots      │     │  💱 Frankfurter                     │
│  crypto_snapshots     │     │  🗺️  IBGE       🏛️ BrasilAPI        │
│  banks                │     │  🌍 World Bank  📍 ViaCep            │
│  ibge_states          │     └──────────────────────────────────────┘
│  ibge_cities          │
│  users                │
└──────────────────────┘
```

---

## 🔌 APIs Externas Integradas

| API | Dados | Persistência | Chave necessária |
|---|---|---|---|
| **BCB** (Banco Central) | CDI, SELIC, IPCA, PTAX, Salário Mínimo | `financial_data_points` | — (pública) |
| **Alpha Vantage** | Cotações de ações (PETR4, VALE3, AAPL...) | `stock_snapshots` | ✅ gratuita |
| **Metals Dev** | Ouro, prata, platina, paládio, industriais em BRL | `metal_snapshots` | ✅ gratuita |
| **CoinGecko** | Top 100 criptos por market cap em BRL | `crypto_snapshots` | — (pública) |
| **Frankfurter** | Câmbio entre moedas + histórico | — | — (pública) |
| **IBGE** | Estados e municípios | `ibge_states`, `ibge_cities` | — (pública) |
| **IPEA Data** | Emprego, renda, desigualdade, macro, preços, população | — | — (pública) |
| **World Bank** | PIB do Brasil por ano | — | — (pública) |
| **BrasilAPI** | Lista de bancos brasileiros | `banks` | — (pública) |
| **ViaCep** | Consulta de endereço por CEP | — | — (pública) |

---

## 📡 Endpoints do Backend

> Documentação interativa: `http://localhost:8080/swagger-ui.html` — **só no perfil
> `dev`**. Em produção o Swagger é desabilitado, e as únicas rotas que respondem são
> `/api/**` e `/actuator/health`. `GET /` devolve `404` por design: este serviço é a
> API, não o site.

### 🔐 Autenticação — `/api/auth`
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cria o usuário e envia código de verificação por e-mail |
| `POST` | `/api/auth/verify-email` | Valida o código de 6 dígitos e abre a sessão |
| `POST` | `/api/auth/resend-code` | Reenvia o código de verificação |
| `POST` | `/api/auth/login` | Autentica e devolve o cookie de sessão |
| `POST` | `/api/auth/logout` | Encerra a sessão (apaga o cookie) |
| `PATCH` | `/api/auth/update-name` | Altera o nome — requer sessão |
| `PATCH` | `/api/auth/update-password` | Altera a senha — requer sessão |
| `DELETE` | `/api/auth/delete-account` | Exclui a conta — requer sessão |

> Trocar a senha **invalida todas as sessões abertas**, inclusive em outros
> dispositivos — ver [Fluxo de Autenticação](#-fluxo-de-autenticação).
> Não há fluxo de recuperação de senha por e-mail.

### 👤 Perfil — `/api/profile`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/profile/options` | Catálogos de preenchimento (áreas, níveis, profissões) |
| `GET` | `/api/profile/me` | Perfil do usuário autenticado |
| `PUT` | `/api/profile/me` | Atualiza o perfil |

### 🛡️ Administração — `/api/admin` · requer `ROLE_ADMIN`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/admin/users` | Lista os usuários |
| `PUT` | `/api/admin/users/{id}/promote` | Promove a ADMIN |
| `PUT` | `/api/admin/users/{id}/demote` | Rebaixa a USER |
| `POST` | `/api/admin/ipea/refresh` | Recarrega as séries do IPEA |

> Um admin não consegue revogar o próprio acesso.

> Login e verificação respondem com `Set-Cookie` (`HttpOnly`). O corpo traz apenas
> `email`, `role` e `expiresInMs` — **o JWT nunca aparece na resposta**.
> Após 5 tentativas de login malsucedidas para o mesmo e-mail, a rota devolve `429`
> por 15 minutos.

### 🏦 Banco Central — `/api/bcb`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/bcb/cdi` | CDI diário + taxa anualizada (252 d.u.) |
| `GET` | `/api/bcb/selic` | SELIC diária, mensal, anual e composta 12 meses |
| `GET` | `/api/bcb/selic/history` | Histórico SELIC — últimos 12 meses |
| `GET` | `/api/bcb/ipca` | IPCA mensal, acumulado ano, soma e composição 12 meses |
| `GET` | `/api/bcb/dollar/ptax` | Dólar PTAX (taxa oficial do Banco Central) |
| `GET` | `/api/bcb/minimum-wage?intervalo=N` | Salário mínimo (N meses, padrão 1) |
| `GET` | `/api/bcb/minimum-wage/history` | Histórico salário mínimo (20 meses) |

### 📈 Ações — `/api/quote`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/quote/{symbol}` | Cotação de ação — ex: `PETR4.SA`, `VALE3.SA`, `AAPL` |

### 🥇 Metais — `/api/metals`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/metals` | Ouro, prata, platina, paládio, cobre, alumínio, níquel, zinco em BRL/toz |

### ₿ Criptomoedas — `/api/coingecko`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/coingecko` | Top 100 criptomoedas por market cap em BRL |
| `GET` | `/api/coingecko/{name}` | Preço de cripto específica em BRL — ex: `bitcoin` |

### ₿ Criptomoedas — `/api/coinmarketcap`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/coinmarketcap` | Listagem por market cap (top 100) |
| `GET` | `/api/coinmarketcap/global` | Métricas globais do mercado |
| `GET` | `/api/coinmarketcap/{term}` | Busca por símbolo ou nome |

> Fonte opcional: sem `CMC_API_KEY` ela fica desligada e o painel roda só com o
> CoinGecko — de propósito, para a aplicação subir sem a chave.

### 💱 Câmbio — `/api/frankfurter`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/frankfurter?from=USD&to=BRL&amount=1` | Taxa de câmbio atual entre duas moedas |
| `GET` | `/api/frankfurter/history?from=&to=&startDate=&endDate=` | Histórico por período |
| `GET` | `/api/frankfurter/last-30-days?from=&to=` | Histórico dos últimos 30 dias |

### 🗺️ IBGE — `/api/ibge`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/ibge` | Todos os estados com região |
| `GET` | `/api/ibge/states/{state}/cities` | Municípios por estado (sigla ou ID IBGE) |
| `GET` | `/api/ibge/states/{state}/cities?filtro=` | Municípios filtrados por nome |

### 📊 IPEA — `/api/ipea`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/ipea/emprego` | Taxa de desocupação e nível de ocupação |
| `GET` | `/api/ipea/renda` | Salário mínimo real, PPC e renda per capita |
| `GET` | `/api/ipea/desigualdade` | Coeficiente de Gini e taxa de pobreza |
| `GET` | `/api/ipea/macro` | PIB, investimento, Selic, reservas, arrecadação |
| `GET` | `/api/ipea/precos` | INPC e IGP-M |
| `GET` | `/api/ipea/populacao` | População total e projeções até 2070 |

### 📉 SIDRA — `/api/sidra`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sidra/pib-estados` | PIB por unidade da federação |

### 🌍 World Bank — `/api/worldbank`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/worldbank` | PIB do Brasil mais recente |
| `GET` | `/api/worldbank/{year}` | PIB do Brasil por ano |

### 🏛️ Bancos — `/api/banks`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/banks` | Lista de todos os bancos (código + nome) |
| `GET` | `/api/banks/{code}` | Banco pelo código COMPE |

### 📍 CEP — `/api/viacep`
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/viacep/{cep}` | Endereço completo por CEP |

---

## 🗄 Banco de Dados

### Tabelas

```
financial_series              financial_data_points
────────────────              ─────────────────────
id (PK)                       id (PK)
code          ◄── "12"=CDI    series_id  (FK → financial_series)
name              "432"=SELIC reference_date
source            "BCB"       value
unit                          secondary_value   ← ex: CDI anualizado
description                   fetched_at
created_at / updated_at

stock_snapshots               metal_snapshots              crypto_snapshots
───────────────               ───────────────              ────────────────
id (PK)                       id (PK)                      id (PK)
symbol                        reference_ts (unique)        coin_id
trading_day                   currency                     symbol / name
open / high / low / price     gold / silver                image_url
previous_close                platinum / palladium         current_price
change / change_percent       copper / aluminum            market_cap
volume                        nickel / zinc                price_change_24h
fetched_at                    fetched_at                   currency / fetched_at

banks                         ibge_states                  ibge_cities
─────                         ───────────                  ───────────
id (PK)                       id (PK — IBGE)               id (PK — IBGE)
code (unique)                 sigla / nome                 nome
name / full_name              regiao_id / sigla / nome     state_id (FK)
ispb / synced_at              synced_at                    synced_at

users                         user_profiles                email_outbox
─────                         ─────────────                ────────────
id (UUID, PK)                 id (PK)                      id (UUID, PK)
name                          user_id (FK → users)         recipient
email (unique)                área / subárea               email_type
password (BCrypt)             nível de educação            status
role  (USER | ADMIN)          nível profissional           attempts
verified                                                   next_attempt_at
verification_code                                          last_error
verification_code_expires_at                               created_at
password_changed_at  ← V5                                  completed_at
created_at

knowledge_areas · knowledge_subareas · education_levels · profession_levels
──────────────────────────────────────────────────────────────────────────
Catálogos do perfil — populados por migration, servidos em /api/profile/options

cmc_crypto_snapshots · cmc_credit_usage · lbma_fixings
metal_history · pib_snapshots · pib_estadual_snapshots
─────────────────────────────────────────────────────
Séries e snapshots das fontes adicionais
```

**21 tabelas ao todo**, todas criadas pelo Flyway. As migrations vivem em
`backend/backend/src/main/resources/db/migration/`:

| Migration | O que faz |
|---|---|
| `V1__baseline.sql` | Schema inicial — 15 tabelas e 17 índices |
| `V2__bank_ispb.sql` | Coluna `ispb` em `banks` |
| `V3__user_profile.sql` | `user_profiles` + os quatro catálogos |
| `V4__email_outbox.sql` | Fila de e-mail com índices de drenagem |
| `V5__user_password_changed_at.sql` | `users.password_changed_at` |

### Estratégia de persistência

| Tabela | Quando persiste | Deduplicação |
|---|---|---|
| `financial_data_points` | A cada fetch BCB (CDI, PTAX, Salário) | `series_id + reference_date` |
| `stock_snapshots` | A cada cotação Alpha Vantage | `symbol + trading_day` |
| `metal_snapshots` | A cada fetch Metals Dev | `reference_ts` (único por horário) |
| `crypto_snapshots` | A cada fetch CoinGecko (100 registros) | Histórico completo sem dedup |
| `banks` | Startup — se tabela vazia | Idempotente por `code` |
| `ibge_states` | Startup — se tabela vazia | Idempotente por `id` IBGE |
| `ibge_cities` | Primeira consulta por estado (lazy) | Idempotente por estado |
| `email_outbox` | No cadastro/reenvio, antes de responder | — (uma linha por envio) |

### Fila de e-mail

O envio **não acontece na thread da requisição**. O cadastro grava uma linha em
`email_outbox` e responde na hora; o `EmailOutboxScheduler` drena a cada 10 segundos,
com retry e backoff exponencial. Falha de SMTP não derruba o cadastro — a entrada
fica `PENDING` e é retentada.

| Status | Significado |
|---|---|
| `PENDING` | aguardando envio, ou a próxima tentativa após falha |
| `SENT` | entregue ao servidor SMTP sem erro |
| `FAILED` | esgotou as tentativas; fica no banco para diagnóstico |
| `OBSOLETE` | descartado — a conta já se verificou ou foi removida no meio do caminho |

Diagnóstico é uma consulta:

```sql
select status, count(*) from email_outbox group by status;
```

---

## 🖥 Frontend — Páginas

```
/                        → redirect para /login-usuario
/login-usuario           → LoginPage       (split-screen com brand panel)
/registro-usuario        → RegisterPage    (split-screen com brand panel)
/dados-endereco          → AddressPage     (onboarding — endereço)
/dados-bancarios         → BankPage        (onboarding — dados bancários)

/dashboard/economia      → EconomiaPage    CDI · SELIC · IPCA · PTAX
/dashboard/pib           → PibPage         PIB — World Bank
/dashboard/salario       → SalarioPage     Salário Mínimo
/dashboard/acoes         → AcoesPage       Cotações — Alpha Vantage
/dashboard/metais        → MetaisPage      Metais — Metals Dev
/dashboard/cambio        → CambioPage      Câmbio — Frankfurter
/dashboard/cripto        → CriptoPage      Criptomoedas — CoinGecko
/dashboard/ibge          → IbgePage        Estados e municípios — IBGE
/dashboard/bancos        → BancosPage      Bancos — BrasilAPI
/dashboard/ipea          → IpeaPage        Indicadores sociais — IPEA
```

---

## 🔑 Fluxo de Autenticação

O JWT vive **exclusivamente num cookie `HttpOnly`** — inacessível ao JavaScript e,
portanto, imune a exfiltração por XSS.

```
  Navegador                Backend                    BD
    │                         │                        │
    │── POST  register ──────►│                        │
    │                         │── INSERT UserEntity ──►│
    │◄── 201 + código por e-mail                       │
    │                         │                        │
    │── POST  verify-email ──►│  valida código          │
    │                         │  gera JWT (HS256)       │
    │◄── 200 + Set-Cookie ────│                        │
    │    HttpOnly; SameSite=Lax; Path=/                │
    │    corpo: { email, role, expiresInMs }           │
    │                         │                        │
    │── GET /api/bcb/selic ──►│                        │
    │    Cookie: token=…  (anexado pelo navegador)     │
    │                         │  JwtFilter lê o cookie  │
    │                         │── GET api.bcb.gov.br ─────────►
    │◄── 200 { selic } ───────│                        │
    │                         │                        │
    │── POST  logout ────────►│                        │
    │◄── 204 + Set-Cookie Max-Age=0                    │
```

**Estado no cliente.** Como o token não pode ser lido, o frontend guarda em
`localStorage` apenas um *hint* de sessão — `{ email, role, exp }`. Ele não
autentica nada: serve só para decidir o que renderizar e manter as funções de
guarda síncronas. Toda autorização real acontece no servidor.

O header `Authorization: Bearer` continua aceito pelo `JwtFilter`, para Swagger,
`curl` e testes de integração.

### Invalidação de sessão ao trocar a senha

JWT é stateless — não há store de sessão para limpar, então o token anterior seguiria
válido até expirar, mesmo depois de a vítima trocar a senha justamente para expulsar
quem invadiu.

`users.password_changed_at` resolve isso: o `JwtService` recusa todo token cujo `iat`
seja anterior a esse instante. **Uma coluna substitui o store de sessão que o JWT não
tem.** A coluna é anulável de propósito — `NULL` significa "senha nunca trocada", e aí
não há nada a invalidar.

A comparação trunca para segundos, porque o `iat` do JWT tem precisão de segundo (é o
que a especificação define) e o timestamp do banco tem microssegundos. Sem truncar, o
token emitido logo **depois** da troca pareceria anterior a ela, e o usuário cairia
para fora ao logar em seguida. O preço é uma janela de um segundo, documentada no
javadoc e coberta por teste.

---

## ⚡ Cache

São **73 caches**, cada um com TTL e capacidade próprios, agrupados por cadência de
atualização da fonte:

| Tier | TTL | Exemplos |
|---|---|---|
| `staticData` | 7 dias | `ibge-states` · `ibge-cities` · `ibge-states-ranking` |
| `daily` | 24h | as ~55 séries do IPEA · `worldbank-*` · `sidra-pib-estados` · `viacep` |
| `halfDay` | 12h | `banks` · `bank-by-code` · `metals-history` · `lbma-fixing` · `stock-history` |
| `hourly` | 60min | `selic` · `bcb-ipca` · `bcb-ptax` · `bcb-cdi` · `metals` · `frank-furter` |
| `intraday` | 15min | `stocks` (cota diária da AlphaVantage) |
| `realtime` | 5min | `crypto-list` · `crypto-by-name` (free tier do CoinGecko) |

Implementado com **Caffeine** (in-memory), dividido em quatro arquivos:

| Arquivo | Papel |
|---|---|
| `CacheConfig` | Monta o `CacheManager` |
| `CacheCatalog` | Catálogo declarativo dos 73 caches, agrupado por fonte |
| `CacheSpec` | `record (name, ttl, maximumSize)` com validação |
| `CacheTtlProperties` | Os 6 tiers, ajustáveis por perfil em `app.cache.ttl.*` |

> Usa `SimpleCacheManager` de propósito: ele **não** cria caches sob demanda, então um
> nome errado em `@Cacheable` falha na primeira chamada em vez de criar silenciosamente
> um cache sem expiração. Um teste varre o classpath e garante que todo nome usado em
> `@Cacheable` existe no catálogo.

---

## 📁 Estrutura do Projeto

```
brasil_panel/
│
├── frontend/                        # React 19 + TypeScript + Vite
│   └── src/
│       ├── assets/app/              # SVGs: logo tricolor, ícone vertical
│       ├── components/
│       │   ├── brand/               # BrandLogo (4 variantes SVG inline)
│       │   └── forms/               # FormField · SubmitButton · AuthBrandPanel
│       ├── hooks/                   # useEconomy (CDI · SELIC · IPCA · PTAX)
│       ├── layouts/                 # DashboardLayout · OnboardingLayout
│       ├── pages/
│       │   ├── auth/                # LoginPage · RegisterPage
│       │   ├── onboarding/          # AddressPage · BankPage
│       │   └── dashboard/
│       │       ├── economia/        # EconomiaPage · PibPage · SalarioPage
│       │       ├── mercado/         # AcoesPage · MetaisPage
│       │       ├── moedas/          # CambioPage · CriptoPage
│       │       └── brasil/          # IbgePage · BancosPage · IpeaPage
│       └── types/                   # Tipos TypeScript por domínio
│
└── backend/                         # Spring Boot 3.5 · Java 21
    └── src/main/java/com/brasilpanel/backend/
        ├── config/
        │   ├── cache/               # CacheConfig · CacheCatalog · CacheSpec
        │   │                        # CacheTtlProperties
        │   ├── cors/                # CorsConfig
        │   ├── jwt/                 # JwtFilter · JwtService
        │   ├── ratelimit/           # ApiRateLimiter · RateLimitFilter
        │   │                        # RateLimitProperties
        │   ├── scheduler/           # EmailOutboxScheduler
        │   ├── seed/                # AdminSeeder · FinancialSeriesSeeder
        │   │                        # StaticDataSeeder
        │   ├── securityConfig/      # SecurityConfig
        │   └── webConfig/           # WebConfig (RestClient, HTTP/1.1 forçado)
        ├── controller/
        │   ├── api/                 # BcbController · AlphaVantageController
        │   │                        # MetalsController · CryptoCoinGeckoController
        │   │                        # FrankfurterController · IbgeController
        │   │                        # IpeaController · WorldBankController
        │   │                        # BrasilApiController · ViaCepController
        │   │                        # SidraController · CryptoCoinMarketCapController
        │   │                        # AdminController · IpeaAdminController
        │   ├── auth/                # AuthController
        │   └── profile/             # ProfileController
        ├── dto/                     # Records de transferência por API
        ├── exception/               # Exceptions customizadas + GlobalExceptionHandler
        ├── model/                   # UserEntity · FinancialSeries · FinancialDataPoint
        │                            # StockSnapshot · MetalSnapshot · CryptoSnapshot
        │                            # Bank · IbgeState · IbgeCity
        ├── repository/
        │   ├── financial/           # FinancialSeriesRepository · FinancialDataPointRepository
        │   ├── snapshot/            # StockSnapshotRepository · MetalSnapshotRepository
        │   │                        # CryptoSnapshotRepository
        │   ├── static_data/         # BankRepository · IbgeStateRepository · IbgeCityRepository
        │   └── user/                # UserRepository
        ├── service/
        │   ├── api/                 # Um service por API externa (10 services)
        │   ├── auth/                # AuthService · LoginAttemptLimiter
        │   ├── email/               # EmailService · EmailOutboxService
        │   │                        # EmailOutboxDispatcher
        │   ├── financial/           # FinancialDataService · SnapshotService
        │   ├── static_data/         # StaticDataService
        │   └── userDetails/         # UserDetailsServiceImpl
        ├── validators/              # Validadores por domínio + @ValidCep
        └── mappers/                 # UserMapper

    src/main/resources/db/migration/  # V1 … V5 — o schema é versionado aqui
    Dockerfile                        # build multi-estágio (Maven → JRE 21)
```

---

## 🚀 Como Executar

### Pré-requisitos
- Java 21+
- Node.js 20+
- Docker (com container PostgreSQL)
- Maven 3.9+ (ou use o `./mvnw` incluso)

### 1. Banco de dados (Docker)

```bash
cd backend/backend
docker compose up -d
```

Só isso. O `compose.yaml` já cria o banco `brasil_panel`, o usuário e as permissões
— não é preciso rodar nenhum `psql` manualmente.

| | Valor |
|---|---|
| Banco | `brasil_panel` |
| Usuário | `brasil_panel` |
| Senha | `brasil_panel` |
| Porta | `5432` |

> Credenciais de desenvolvimento local, propositalmente simples: o container não
> é exposto para fora da máquina. Em produção tudo vem de variáveis de ambiente
> — ver [DEPLOY.md](DEPLOY.md).

### 2. Criar `application-dev.yml`

Criar em `backend/backend/src/main/resources/application-dev.yml` (**não commitado**):

```yaml
# Obrigatório: não há mais valor padrão versionado para o secret.
# Gere com um RNG criptográfico (mínimo 32 bytes):
#   $b = New-Object byte[] 48
#   [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
#   [Convert]::ToBase64String($b)
jwt:
  secret: 'SEU_SECRET_LOCAL_AQUI'

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/brasil_panel
    driver-class-name: org.postgresql.Driver
    username: brasil_panel      # precisa bater com o compose.yaml
    password: brasil_panel
  jpa:
    hibernate:
      ddl-auto: validate     # o schema vem do Flyway, não do Hibernate
    show-sql: true
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
  cache:
    type: caffeine

alpha-vantage:
  keys: CHAVE1,CHAVE2,CHAVE3,CHAVE4   # https://www.alphavantage.co

metals:
  api-key: SUA_METALS_KEY              # https://metals.dev
```

### 3. Backend

```bash
cd backend/backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Na primeira inicialização o **Flyway** cria todo o schema (o Hibernate roda com
`ddl-auto: validate` e nunca altera nada), e em seguida os seeders executam
automaticamente:
- ✅ 9 séries financeiras do BCB inseridas em `financial_series`
- ✅ ~260 bancos da BrasilAPI inseridos em `banks`
- ✅ 27 estados do IBGE inseridos em `ibge_states`
- ✅ admin criado — **apenas se `ADMIN_PASSWORD` estiver definida**; sem ela o seeder
  registra um aviso e não cria nada

> 📖 Swagger UI: `http://localhost:8080/swagger-ui.html`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

> 🌐 App: `http://localhost:5173`

---

## 🌐 Produção

| Camada | Onde | Observação |
|---|---|---|
| Backend | **Render** — container Docker | Free hiberna após ~15 min sem requisição |
| Banco | **Neon** — PostgreSQL 18.6 | Serverless; suspende e acorda em ~1s |
| E-mail | **Resend** — SMTP, domínio verificado | Fila assíncrona via `email_outbox` |
| Frontend | Vercel / Cloudflare Pages | Reescreve `/api/*` para o backend |

```
API     https://brasil-panel-utilities-api.onrender.com
Health  /actuator/health
```

O Render não tem runtime Java nativo, por isso o backend é publicado como imagem —
`backend/backend/Dockerfile`, build multi-estágio (Maven compila, JRE 21 executa,
processo roda como usuário não-root).

**Duas características do plano gratuito que afetam o comportamento observável:**

- **Cold start de ~150 segundos.** A instância hiberna após ~15 min ociosa, e o boot
  completo do Spring Boot na CPU compartilhada do Free leva esse tempo. O primeiro
  acesso depois da hibernação é lento — o frontend precisa tolerar isso, com timeout
  compatível e um estado de carregamento, em vez de tratar como erro.
- **SMTP na porta 587 é bloqueado na saída.** Por isso `MAIL_PORT=2587`, a porta
  alternativa do Resend.

> 📘 Runbook completo — variáveis de ambiente, armadilhas de boot, verificação
> pós-deploy e semântica de rollback com migrations: **[DEPLOY.md](DEPLOY.md)**

---

## 🔒 Segurança e Credenciais

- Autenticação via **JWT em cookie `HttpOnly`** — inacessível ao JavaScript. `SameSite=Lax`
  cobre CSRF; a flag `Secure` é controlada por `COOKIE_SECURE` (`true` em produção)
- `JwtFilter` lê o cookie e, se ausente, o header `Authorization` — o header segue
  disponível para Swagger, `curl` e testes
- Senhas armazenadas com **BCrypt**
- **Trocar a senha invalida todas as sessões abertas** — `users.password_changed_at`
  faz o `JwtService` recusar tokens emitidos antes da troca
- **Rate limiting** no login: 5 tentativas por e-mail a cada 15 minutos, depois `429`.
  O contador é por instância (Caffeine em memória) — com múltiplas réplicas o limite
  efetivo é multiplicado
- **`JWT_SECRET` é obrigatório**: sem a variável de ambiente a aplicação não sobe. Não
  existe valor padrão versionado — um default no repositório seria uma chave pública
- Rotas públicas: dados econômicos, `register`, `verify-email`, `resend-code`, `login`
  e `logout`. As demais exigem sessão; `/api/admin/**` exige `ROLE_ADMIN`
- **Swagger só no perfil `dev`** — desabilitado em produção
- **Rate limit de e-mail**: teto por cliente em `/auth/register` e `/auth/resend-code`,
  mais um teto global diário da instância, dimensionado abaixo da cota do provedor —
  sem ele um pico estouraria a cota e os envios passariam a ser recusados
- **O health check não depende de serviço externo.** O `MailHealthIndicator` do Spring
  Boot é desligado de propósito: ele abre uma conexão SMTP a cada checagem, e como a
  plataforma usa `/actuator/health` para decidir se a instância está viva, um provedor
  de e-mail fora do ar derrubava a API inteira. O health só deve refletir o que impede
  a aplicação de servir requisição
- **O schema é versionado pelo Flyway** (`src/main/resources/db/migration/`). Os três
  perfis usam `ddl-auto: validate` — o Hibernate nunca altera schema em lugar nenhum.
  Alterar entidade exige a migration `V2__`, `V3__`… no mesmo commit; o CI roda as
  migrations em banco limpo e valida contra as entidades, então o desencontro aparece
  no pull request e não no deploy
- `application-dev.yml` está no `.gitignore` — **nunca commitado**
- `application-prod.yml` usa exclusivamente variáveis de ambiente (`${DATABASE_URL}`,
  `${ALPHA_KEYS}`, `${METALS_KEY}`, `${JWT_SECRET}`, `${COOKIE_SECURE}`)

> 📘 Checklist completo de publicação, variáveis de ambiente e armadilhas de boot:
> **[DEPLOY.md](DEPLOY.md)**

### Observações técnicas

- **HTTP/1.1 forçado** no `RestClient` — Azure WAF do BCB rejeita HTTP/2 com 502
- **CDI anualizado** pela convenção brasileira: `(1 + diária/100)^252 − 1`
- **Rotação de chaves Alpha Vantage** via `AtomicInteger` — contorna o limite de 25 req/dia por chave
- **SVGs inline como JSX** — sem SVGR plugin, suporta filtros CSS e animações
- **Lazy seeding de municípios** — evita 27 chamadas no startup; carrega por estado sob demanda

---

<div align="center">

Feito com ☕ e 🇧🇷 por **Jailton Matos**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)

</div>
