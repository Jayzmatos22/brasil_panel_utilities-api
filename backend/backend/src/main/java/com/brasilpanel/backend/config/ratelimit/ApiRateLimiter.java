package com.brasilpanel.backend.config.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Tetos de requisições, em janela fixa, para as rotas públicas.
 *
 * <p>Usa o Caffeine que já é dependência do projeto, no mesmo espírito do
 * {@link com.brasilpanel.backend.service.auth.LoginAttemptLimiter} — trazer uma
 * biblioteca de rate limiting para o que cabe em poucas dezenas de linhas não se paga.
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
    private static final Duration EMAIL_WINDOW = Duration.ofHours(1);

    /**
     * O teto global usa janela de um DIA, e não a mesma hora do teto por cliente,
     * porque ele existe para não estourar a cota do provedor de e-mail — e cota de
     * provedor é diária. Ver RateLimitProperties#emailsPerDayGlobal.
     */
    private static final Duration EMAIL_GLOBAL_WINDOW = Duration.ofDays(1);

    /** Chave única do contador global: não é um cliente, é a instância inteira. */
    private static final String GLOBAL_KEY = "__global__";

    private final RateLimitProperties properties;
    private final Cache<String, Integer> hitsByClient;
    private final Cache<String, Integer> emailHitsByClient;

    /**
     * Contador global das rotas que disparam e-mail. Vive num cache de uma entrada só
     * para herdar a expiração por escrita do Caffeine — zera a janela sem agendador.
     */
    private final Cache<String, AtomicInteger> emailHitsGlobal;

    public ApiRateLimiter(RateLimitProperties properties) {
        this.properties = properties;
        // As entradas expiram ao fim da janela, então não há limpeza a fazer.
        this.hitsByClient = Caffeine.newBuilder()
                .expireAfterWrite(WINDOW)
                .maximumSize(properties.maxTrackedClients())
                .build();
        this.emailHitsByClient = Caffeine.newBuilder()
                .expireAfterWrite(EMAIL_WINDOW)
                .maximumSize(properties.maxTrackedClients())
                .build();
        this.emailHitsGlobal = Caffeine.newBuilder()
                .expireAfterWrite(EMAIL_GLOBAL_WINDOW)
                .maximumSize(1)
                .build();
    }

    /**
     * Registra uma requisição do cliente e diz se ela cabe no teto das rotas de dados.
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

    /**
     * Teto das rotas que disparam e-mail (cadastro e reenvio de código).
     *
     * <p>São <b>dois</b> tetos, e o global não é redundante. O identificador do cliente
     * vem do {@code X-Forwarded-For}, que é forjável (ver {@link RateLimitFilter}), então
     * o teto por cliente sozinho não segura quem varia o header a cada requisição — e o
     * que está em jogo aqui é a cota do provedor de e-mail e o envio de mensagens para
     * endereços de terceiros. O teto global não depende de identidade nenhuma: é o piso
     * que nenhum header contorna.
     *
     * @return {@code true} se a requisição deve ser atendida
     */
    public boolean tryConsumeEmail(String clientId) {
        if (!properties.enabled()) {
            return true;
        }
        // Global primeiro: uma vez estourado, nem vale sujar o contador por cliente.
        int global = emailHitsGlobal.get(GLOBAL_KEY, k -> new AtomicInteger()).incrementAndGet();
        if (global > properties.emailsPerDayGlobal()) {
            return false;
        }
        int hits = emailHitsByClient.asMap().merge(key(clientId), 1, Integer::sum);
        return hits <= properties.emailsPerHour();
    }

    /** Segundos que o cliente deve aguardar — o resto da janela, no pior caso. */
    public long retryAfterSeconds() {
        return WINDOW.toSeconds();
    }

    /** Idem, para as rotas que disparam e-mail. */
    public long emailRetryAfterSeconds() {
        return EMAIL_WINDOW.toSeconds();
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
