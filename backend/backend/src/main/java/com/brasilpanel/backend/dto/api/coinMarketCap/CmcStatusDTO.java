package com.brasilpanel.backend.dto.api.coinMarketCap;

import com.fasterxml.jackson.annotation.JsonAlias;

/**
 * Bloco {@code status} presente em toda resposta da CoinMarketCap, inclusive nas de erro.
 *
 * <p>{@code creditCount} é o custo real da chamada segundo a própria API — é ele que
 * alimenta o controle de cota mensal (plano Basic: 15.000 créditos/mês). Nunca estimar
 * o custo: usar sempre o valor devolvido aqui.
 */
public record CmcStatusDTO(
        @JsonAlias("error_code") Integer errorCode,
        @JsonAlias("error_message") String errorMessage,
        @JsonAlias("credit_count") Integer creditCount,
        @JsonAlias("total_count") Integer totalCount
) {

    /** A CoinMarketCap sinaliza sucesso com error_code = 0. */
    public boolean isSuccess() {
        return errorCode != null && errorCode == 0;
    }
}