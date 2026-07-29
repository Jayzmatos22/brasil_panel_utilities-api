package com.brasilpanel.backend.dto.api.coinMarketCap;

/**
 * Envelope genérico da CoinMarketCap: toda resposta vem como {@code {status, data}}.
 *
 * @param <T> formato do bloco {@code data} — lista nos endpoints de listagem,
 *            mapa nos endpoints por símbolo, objeto nas métricas globais
 */
public record CmcResponseDTO<T>(CmcStatusDTO status, T data) {}