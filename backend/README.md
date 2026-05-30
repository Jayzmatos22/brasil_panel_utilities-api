<div align="center">

<img src="https://img.shields.io/badge/Brasil%20Panel-Utilities%20API-FFD700?style=for-the-badge&logoColor=white" alt="Brasil Panel" />

# 🇧🇷 Brasil Panel — Utilities API

**Plataforma financeira full-stack para consulta de dados brasileiros em tempo real.**  
Integra câmbio, criptomoedas, indicadores econômicos, endereços e dados bancários numa única API.

<br/>

![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

</div>

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Stack](#-stack)
- [Arquitetura](#-arquitetura)
- [APIs Externas Integradas](#-apis-externas-integradas)
- [Endpoints do Backend](#-endpoints-do-backend)
- [Fluxo de Autenticação](#-fluxo-de-autenticação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Como Executar](#-como-executar)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 🎯 Visão Geral

O **Brasil Panel** é um monorepo com frontend React e backend Spring Boot que funciona como proxy seguro e cacheado para múltiplas APIs públicas brasileiras e internacionais. O usuário se cadastra, faz login via JWT, preenche seus dados de endereço e conta bancária — e acessa um dashboard com indicadores financeiros em tempo real.

---

## 🛠 Stack

### Backend
| Tecnologia | Uso |
|---|---|
| ![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white) | Linguagem principal |
| ![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=flat-square&logo=springboot&logoColor=white) | Framework base |
| ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=springsecurity&logoColor=white) | Autenticação e autorização |
| ![JWT](https://img.shields.io/badge/JWT_JJWT_0.12-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Tokens de acesso |
| ![JPA](https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=flat-square&logo=spring&logoColor=white) | Persistência |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) | Banco de dados (produção) |
| ![H2](https://img.shields.io/badge/H2-004088?style=flat-square&logoColor=white) | Banco de dados (testes/dev) |
| ![Caffeine](https://img.shields.io/badge/Caffeine_Cache-6DB33F?style=flat-square&logo=spring&logoColor=white) | Cache em memória |
| ![Lombok](https://img.shields.io/badge/Lombok-BC4521?style=flat-square&logoColor=white) | Redução de boilerplate |
| ![MapStruct](https://img.shields.io/badge/MapStruct_1.5-EB0029?style=flat-square&logoColor=white) | Mapeamento de objetos |
| ![Swagger](https://img.shields.io/badge/Swagger_UI-85EA2D?style=flat-square&logo=swagger&logoColor=black) | Documentação interativa |

### Frontend
| Tecnologia | Uso |
|---|---|
| ![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB) | UI framework |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) | Tipagem estática |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Build tool |
| ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Estilização |
| ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white) | Roteamento SPA |
| ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) | Requisições HTTP |
| ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logoColor=white) | Validação de schemas |
| ![Lucide](https://img.shields.io/badge/Lucide_React-F56565?style=flat-square&logoColor=white) | Ícones |

---

## 🏗 Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE  (Browser)                              │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │  HTTP
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND  — React + Vite  :5173                       │
│                                                                          │
│  Rotas                        Componentes           Serviços             │
│  /                        →   RegisterData          ApiCripto            │
│  /login-usuario           →   LoginDataUser         ExchangeRateApi      │
│  /dados-endereco          →   AdressData            ViaCepApi            │
│  /dados-bancarios         →   BankData              BrasilApi            │
│  /cotacao-criptomoedas    →   Criptos               BancoCentralBrApi    │
│  /cotacao-moedas          →   Exchange              FrankFurterApi       │
│  /dashboard               →   Dashboard             IbgeApi              │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │  REST / JSON  (JWT Bearer Token)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   BACKEND  — Spring Boot  :8080                          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Security Filter Chain                          │ │
│  │   CorsConfig  ──►  JwtFilter  ──►  SecurityConfig                 │ │
│  └─────────────────────────────┬──────────────────────────────────────┘ │
│                                │                                         │
│  ┌────────────────────┐  ┌─────▼───────────┐  ┌─────────────────────┐  │
│  │    Controllers     │  │    Services     │  │    RestClient       │  │
│  │                    │  │                 │  │                     │  │
│  │  /api/auth/**      │  │  AuthService    │  │  connectTimeout 5s  │  │
│  │  /api/bcb/**       │  │  BcbService     │  │  readTimeout   15s  │  │
│  │  /api/cep/**       │  │  ViaCepService  │  │                     │  │
│  │  /api/ibge/**      │  │  IbgeService    │  └──────────┬──────────┘  │
│  │  /api/crypto/**    │  │  CryptoService  │             │              │
│  │  /api/exchange/**  │  │  ExchangeService│             │              │
│  │  /api/banks/**     │  │  BrasilAPIService│            │              │
│  │  /api/worldbank/** │  │  WorldBankService│            │              │
│  └────────────────────┘  └─────────────────┘             │              │
│                                                           │              │
│  ┌────────────────────────────────────────────────────┐  │              │
│  │                 Cache  @Cacheable                  │  │              │
│  │  dev  → ConcurrentHashMap (sem TTL)                │  │              │
│  │  prod → Caffeine (TTL 30 min)                      │  │              │
│  └────────────────────────────────────────────────────┘  │              │
│                                                           │              │
│  ┌────────────────────────────────────────────────────┐  │              │
│  │                   Persistência                     │  │              │
│  │  dev  → H2 in-memory                               │  │              │
│  │  prod → PostgreSQL                                 │  │              │
│  └────────────────────────────────────────────────────┘  │              │
└───────────────────────────────────────────────────────────┘              │
                                                            │               │
                                                            ▼               │
┌──────────────────────────────────────────────────────────────────────────┐
│                          APIs EXTERNAS                                   │
│                                                                          │
│  🏦  Banco Central do Brasil   SELIC · IPCA · CDI · PTAX                │
│      api.bcb.gov.br                                                      │
│                                                                          │
│  📍  ViaCEP                    Endereço por CEP                          │
│      viacep.com.br                                                       │
│                                                                          │
│  ₿   CoinGecko                 Cotação de criptomoedas em BRL            │
│      api.coingecko.com                                                   │
│                                                                          │
│  💱  Frankfurter               Taxas de câmbio + histórico 30 dias       │
│      api.frankfurter.app                                                 │
│                                                                          │
│  💲  ExchangeRate API          Conversão entre 170+ moedas               │
│      exchangerate-api.com                                                │
│                                                                          │
│  🗺️  IBGE                      Estados e municípios brasileiros           │
│      servicodados.ibge.gov.br                                            │
│                                                                          │
│  🏛️  BrasilAPI                  Lista de bancos brasileiros               │
│      brasilapi.com.br                                                    │
│                                                                          │
│  🌍  World Bank                PIB do Brasil                             │
│      api.worldbank.org                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 APIs Externas Integradas

| API | Dados | Endpoint Base |
|---|---|---|
| **Banco Central do Brasil** | SELIC, IPCA, CDI, Dólar PTAX, históricos | `api.bcb.gov.br` |
| **ViaCEP** | Endereço completo por CEP | `viacep.com.br` |
| **CoinGecko** | Preço de criptomoedas em BRL | `api.coingecko.com` |
| **Frankfurter** | Câmbio entre moedas + histórico | `api.frankfurter.app` |
| **ExchangeRate API** | Conversão entre 170+ moedas | `exchangerate-api.com` |
| **IBGE** | Estados, municípios e regiões | `servicodados.ibge.gov.br` |
| **BrasilAPI** | Bancos brasileiros (ISPB, código, nome) | `brasilapi.com.br` |
| **World Bank** | PIB nacional | `api.worldbank.org` |

---

## 📡 Endpoints do Backend

### 🔐 Autenticação
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro de novo usuário |
| `POST` | `/api/auth/login` | Login e geração de JWT |

### 🏦 Banco Central do Brasil
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/bcb/selic` | Taxa SELIC atual + acumulados |
| `GET` | `/api/bcb/ipca` | IPCA mensal + acumulados |
| `GET` | `/api/bcb/cdi` | Taxa CDI diária |
| `GET` | `/api/bcb/ptax` | Dólar PTAX |
| `GET` | `/api/bcb/selic/history` | Histórico SELIC (12 meses) |
| `GET` | `/api/bcb/all` | Todos os indicadores de uma vez |

### 📍 ViaCEP
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/cep/{cep}` | Endereço completo pelo CEP |

### 🗺️ IBGE
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/ibge` | Todos os estados brasileiros |
| `GET` | `/api/ibge/states/{state}/cities` | Municípios por estado (ID ou sigla) |
| `GET` | `/api/ibge/states/{state}/cities?filtro={nome}` | Municípios filtrados por nome |

### ₿ Criptomoedas
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/crypto/{coin}` | Preço de cripto em BRL via CoinGecko |
| `GET` | `/api/crypto/market` | Mercado das principais criptos |

### 💱 Câmbio
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/exchange/rate?from={}&to={}` | Taxa de câmbio entre duas moedas |
| `GET` | `/api/exchange/history?from={}&to={}` | Histórico de câmbio (30 dias) |

### 🏛️ Bancos
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/banks` | Lista todos os bancos brasileiros |
| `GET` | `/api/banks/{code}` | Banco pelo código |

### 🌍 World Bank
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/worldbank/pib` | PIB do Brasil |

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

## 📁 Estrutura do Projeto

```
brasil_panel_utilities-api/
│
├── frontend/                           # React + TypeScript + Vite
│   └── src/
│       ├── api/                        # Chamadas diretas às APIs (legado → migrar p/ backend)
│       │   ├── ApiCripto.ts            # CoinGecko
│       │   ├── BancoCentralBrApi.ts    # Banco Central do Brasil
│       │   ├── BrasilApi.ts            # BrasilAPI
│       │   ├── ExchangeRateApi.ts      # ExchangeRate
│       │   ├── FrankFurterApi.ts       # Frankfurter
│       │   ├── IbgeApi.ts              # IBGE
│       │   └── ViaCepApi.ts            # ViaCEP
│       ├── components/
│       │   ├── Dashboard.tsx
│       │   ├── Exchange.tsx
│       │   ├── Criptos.tsx
│       │   ├── BankData.tsx
│       │   ├── AdressData.tsx
│       │   ├── Header.tsx
│       │   ├── LoginDataUser.tsx
│       │   └── RegisterData.tsx
│       └── types/
│
└── backend/                            # Spring Boot 3.5 · Java 21
    └── src/main/java/com/brasilpanel/backend/
        ├── config/
        │   ├── cors/                   # CorsConfig
        │   ├── jwt/                    # JwtFilter · JwtService
        │   ├── securityConfig/         # SecurityConfig
        │   └── webConfig/              # WebConfig (RestClient)
        ├── controller/
        │   ├── api/                    # BcbController · ViaCepController · IbgeController
        │   │                           # CryptoCoinGeckoController · FrankfurterController
        │   │                           # BrasilApiController · WorldBankController
        │   └── auth/                   # AuthController
        ├── service/
        │   ├── api/                    # Um service por API externa
        │   ├── auth/                   # AuthService
        │   └── userDetails/            # UserDetailsServiceImpl
        ├── dto/
        │   ├── api/                    # DTOs por API (bcb, ibge, viaCep, crypto, ...)
        │   └── user/                   # UserRequestDTO · UserResponseDTO · AuthResponseDTO
        ├── model/                      # UserEntity
        ├── repository/                 # UserRepository
        ├── mappers/                    # UserMapper (MapStruct)
        ├── validators/
        │   ├── annotations/            # @ValidCep
        │   └── api/                    # IbgeValidator · ViaCepValidator · ...
        └── exception/
            ├── customized/             # Exceptions por domínio
            └── global/                 # GlobalExceptionHandler
```

---

## 🚀 Como Executar

### Pré-requisitos
- Java 21+
- Maven 3.9+ (ou use o `./mvnw` incluso)
- Node.js 18+
- PostgreSQL (produção) — não necessário para dev

### Backend

```bash
cd backend

# Desenvolvimento (H2 in-memory, sem PostgreSQL)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Produção
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

> 📖 Swagger UI: `http://localhost:8080/swagger-ui.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> 🌐 App: `http://localhost:5173`

---

## ⚙️ Variáveis de Ambiente

Crie `backend/src/main/resources/application-prod.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/brasilpanel
    username: seu_usuario
    password: sua_senha

jwt:
  secret: sua_chave_secreta_minimo_256_bits
  expiration: 86400000
```

---

<div align="center">

Feito com ☕ e 🇧🇷 por **Jailton Matos**

![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Java](https://img.shields.io/badge/Java_21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)

</div>
