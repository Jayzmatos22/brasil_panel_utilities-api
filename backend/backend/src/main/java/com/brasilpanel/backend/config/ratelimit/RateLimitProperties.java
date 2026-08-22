package com.brasilpanel.backend.config.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Tetos de requisições nas rotas públicas.
 *
 * @param enabled              permite desligar em dev sem mexer em código
 * @param requestsPerMinute    teto por cliente na janela de 1 minuto, nas rotas de dados
 * @param maxTrackedClients    teto de IPs rastreados — limita o consumo de memória
 *                             do próprio limitador, que senão viraria o alvo do abuso
 * @param emailsPerHour        teto por cliente, por hora, nas rotas que disparam e-mail
 * @param emailsPerDayGlobal   teto da instância inteira, por DIA, nas rotas que disparam
 *                             e-mail — ver {@link ApiRateLimiter#tryConsumeEmail}
 */
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(

        @DefaultValue("true") boolean enabled,

        // Uma tela do painel dispara dezenas de chamadas: um teto apertado
        // castigaria o uso normal antes de conter qualquer abuso.
        @DefaultValue("120") int requestsPerMinute,

        @DefaultValue("10000") long maxTrackedClients,

        // Cadastrar-se e pedir reenvio de código são ações raras: 5 por hora já é
        // folgado para alguém que errou o e-mail e tentou de novo.
        @DefaultValue("5") int emailsPerHour,

        // Janela diária porque é assim que a cota do provedor é expressa: o plano
        // gratuito do Resend dá 3.000/mês com teto de 100/DIA, e é o diário que morde
        // primeiro. 80 deixa margem sob esse teto e segue muito acima do uso real.
        @DefaultValue("80") int emailsPerDayGlobal
) {

    public RateLimitProperties {
        requirePositive("requests-per-minute", requestsPerMinute);
        requirePositive("emails-per-hour", emailsPerHour);
        requirePositive("emails-per-day-global", emailsPerDayGlobal);
        if (maxTrackedClients <= 0) {
            throw new IllegalArgumentException(
                    "app.rate-limit.max-tracked-clients deve ser maior que zero (recebido: "
                            + maxTrackedClients + ")");
        }
    }

    private static void requirePositive(String property, int value) {
        if (value <= 0) {
            throw new IllegalArgumentException(
                    "app.rate-limit." + property + " deve ser maior que zero (recebido: " + value + ")");
        }
    }
}
