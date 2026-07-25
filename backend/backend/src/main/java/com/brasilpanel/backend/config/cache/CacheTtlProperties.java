package com.brasilpanel.backend.config.cache;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Janelas de expiração (TTL) dos caches, agrupadas por cadência de atualização
 * da fonte de dados. Cada tier pode ser sobrescrito por perfil sem recompilar:
 *
 * <pre>
 * app:
 *   cache:
 *     ttl:
 *       realtime: 1m
 * </pre>
 *
 * @param staticData dados praticamente imutáveis — malha territorial do IBGE
 * @param daily      séries revisadas no máximo 1x/dia — IPEA, World Bank, SIDRA, ViaCEP
 * @param halfDay    publicação intradiária esparsa — fixing LBMA, metais, lista de bancos
 * @param hourly     indicadores do BCB e câmbio, que variam ao longo do dia útil
 * @param intraday   cotações sujeitas a cota diária de API — AlphaVantage
 * @param realtime   cripto — menor janela viável no free tier do CoinGecko
 */
@Validated
@ConfigurationProperties("app.cache.ttl")
public record CacheTtlProperties(

        @NotNull @DefaultValue("7d") Duration staticData,
        @NotNull @DefaultValue("24h") Duration daily,
        @NotNull @DefaultValue("12h") Duration halfDay,
        @NotNull @DefaultValue("60m") Duration hourly,
        @NotNull @DefaultValue("15m") Duration intraday,
        @NotNull @DefaultValue("5m") Duration realtime
) {

    public CacheTtlProperties {
        requirePositive("static-data", staticData);
        requirePositive("daily", daily);
        requirePositive("half-day", halfDay);
        requirePositive("hourly", hourly);
        requirePositive("intraday", intraday);
        requirePositive("realtime", realtime);
    }

    private static void requirePositive(String property, Duration ttl) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException(
                    "app.cache.ttl." + property + " deve ser maior que zero (recebido: " + ttl + ")");
        }
    }
}