package com.brasilpanel.backend.config.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Teto de requisições por cliente nas rotas públicas de dados.
 *
 * @param enabled           permite desligar em dev sem mexer em código
 * @param requestsPerMinute teto por cliente na janela de 1 minuto
 * @param maxTrackedClients teto de IPs rastreados — limita o consumo de memória
 *                          do próprio limitador, que senão viraria o alvo do abuso
 */
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(

        @DefaultValue("true") boolean enabled,

        // Uma tela do painel dispara dezenas de chamadas: um teto apertado
        // castigaria o uso normal antes de conter qualquer abuso.
        @DefaultValue("120") int requestsPerMinute,

        @DefaultValue("10000") long maxTrackedClients
) {

    public RateLimitProperties {
        if (requestsPerMinute <= 0) {
            throw new IllegalArgumentException(
                    "app.rate-limit.requests-per-minute deve ser maior que zero (recebido: "
                            + requestsPerMinute + ")");
        }
        if (maxTrackedClients <= 0) {
            throw new IllegalArgumentException(
                    "app.rate-limit.max-tracked-clients deve ser maior que zero (recebido: "
                            + maxTrackedClients + ")");
        }
    }
}