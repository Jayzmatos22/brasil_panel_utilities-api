package com.brasilpanel.backend.config.cache;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;

import java.lang.reflect.Method;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CacheConfigTest {

    private static final String BASE_PACKAGE = "com.brasilpanel.backend";

    private final CacheTtlProperties ttl = defaultTtl();
    private final CacheManager cacheManager = initializedCacheManager(ttl);

    @Test
    @DisplayName("todo nome usado em @Cacheable possui um cache declarado no catálogo")
    void everyCacheableNameIsRegistered() {
        Set<String> declared = Set.copyOf(cacheManager.getCacheNames());
        Set<String> used = scanCacheableNames();

        assertThat(used)
                .as("a varredura precisa encontrar os @Cacheable — se vier vazia, o teste não prova nada")
                .isNotEmpty();
        assertThat(declared)
                .as("caches usados em @Cacheable mas ausentes do CacheCatalog falhariam só em runtime")
                .containsAll(used);
    }

    @Test
    @DisplayName("cacheManager registra exatamente as entradas do catálogo")
    void registersEveryCatalogEntry() {
        List<String> expected = CacheCatalog.specs(ttl).stream().map(CacheSpec::name).toList();

        assertThat(cacheManager.getCacheNames())
                .hasSameSizeAs(expected)
                .containsExactlyInAnyOrderElementsOf(expected);
    }

    @Test
    @DisplayName("nome desconhecido não vira cache criado sob demanda")
    void unknownCacheIsNotCreatedOnDemand() {
        assertThat(cacheManager.getCache("cache-que-nao-existe")).isNull();
    }

    @Test
    @DisplayName("CacheSpec rejeita definição inválida")
    void cacheSpecRejectsInvalidValues() {
        assertThatThrownBy(() -> new CacheSpec(" ", Duration.ofHours(1), 10))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new CacheSpec("x", Duration.ZERO, 10))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("TTL");
        assertThatThrownBy(() -> new CacheSpec("x", Duration.ofHours(1), 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("maximumSize");
    }

    @Test
    @DisplayName("CacheTtlProperties rejeita TTL não positivo")
    void ttlPropertiesRejectNonPositiveDuration() {
        assertThatThrownBy(() -> new CacheTtlProperties(
                Duration.ZERO, Duration.ofHours(24), Duration.ofHours(12),
                Duration.ofMinutes(60), Duration.ofMinutes(15), Duration.ofMinutes(5)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("app.cache.ttl.static-data");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static CacheManager initializedCacheManager(CacheTtlProperties ttl) {
        SimpleCacheManager cacheManager = new CacheConfig().cacheManager(ttl);
        // No contexto do Spring o ciclo de vida do bean (InitializingBean) faz isso
        cacheManager.afterPropertiesSet();
        return cacheManager;
    }

    private static CacheTtlProperties defaultTtl() {
        return new CacheTtlProperties(
                Duration.ofDays(7),
                Duration.ofHours(24),
                Duration.ofHours(12),
                Duration.ofMinutes(60),
                Duration.ofMinutes(15),
                Duration.ofMinutes(5));
    }

    /** Coleta os nomes de cache de todos os {@code @Cacheable} da aplicação. */
    private static Set<String> scanCacheableNames() {
        var provider = new ClassPathScanningCandidateComponentProvider(false);
        provider.addIncludeFilter((metadataReader, metadataReaderFactory) -> true);

        return provider.findCandidateComponents(BASE_PACKAGE).stream()
                .map(BeanDefinition::getBeanClassName)
                .filter(Objects::nonNull)
                .map(CacheConfigTest::loadClass)
                .flatMap(type -> Arrays.stream(type.getDeclaredMethods()))
                .map(CacheConfigTest::cacheNamesOf)
                .flatMap(List::stream)
                .collect(Collectors.toSet());
    }

    private static List<String> cacheNamesOf(Method method) {
        Cacheable cacheable = AnnotatedElementUtils.findMergedAnnotation(method, Cacheable.class);
        if (cacheable == null) {
            return List.of();
        }
        return Stream.concat(Arrays.stream(cacheable.value()), Arrays.stream(cacheable.cacheNames()))
                .distinct()
                .toList();
    }

    private static Class<?> loadClass(String className) {
        try {
            // initialize = false: inspeção por reflexão não deve disparar inicialização estática
            return Class.forName(className, false, CacheConfigTest.class.getClassLoader());
        } catch (ClassNotFoundException | LinkageError e) {
            throw new IllegalStateException("Falha ao carregar " + className + " durante a varredura", e);
        }
    }
}