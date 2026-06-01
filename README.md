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
- [Segurança e Credenciais](#-segurança-e-credenciais)

---

## 🎯 Visão Geral

O **Brasil Panel** é um monorepo full-stack que agrega dados de 10 APIs públicas e privadas, persiste tudo em PostgreSQL e exibe em um dashboard interativo com autenticação JWT.

```
frontend (React 19 + Vite)  ──►  backend (Spring Boot 3.5)  ──►  APIs externas
                                           │
                                    PostgreSQL 18 (Docker)
```

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
│  (Docker)             │     │                                      │
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

> Documentação interativa: `http://localhost:8080/swagger-ui.html`

### 🔐 Autenticação — `/api/auth`
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Registra usuário, retorna JWT |
| `POST` | `/api/auth/login` | Autentica usuário, retorna JWT |

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

users
─────
id (UUID, PK)
name / email (unique) / password / created_at
```

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

```
  Cliente                  Backend                    BD
    │                         │                        │
    │── POST /api/auth/register ──►│                   │
    │                         │── INSERT UserEntity ──►│
    │◄── 201 Created ─────────│                        │
    │                         │                        │
    │── POST /api/auth/login ─►│                       │
    │                         │── SELECT by email ────►│
    │                         │◄── UserEntity ─────────│
    │                         │  gera JWT (HS256)       │
    │◄── 200 { token, user } ─│                        │
    │                         │                        │
    │── GET /api/bcb/selic ───►│                       │
    │   Authorization: Bearer {token}                  │
    │                         │  JwtFilter valida token│
    │                         │── GET api.bcb.gov.br ─────────►
    │                         │◄── resposta BCB ───────────────
    │◄── 200 { selic } ───────│                        │
```

---

## ⚡ Cache

| Cache key | TTL | Dados |
|---|---|---|
| `selic` | 12h | SELIC composta |
| `bcb-ipca` | 12h | IPCA composto |
| `bcb-ptax` | 6h | Dólar PTAX |
| `bcb-cdi` | 6h | CDI diário + anualizado |
| `salario-minimo` | 12h | Salário mínimo |
| `stocks` | 15min | Cotação por ticker |
| `metals` | 7 dias | Preços de metais |
| `crypto-list` | 5min | Top 100 criptos |
| `crypto-by-name` | 5min | Cripto por nome |
| `banks` | 12h | Lista de bancos |
| `ibge-states` | 24h | Estados brasileiros |
| `ibge-cities` | 24h | Municípios por estado |

> Implementado com **Caffeine** (in-memory). TTLs configurados em `CacheConfig.java`.

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
        │   ├── cache/               # CacheConfig (Caffeine TTLs)
        │   ├── cors/                # CorsConfig
        │   ├── jwt/                 # JwtFilter · JwtService
        │   ├── seed/                # FinancialSeriesSeeder · StaticDataSeeder
        │   ├── securityConfig/      # SecurityConfig
        │   └── webConfig/           # WebConfig (RestClient, HTTP/1.1 forçado)
        ├── controller/
        │   ├── api/                 # BcbController · AlphaVantageController
        │   │                        # MetalsController · CryptoCoinGeckoController
        │   │                        # FrankfurterController · IbgeController
        │   │                        # IpeaController · WorldBankController
        │   │                        # BrasilApiController · ViaCepController
        │   └── auth/                # AuthController
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
        │   ├── auth/                # AuthService
        │   ├── financial/           # FinancialDataService · SnapshotService
        │   ├── static_data/         # StaticDataService
        │   └── userDetails/         # UserDetailsServiceImpl
        ├── validators/              # Validadores por domínio + @ValidCep
        └── mappers/                 # UserMapper
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
# Criar o banco
docker exec <container> psql -U postgres -c "CREATE DATABASE brasil_panel;"

# Criar o usuário
docker exec <container> psql -U postgres -c "CREATE USER meu_usuario WITH PASSWORD 'minha_senha';"
docker exec <container> psql -U postgres -d brasil_panel -c "GRANT ALL PRIVILEGES ON DATABASE brasil_panel TO meu_usuario;"
docker exec <container> psql -U postgres -d brasil_panel -c "GRANT ALL ON SCHEMA public TO meu_usuario;"
docker exec <container> psql -U postgres -d brasil_panel -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO meu_usuario;"
```

### 2. Criar `application-dev.yml`

Criar em `backend/backend/src/main/resources/application-dev.yml` (**não commitado**):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/brasil_panel
    driver-class-name: org.postgresql.Driver
    username: meu_usuario
    password: minha_senha
  jpa:
    hibernate:
      ddl-auto: update
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

Na primeira inicialização o Hibernate cria todas as tabelas e os seeders executam automaticamente:
- ✅ 9 séries financeiras do BCB inseridas em `financial_series`
- ✅ ~260 bancos da BrasilAPI inseridos em `banks`
- ✅ 27 estados do IBGE inseridos em `ibge_states`

> 📖 Swagger UI: `http://localhost:8080/swagger-ui.html`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

> 🌐 App: `http://localhost:5173`

---

## 🔒 Segurança e Credenciais

- Autenticação via **JWT** (Bearer token) — `JwtFilter` intercepta todas as rotas protegidas
- Rotas públicas: `/api/auth/**` e Swagger UI
- Senhas armazenadas com **BCrypt**
- `application-dev.yml` está no `.gitignore` — **nunca commitado**
- `application-prod.yml` usa exclusivamente variáveis de ambiente (`${DATABASE_URL}`, `${ALPHA_KEYS}`, `${METALS_KEY}`)

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
