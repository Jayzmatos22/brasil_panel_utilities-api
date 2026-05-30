package com.brasilpanel.backend.dto.api.coinGecko;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CryptoCoinGeckoMarketDTO(
        // 100 objetos na requisição
        String id,
        String symbol,
        String name,
        @JsonProperty("current_price") Double currentPrice,
        @JsonProperty("market_cap") Long marketCap,
        @JsonProperty("price_change_percentage_24h") Double priceChange24h,
        @JsonProperty("image") String imageUrl
) {}
