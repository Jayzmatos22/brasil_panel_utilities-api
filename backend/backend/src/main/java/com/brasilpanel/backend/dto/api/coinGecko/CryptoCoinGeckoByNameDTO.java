package com.brasilpanel.backend.dto.api.coinGecko;

import java.time.LocalDateTime;

/**
 * CoinGecko resultado por nome.
 *
 * <p>{@code fetchedAt} distingue as duas origens possíveis da mesma resposta: moeda
 * no top 100 sai do snapshot no banco e carrega a data daquele batch; moeda fora do
 * top 100 é cotada ao vivo e carrega o instante da chamada.
 */
public record CryptoCoinGeckoByNameDTO(
        String id,
        Double priceBrl,
        /** Quando o preço foi buscado da fonte */
        LocalDateTime fetchedAt
) {}