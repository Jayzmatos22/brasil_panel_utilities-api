package com.brasilpanel.backend.dto.api.coinGecko;

// CoinGecko resultado por nome
public record CryptoCoinGeckoByNameDTO(
        String id,
        Double priceBrl
) {}