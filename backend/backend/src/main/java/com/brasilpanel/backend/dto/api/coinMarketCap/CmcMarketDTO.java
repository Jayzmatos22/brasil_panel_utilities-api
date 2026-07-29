package com.brasilpanel.backend.dto.api.coinMarketCap;

import java.time.LocalDateTime;

/**
 * Moeda como o painel consome — já reconstruída a partir do snapshot no banco.
 *
 * <p>{@code fetchedAt} é exposto de propósito: é o que permite ao frontend deixar
 * explícito que o dado vem de um snapshot do backend ("CoinMarketCap · atualizado
 * há 4 min"), e não de uma chamada ao vivo.
 *
 * <p>Variações de 1h e 7d e a dominância não existem na fonte CoinGecko — são o que
 * diferencia de verdade as duas abas do painel.
 */
public record CmcMarketDTO(
        Integer id,
        String symbol,
        String name,
        String slug,
        Integer rank,
        Double currentPrice,
        Double marketCap,
        Double volume24h,
        Double percentChange1h,
        Double percentChange24h,
        Double percentChange7d,
        Double marketCapDominance,
        String imageUrl,
        LocalDateTime fetchedAt
) {}