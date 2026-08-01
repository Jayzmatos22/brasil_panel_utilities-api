package com.brasilpanel.backend.config.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Teto de requisições por cliente, em janela fixa de 1 minuto.
 *
 * <p>Usa o Caffeine que já é dependência do projeto, no mesmo espírito do
 * {@link com.brasilpanel.backend.service.auth.LoginAttemptLimiter} — trazer uma
 * biblioteca de rate limiting para o que cabe em trinta linhas não se paga.
 *
 * <p><b>Janela fixa, não deslizante.</b> Um cliente pode emitir o dobro do teto
 * na virada (fim de uma janela + início da outra). É uma imprecisão conhecida e
 * aceita: o objetivo é conter abuso sustentado — iterar símbolos para queimar
 * cota de API externa, varrer endpoints —, não policiar rajadas de um segundo.
 *
 * <p><b>A contagem vive na memória da instância.</b> Com mais de uma réplica,
 * cada uma mantém o próprio contador e o teto efetivo é multiplicado pelo número
 * de réplicas. Para o porte atual (instância única no Render) é suficiente; se o
 * projeto escalar horizontalmente, a contagem precisa migrar para um store
 * compartilhado — a mesma ressalva vale para o LoginAttemptLimiter e para o cache.
 */
@Component
@EnableConfigurationProperties(RateLimitProperties.class)
public class ApiRateLimiter {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final RateLimitProperties properties;
    private final Cache<String, Integer> hitsByClient;

    public ApiRateLimiter(RateLimitProperties properties) {
        this.properties = properties;
        // As entradas expiram ao fim da janela, então não há limpeza a fazer.
        this.hitsByClient = Caffeine.newBuilder()
                .expireAfterWrite(WINDOW)
                .maximumSize(properties.maxTrackedClients())
                .build();
    }

    /**
     * Registra uma requisição do cliente e diz se ela cabe no teto.
     *
     * @return {@code true} se a requisição deve ser atendida
     */
    public boolean tryConsume(String clientId) {
        if (!properties.enabled()) {
            return true;
        }
        int hits = hitsByClient.asMap().merge(key(clientId), 1, Integer::sum);
        return hits <= properties.requestsPerMinute();
    }

    /** Segundos que o cliente deve aguardar — o resto da janela, no pior caso. */
    public long retryAfterSeconds() {
        return WINDOW.toSeconds();
    }

    /** Requisições já contabilizadas para o cliente na janela corrente. */
    public int currentHits(String clientId) {
        Integer hits = hitsByClient.getIfPresent(key(clientId));
        return hits == null ? 0 : hits;
    }

    private static String key(String clientId) {
        return clientId == null || clientId.isBlank() ? "desconhecido" : clientId;
    }
}