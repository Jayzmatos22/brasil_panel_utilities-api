package com.brasilpanel.backend.dto.api.coinMarketCap;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.Map;

/**
 * Item de /v1/cryptocurrency/listings/latest — uma moeda do ranking por market cap.
 *
 * <p>Diferente do CoinGecko, a CoinMarketCap não devolve URL de imagem nesta resposta.
 * O logo é derivado do id pelo padrão público do CDN (ver
 * {@code CoinMarketCapService#logoUrl}), o que evita gastar créditos com
 * /v1/cryptocurrency/info só para exibir ícones.
 */
public record CmcListingDTO(
        Integer id,
        String name,
        String symbol,
        String slug,
        @JsonAlias("cmc_rank") Integer cmcRank,
        @JsonAlias("circulating_supply") Double circulatingSupply,
        @JsonAlias("total_supply") Double totalSupply,
        @JsonAlias("max_supply") Double maxSupply,
        /** Cotações por moeda de referência — ex: {"BRL": {...}} */
        Map<String, CmcQuoteDTO> quote
) {

    /** Cotação na moeda pedida, ou null se a API não devolveu essa conversão. */
    public CmcQuoteDTO quoteIn(String currency) {
        return quote != null ? quote.get(currency) : null;
    }
}