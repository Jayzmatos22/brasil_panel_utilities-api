package com.brasilpanel.backend.dto.api.coinMarketCap;

import com.fasterxml.jackson.annotation.JsonAlias;

/**
 * Cotação de uma moeda numa moeda de referência específica.
 *
 * <p>Na resposta da CoinMarketCap isso vem dentro de {@code quote}, chaveado pelo código
 * da moeda — ex: {@code quote.BRL}. O plano Basic permite apenas 1 conversão por chamada,
 * então na prática só existe a entrada "BRL".
 *
 * <p>Variações de 1h e 7d não existem na resposta do CoinGecko usada hoje: são o
 * diferencial informativo desta fonte.
 */
public record CmcQuoteDTO(
        Double price,
        @JsonAlias("volume_24h") Double volume24h,
        @JsonAlias("percent_change_1h") Double percentChange1h,
        @JsonAlias("percent_change_24h") Double percentChange24h,
        @JsonAlias("percent_change_7d") Double percentChange7d,
        @JsonAlias("market_cap") Double marketCap,
        /**
         * Fatia desta moeda no market cap total do mercado, em % — ex: 58.67 para o BTC.
         * Vem de graça no payload de listagem: dispensa o endpoint /global-metrics
         * (economia de ~1.440 créditos/mês) e permite derivar o market cap total
         * do mercado por aritmética: marketCap ÷ dominância × 100.
         */
        @JsonAlias("market_cap_dominance") Double marketCapDominance
) {}