package com.brasilpanel.backend.config.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(

                // ── Quase estáticos ──────────────────────────────────────────────
                // Estados: 27 entradas fixas, praticamente nunca mudam
                build("ibge-states",              7,  TimeUnit.DAYS,    10),
                // Cidades: chave = estado+filtro → até N combinações por estado
                build("ibge-cities",              7,  TimeUnit.DAYS,   200),
                // Ranking de municípios por estado: dado estático (1 entrada)
                build("ibge-states-ranking",      7,  TimeUnit.DAYS,     1),

                // Lista de bancos raramente muda
                build("banks",                   12,  TimeUnit.HOURS,   10),

                // Salário mínimo é reajustado uma vez por ano
                build("salario-minimo",          24,  TimeUnit.HOURS,   10),

                // ── Dados econômicos (IPEA — atualizações mensais/anuais) ────────
                build("ipea-emprego",            24,  TimeUnit.HOURS,   10),
                build("ipea-renda",              24,  TimeUnit.HOURS,   10),
                build("ipea-desigualdade",       24,  TimeUnit.HOURS,   10),
                build("ipea-macro",              24,  TimeUnit.HOURS,   10),
                build("ipea-precos",             24,  TimeUnit.HOURS,   10),
                build("ipea-populacao",          24,  TimeUnit.HOURS,   10),

                // Câmbio Contratado e Taxas de Câmbio
                build("ipea-reservas-ativos",    24, TimeUnit.HOURS, 10),
                build("ipea-transacoes-correntes", 24, TimeUnit.HOURS, 10),
                build("ipea-balanca-comercial", 24, TimeUnit.HOURS, 10),
                build("ipea-servicos", 24, TimeUnit.HOURS, 10),
                build("ipea-renda-primaria", 24, TimeUnit.HOURS, 10),
                build("ipea-investimento-direto", 24, TimeUnit.HOURS, 10),
                build("ipea-conta-capital", 24, TimeUnit.HOURS, 10),
                build("ipea-conta-financeira", 24, TimeUnit.HOURS, 10),
                build("ipea-investimento-carteira", 24, TimeUnit.HOURS, 10),
                build("ipea-servicos-despesa", 24, TimeUnit.HOURS, 10),
                build("ipea-investimento-direto-ingressos", 24, TimeUnit.HOURS, 10),
                build("ipea-balanca-transacoes-correntes-pib",24, TimeUnit.HOURS, 10),


                // Exportações (Totais, Básicos e Grandes Categorias Econômicas)
                build("ipea-exportacoes-total", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-quantum", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-produtos-basicos", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-agricultura-pecuaria-quantum", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-bens-consumo", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-precos-bens-capital", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-precos-bens-duraveis", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-precos-bens-nao-duraveis", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-valor-bens-intermediarios", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-quantum-bens-intermediarios", 24, TimeUnit.HOURS, 10),
                build("ipea-exportacoes-valor-combustiveis", 24, TimeUnit.HOURS, 10),


                // Mercado - Ibovespa
                build("ipea-ibovespa-fechamento", 24, TimeUnit.HOURS, 10),


                // Impostos Federais
                build("ipea-imposto-ii", 24, TimeUnit.HOURS, 10),
                build("ipea-imposto-irpf", 24, TimeUnit.HOURS, 10),
                build("ipea-imposto-irpj", 24, TimeUnit.HOURS, 10),
                build("ipea-imposto-ir-total", 24, TimeUnit.HOURS, 10),
                build("ipea-imposto-iof", 24, TimeUnit.HOURS, 10),
                build("ipea-imposto-ipi", 24, TimeUnit.HOURS, 10),
                build("ipea-imposto-itr", 24, TimeUnit.HOURS, 10),


                // Câmbio Contratado
                build("ipea-cambio-comercial", 24, TimeUnit.HOURS, 10),
                build("ipea-cambio-comercial-exportacao", 24, TimeUnit.HOURS, 10),
                build("ipea-cambio-comercial-importacao", 24, TimeUnit.HOURS, 10),
                build("ipea-cambio-comercial-financeiro", 24, TimeUnit.HOURS, 10),
                build("ipea-cambio-financeiro", 24, TimeUnit.HOURS, 10),
                build("ipea-cambio-financeiro-compra", 24, TimeUnit.HOURS, 10),
                build("ipea-cambio-financeiro-venda", 24, TimeUnit.HOURS, 10),

                // Pib
                build("ipea-pib-mensal", 24, TimeUnit.HOURS, 10),

                // ── World Bank ───────────────────────────────────────────────────
                // PIB atualizado anualmente; 24h evita chamadas repetidas
                build("worldbank-pib-current",   24,  TimeUnit.HOURS,    5),
                // Histórico por ano: dado passado é imutável; ano corrente pode ser
                // revisado raramente — 24h é conservador e suficiente
                build("worldbank-pib-year",      24,  TimeUnit.HOURS,   50),
                // Série histórica completa (1 entrada) para o gráfico
                build("worldbank-pib-series",    24,  TimeUnit.HOURS,    1),

                // ── IBGE/SIDRA ───────────────────────────────────────────────────
                // PIB por estado: divulgado anualmente; 1 entrada (ano mais recente)
                build("sidra-pib-estados",       24,  TimeUnit.HOURS,    1),

                // ── ViaCep ───────────────────────────────────────────────────────
                // CEP → endereço é praticamente imutável (base CORREIOS muda raramente)
                build("viacep",                  24,  TimeUnit.HOURS,  500),

                // ── BrasilAPI — banco por código ─────────────────────────────────
                build("bank-by-code",            12,  TimeUnit.HOURS,  300),

                // ── Histórico Frankfurter (dados passados nunca mudam) ───────────
                build("frank-furter-history",    24,  TimeUnit.HOURS,   50),

                // Lista de moedas suportadas muda raramente (novas moedas ECB)
                build("frank-furter-currencies", 24,  TimeUnit.HOURS,    1),

                // ── BCB — Banco Central ──────────────────────────────────────────
                // Selic: reuniões COPOM a cada ~45 dias, mas valor diário pode variar
                build("selic",                   60,  TimeUnit.MINUTES, 10),
                build("selic-history",           24,  TimeUnit.HOURS,   10),

                // IPCA: divulgado mensalmente pelo IBGE via BCB
                build("bcb-ipca",                60,  TimeUnit.MINUTES, 10),

                // PTAX e CDI: atualizados diariamente em dias úteis
                build("bcb-ptax",                60,  TimeUnit.MINUTES, 10),
                build("bcb-cdi",                 60,  TimeUnit.MINUTES, 10),

                // ── Cotações diárias ─────────────────────────────────────────────
                build("frank-furter",            60,  TimeUnit.MINUTES, 10),
                build("frank-furter-last-30-days", 60, TimeUnit.MINUTES, 10),
                build("metals",                  60,  TimeUnit.MINUTES, 10),
                // Histórico de metais: série diária muda 1x/dia → janela longa
                build("metals-history",          12,  TimeUnit.HOURS,    2),
                // Fixing LBMA: publicado 2x/dia útil → janela alinhada ao scheduler
                build("lbma-fixing",             12,  TimeUnit.HOURS,    2),

                // ── Cotações em tempo real ───────────────────────────────────────
                // Ações: AlphaVantage (limite diário de requests — 15 min equilibra
                // frescor dos dados e economia de quota)
                build("stocks",                  15,  TimeUnit.MINUTES, 200),
                // Histórico de ações: série diária muda 1x/dia → janela longa
                build("stock-history",           12,  TimeUnit.HOURS,   100),

                // Crypto: CoinGecko free tier — 5 min é o mínimo razoável
                build("crypto-list",              5,  TimeUnit.MINUTES,  20),
                // Preço por nome: cache separado e keyed por moeda
                build("crypto-by-name",           5,  TimeUnit.MINUTES, 100)
        ));
        return manager;
    }

    private CaffeineCache build(String name, long duration, TimeUnit unit, long maxSize) {
        return new CaffeineCache(name,
                Caffeine.newBuilder()
                        .expireAfterWrite(duration, unit)
                        .maximumSize(maxSize)
                        .build());
    }
}
