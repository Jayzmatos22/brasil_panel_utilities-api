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
                // Estados e cidades do IBGE praticamente não mudam
                build("ibge-states",              7,  TimeUnit.DAYS,    10),
                build("ibge-cities",              7,  TimeUnit.DAYS,    10),

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

                // ── Histórico Frankfurter (dados passados nunca mudam) ───────────
                build("frank-furter-history",    24,  TimeUnit.HOURS,   50),

                // ── Cotações diárias ─────────────────────────────────────────────
                build("frank-furter",            60,  TimeUnit.MINUTES, 10),
                build("frank-furter-last-30-days", 60, TimeUnit.MINUTES, 10),
                build("metals",                  60,  TimeUnit.MINUTES, 10),
                build("selic",                   60,  TimeUnit.MINUTES, 10),

                // ── Cotações em tempo real ───────────────────────────────────────
                // Ações: AlphaVantage (limite diário de requests — 15 min equilibra
                // frescor dos dados e economia de quota)
                build("stocks",                  15,  TimeUnit.MINUTES, 200),

                // Crypto: CoinGecko free tier — 5 min é o mínimo razoável
                build("crypto-list",              5,  TimeUnit.MINUTES, 20)
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
