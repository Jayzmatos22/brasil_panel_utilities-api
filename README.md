# Brasil Panel — Utilities API

Monorepo com frontend React/TypeScript e backend Spring Boot para consulta de dados financeiros, cambiais, geográficos e de endereço do Brasil.

---

## Estrutura de Pastas

```
brasil_panel/
│
├── frontend/                          # React + TypeScript + Vite
│   ├── public/
│   └── src/
│       ├── api/                       # Chamadas diretas às APIs externas (legado)
│       │   ├── ApiCripto.ts           # CoinGecko
│       │   ├── BancoCentralBrApi.ts   # Banco Central do Brasil
│       │   ├── BrasilApi.ts           # BrasilAPI (bancos)
│       │   ├── ExchangeRateApi.ts     # ExchangeRate
│       │   ├── FrankFurterApi.ts      # Frankfurter (câmbio histórico)
│       │   ├── IbgeApi.ts             # IBGE
│       │   └── ViaCepApi.ts           # ViaCEP
│       ├── components/                # Componentes de UI
│       │   ├── Dashboard.tsx
│       │   ├── Exchange.tsx
│       │   ├── Criptos.tsx
│       │   ├── BankData.tsx
│       │   ├── AdressData.tsx
│       │   ├── Header.tsx
│       │   ├── LoginDataUser.tsx
│       │   └── RegisterData.tsx
│       └── types/                     # Tipos TypeScript
│           ├── UserType.ts
│           ├── ExchangeDataType.ts
│           ├── CriptoType.ts
│           ├── AddressUserType.ts
│           ├── BankDataType.ts
│           ├── FrankfurterType.ts
│           ├── BrazilianStatesType.ts
│           └── MunicipioIbgeType.ts
│
└── backend/                           # Spring Boot 3.5 + Java 21
    └── src/main/java/com/brasilpanel/backend/
        │
        ├── config/                    # Configurações da aplicação
        │   ├── cors/                  # CorsConfig
        │   ├── jwt/                   # JwtFilter · JwtService
        │   ├── securityConfig/        # SecurityConfig (Spring Security)
        │   └── webConfig/             # WebConfig (RestClient + timeout)
        │
        ├── controller/                # Entrada HTTP
        │   ├── api/
        │   │   ├── BcbController      # GET /api/bcb/**
        │   │   └── ViaCepController   # GET /api/cep/**
        │   └── auth/
        │       └── AuthController     # POST /api/auth/**
        │
        ├── service/                   # Lógica de negócio
        │   ├── api/
        │   │   ├── bcb/               # BcbService + BcbImplementations
        │   │   ├── viaCep/            # ViaCepService
        │   │   ├── crypto/            # CryptoService
        │   │   ├── exchange/          # ExchangeService
        │   │   └── ibge/              # IbgeService
        │   ├── auth/                  # AuthService
        │   └── userDetails/           # UserDetailsServiceImpl
        │
        ├── dto/                       # Objetos de transferência
        │   ├── api/
        │   │   ├── bcb/               # Selic · IPCA · CDI · PTAX · History
        │   │   └── viaCep/            # ViaCepResponseDTO
        │   └── user/                  # UserRequestDTO · UserResponseDTO · LoginRequestDTO
        │
        ├── model/                     # Entidades JPA
        │   └── UserEntity
        │
        ├── repository/
        │   └── user/                  # UserRepository
        │
        ├── mappers/                   # UserMapper (MapStruct)
        │
        ├── validators/                # Validações customizadas
        │   ├── annotations/           # @ValidCep
        │   └── api/                   # ViaCepValidator
        │
        └── exception/                 # Tratamento de erros
            ├── customized/            # BcbApiException · ViaCepException
            └── global/                # GlobalExceptionHandler
```

---

## Fluxo do Sistema

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                          CLIENTE (Browser)                          │
  └───────────────────────────────┬─────────────────────────────────────┘
                                  │  HTTP Request
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                        FRONTEND  (Vite :5173)                       │
  │                                                                     │
  │   App.tsx  ──►  Component  ──►  API call (fetch / axios)            │
  └───────────────────────────────┬─────────────────────────────────────┘
                                  │  REST (JSON)
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                       BACKEND  (Spring Boot :8080)                  │
  │                                                                     │
  │  ┌─────────────────────────────────────────────────────────────┐   │
  │  │                    Security Filter Chain                     │   │
  │  │   CorsFilter  ──►  JwtFilter  ──►  SecurityConfig           │   │
  │  └──────────────────────────┬──────────────────────────────────┘   │
  │                             │  autenticado                          │
  │                             ▼                                       │
  │  ┌──────────────┐    ┌─────────────┐    ┌──────────────────────┐   │
  │  │  Controller  │──► │   Service   │──► │  RestClient          │   │
  │  │              │    │             │    │  · 5s connectTimeout  │   │
  │  │  /api/bcb    │    │  BcbService │    │  · 15s requestTimeout │   │
  │  │  /api/cep    │    │  ViaCep...  │    │  · text/html workaround│  │
  │  │  /api/auth   │    │  Auth...    │    └──────────┬───────────┘   │
  │  └──────┬───────┘    └─────────────┘               │               │
  │         │                                           │               │
  │         │  DTO / ResponseEntity                     │               │
  │         ◄───────────────────────────────────────────┘               │
  │                                                                     │
  │  ┌─────────────────────────────────────────────────────────────┐   │
  │  │                  Cache  (@Cacheable)                         │   │
  │  │   dev: simple (ConcurrentMap)  │  prod: Caffeine 30min TTL  │   │
  │  └─────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  ┌─────────────────────────────────────────────────────────────┐   │
  │  │                  Banco de Dados                              │   │
  │  │   dev: H2 in-memory            │  prod: PostgreSQL           │   │
  │  └─────────────────────────────────────────────────────────────┘   │
  └───────────────────────────────┬─────────────────────────────────────┘
                                  │  HTTP (RestClient)
                                  ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │                         APIs EXTERNAS                               │
  │                                                                     │
  │   BCB ──────── Selic · IPCA · CDI · PTAX  (api.bcb.gov.br)        │
  │   ViaCEP ───── Endereço por CEP            (viacep.com.br)         │
  │   CoinGecko ── Cotação de criptomoedas     (api.coingecko.com)     │
  │   Frankfurter ─ Câmbio + histórico         (api.frankfurter.app)   │
  │   ExchangeRate ─ Taxas de câmbio           (exchangerate-api.com)  │
  │   IBGE ──────── Estados e municípios       (servicodados.ibge.gov) │
  │   BrasilAPI ─── Dados bancários            (brasilapi.com.br)      │
  └─────────────────────────────────────────────────────────────────────┘
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Backend | Spring Boot 3.5 · Java 21 · Spring Security · JWT |
| Persistência | JPA / Hibernate · H2 (dev) · PostgreSQL (prod) |
| Cache | Simple (dev) · Caffeine (prod) |
| Documentação | SpringDoc OpenAPI · Swagger UI |
| Build | Maven · Vite |