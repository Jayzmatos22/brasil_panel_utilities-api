package com.brasilpanel.backend.config.cache;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

/**
 * Catálogo declarativo dos caches da aplicação, agrupado por fonte de dados.
 *
 * <p>Cada nome aqui precisa corresponder exatamente ao valor usado em
 * {@code @Cacheable} — o {@code CacheManager} não cria caches sob demanda
 * (ver {@link CacheConfig}).
 *
 * <p>O {@code maximumSize} é dimensionado pela cardinalidade da chave do método:
 * métodos sem parâmetro guardam 1 entrada; métodos com chave (CEP, símbolo,
 * código de banco) precisam de espaço para as combinações realmente consultadas.
 */
final class CacheCatalog {

    /** Cardinalidade padrão: métodos sem parâmetro ou com poucas combinações de chave. */
    private static final long SMALL = 10;

    private CacheCatalog() {
    }

    static List<CacheSpec> specs(CacheTtlProperties ttl) {
        return Stream.of(
                        ibge(ttl),
                        reference(ttl),
                        ipeaMacro(ttl),
                        ipeaBalancoPagamentos(ttl),
                        ipeaExportacoes(ttl),
                        ipeaImpostos(ttl),
                        ipeaCambio(ttl),
                        ipeaMercado(ttl),
                        worldBank(ttl),
                        bcb(ttl),
                        exchangeRates(ttl),
                        commodities(ttl),
                        equities(ttl),
                        crypto(ttl))
                .flatMap(specs -> specs)
                .toList();
    }

    // ── IBGE — malha territorial (quase estática) ────────────────────────────

    private static Stream<CacheSpec> ibge(CacheTtlProperties ttl) {
        return Stream.of(
                // Estados: 27 entradas fixas, praticamente nunca mudam
                new CacheSpec("ibge-states", ttl.staticData(), SMALL),
                // Cidades: chave = estado + filtro → até N combinações por estado
                new CacheSpec("ibge-cities", ttl.staticData(), 200),
                // Ranking de municípios por estado: dado estático (1 entrada)
                new CacheSpec("ibge-states-ranking", ttl.staticData(), 1));
    }

    // ── Dados de referência ──────────────────────────────────────────────────

    private static Stream<CacheSpec> reference(CacheTtlProperties ttl) {
        return Stream.of(
                // Lista de bancos raramente muda
                new CacheSpec("banks", ttl.halfDay(), SMALL),
                // BrasilAPI — banco por código (chave = código)
                new CacheSpec("bank-by-code", ttl.halfDay(), 300),
                // Salário mínimo é reajustado uma vez por ano
                new CacheSpec("salario-minimo", ttl.daily(), SMALL),
                // ViaCEP: CEP → endereço é praticamente imutável (base CORREIOS muda raramente)
                new CacheSpec("viacep", ttl.daily(), 500),
                // ViaCEP busca reversa: chave = uf|cidade|logradouro. Cardinalidade
                // maior que a do CEP direto porque cada termo digitado no filtro de
                // rua gera uma combinação nova.
                new CacheSpec("viacep-busca", ttl.daily(), 300),
                // IBGE/SIDRA — PIB por estado: divulgado anualmente (1 entrada)
                new CacheSpec("sidra-pib-estados", ttl.daily(), 1));
    }

    // ── IPEA — atualizações mensais/anuais ───────────────────────────────────

    private static Stream<CacheSpec> ipeaMacro(CacheTtlProperties ttl) {
        return daily(ttl,
                "ipea-emprego",
                "ipea-renda",
                "ipea-desigualdade",
                "ipea-macro",
                "ipea-precos",
                "ipea-populacao",
                "ipea-pib-mensal");
    }

    /** Balanço de pagamentos: reservas, transações correntes, investimento direto. */
    private static Stream<CacheSpec> ipeaBalancoPagamentos(CacheTtlProperties ttl) {
        return daily(ttl,
                "ipea-reservas-ativos",
                "ipea-transacoes-correntes",
                "ipea-balanca-comercial",
                "ipea-servicos",
                "ipea-renda-primaria",
                "ipea-investimento-direto",
                "ipea-conta-capital",
                "ipea-conta-financeira",
                "ipea-investimento-carteira",
                "ipea-servicos-despesa",
                "ipea-investimento-direto-ingressos",
                "ipea-balanca-transacoes-correntes-pib");
    }

    /** Exportações: totais, produtos básicos e grandes categorias econômicas. */
    private static Stream<CacheSpec> ipeaExportacoes(CacheTtlProperties ttl) {
        return daily(ttl,
                "ipea-exportacoes-total",
                "ipea-exportacoes-quantum",
                "ipea-exportacoes-produtos-basicos",
                "ipea-exportacoes-agricultura-pecuaria-quantum",
                "ipea-exportacoes-bens-consumo",
                "ipea-exportacoes-precos-bens-capital",
                "ipea-exportacoes-precos-bens-duraveis",
                "ipea-exportacoes-precos-bens-nao-duraveis",
                "ipea-exportacoes-valor-bens-intermediarios",
                "ipea-exportacoes-quantum-bens-intermediarios",
                "ipea-exportacoes-valor-combustiveis",
                "ipea-quantum-exportacoes");
    }

