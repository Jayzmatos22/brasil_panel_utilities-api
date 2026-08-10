package com.brasilpanel.backend.config.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Cache em memória (Caffeine) das respostas das APIs externas consumidas pelo painel.
 *
 * <p>Os caches são declarados explicitamente em {@link CacheCatalog}, cada um com
 * TTL e capacidade próprios. Usa-se {@link SimpleCacheManager} — e não
 * {@code CaffeineCacheManager} — justamente porque ele <em>não</em> cria caches sob
 * demanda: um nome errado em {@code @Cacheable} falha na primeira chamada em vez de
 * criar silenciosamente um cache sem expiração e sem limite de tamanho.
 *
 * <p>As janelas de expiração vêm de {@link CacheTtlProperties} (prefixo
 * {@code app.cache.ttl}), podendo ser ajustadas por perfil sem recompilar.
 *
 * <p>{@code recordStats()} habilita as métricas de hit/miss por cache, expostas
 * automaticamente pelo Actuator/Micrometer quando o starter estiver presente.
 */
@Configuration(proxyBeanMethods = false)
@EnableCaching
@EnableConfigurationProperties(CacheTtlProperties.class)
public class CacheConfig {

    @Bean
    public SimpleCacheManager cacheManager(CacheTtlProperties ttl) {
        List<CacheSpec> specs = CacheCatalog.specs(ttl);
        rejectDuplicates(specs);

        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(specs.stream().map(CacheConfig::toCaffeineCache).toList());
        return cacheManager;
    }

    private static CaffeineCache toCaffeineCache(CacheSpec spec) {
        return new CaffeineCache(spec.name(),
                Caffeine.newBuilder()
                        .expireAfterWrite(spec.ttl())
                        .maximumSize(spec.maximumSize())
                        .recordStats()
                        .build());

    }

    /**
     * Um nome repetido no catálogo faria a última definição sobrescrever as anteriores
     * em silêncio — com TTL possivelmente diferente do pretendido. Falha na subida.
     */
    private static void rejectDuplicates(List<CacheSpec> specs) {
        List<String> duplicates = specs.stream()
                .collect(Collectors.groupingBy(CacheSpec::name, Collectors.counting()))
                .entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();

        if (!duplicates.isEmpty()) {
            throw new IllegalStateException("Caches declarados em duplicidade no CacheCatalog: " + duplicates);
        }
    }
}