    /** Impostos federais. */
    private static Stream<CacheSpec> ipeaImpostos(CacheTtlProperties ttl) {
        return daily(ttl,
                "ipea-imposto-ii",
                "ipea-imposto-irpf",
                "ipea-imposto-irpj",
                "ipea-imposto-ir-total",
                "ipea-imposto-iof",
                "ipea-imposto-ipi",
                "ipea-imposto-itr");
    }

    /** Câmbio contratado — séries consolidadas pelo IPEA (não é cotação de mercado). */
    private static Stream<CacheSpec> ipeaCambio(CacheTtlProperties ttl) {
        return daily(ttl,
                "ipea-cambio-comercial",
                "ipea-cambio-comercial-exportacao",
                "ipea-cambio-comercial-importacao",
                "ipea-cambio-comercial-financeiro",
                "ipea-cambio-financeiro",
                "ipea-cambio-financeiro-compra",
                "ipea-cambio-financeiro-venda");
    }

    private static Stream<CacheSpec> ipeaMercado(CacheTtlProperties ttl) {
        return daily(ttl, "ipea-ibovespa-fechamento");
    }

    // ── World Bank ───────────────────────────────────────────────────────────

    private static Stream<CacheSpec> worldBank(CacheTtlProperties ttl) {
        return Stream.of(
                // PIB atualizado anualmente; 24h evita chamadas repetidas
                new CacheSpec("worldbank-pib-current", ttl.daily(), 5),
                // Histórico por ano: dado passado é imutável; o ano corrente pode ser
                // revisado raramente — 24h é conservador e suficiente
                new CacheSpec("worldbank-pib-year", ttl.daily(), 50),
                // Série histórica completa (1 entrada) para o gráfico
                new CacheSpec("worldbank-pib-series", ttl.daily(), 1));
    }

    // ── BCB — Banco Central ──────────────────────────────────────────────────

    private static Stream<CacheSpec> bcb(CacheTtlProperties ttl) {
        return Stream.concat(
                // Selic (reuniões COPOM a cada ~45 dias, mas o valor diário pode variar),
                // IPCA (divulgação mensal) e PTAX/CDI (diários, em dias úteis)
                hourly(ttl, "selic", "bcb-ipca", "bcb-ptax", "bcb-cdi"),
                daily(ttl, "selic-history"));
    }

    // ── Frankfurter — câmbio ─────────────────────────────────────────────────

    private static Stream<CacheSpec> exchangeRates(CacheTtlProperties ttl) {
        return Stream.of(
                // Cotações do dia
                new CacheSpec("frank-furter", ttl.hourly(), SMALL),
                new CacheSpec("frank-furter-last-30-days", ttl.hourly(), SMALL),
                // Histórico: dados passados nunca mudam
                new CacheSpec("frank-furter-history", ttl.daily(), 50),
                // Lista de moedas suportadas muda raramente (novas moedas ECB)
                new CacheSpec("frank-furter-currencies", ttl.daily(), 1));
    }

    // ── Metais ───────────────────────────────────────────────────────────────

    private static Stream<CacheSpec> commodities(CacheTtlProperties ttl) {
        return Stream.of(
                new CacheSpec("metals", ttl.hourly(), SMALL),
                // Histórico de metais: série diária muda 1x/dia → janela longa
                new CacheSpec("metals-history", ttl.halfDay(), 2),
                // Fixing LBMA: publicado 2x/dia útil → janela alinhada ao scheduler
                new CacheSpec("lbma-fixing", ttl.halfDay(), 2));
    }

    // ── Ações ────────────────────────────────────────────────────────────────

    private static Stream<CacheSpec> equities(CacheTtlProperties ttl) {
        return Stream.of(
                // AlphaVantage tem limite diário de requests — 15 min equilibra
                // frescor dos dados e economia de quota
                new CacheSpec("stocks", ttl.intraday(), 200),
                // Histórico de ações: série diária muda 1x/dia → janela longa
                new CacheSpec("stock-history", ttl.halfDay(), 100));
    }

    // ── Cripto ───────────────────────────────────────────────────────────────

    private static Stream<CacheSpec> crypto(CacheTtlProperties ttl) {
        return Stream.of(
                // CoinGecko free tier — 5 min é o mínimo razoável
                new CacheSpec("crypto-list", ttl.realtime(), 20),
                // Preço por nome: cache separado e keyed por moeda
                new CacheSpec("crypto-by-name", ttl.realtime(), 100),
                // CoinMarketCap — o TTL aqui não afeta o consumo de créditos: um miss
                // cai no Postgres, nunca na API. Só o scheduler gasta crédito.
                new CacheSpec("cmc-listings", ttl.realtime(), 20),
                new CacheSpec("cmc-quote-by-symbol", ttl.realtime(), 100),
                new CacheSpec("cmc-global", ttl.realtime(), 1));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static Stream<CacheSpec> daily(CacheTtlProperties ttl, String... names) {
        return withTtl(ttl.daily(), names);
    }

    private static Stream<CacheSpec> hourly(CacheTtlProperties ttl, String... names) {
        return withTtl(ttl.hourly(), names);
    }

    private static Stream<CacheSpec> withTtl(Duration ttl, String... names) {
        return Arrays.stream(names).map(name -> new CacheSpec(name, ttl, SMALL));
    }
}