package com.brasilpanel.backend.dto.api.coinMarketCap;

import java.time.LocalDateTime;

/**
 * Panorama do mercado derivado do batch já salvo — custo zero em créditos.
 *
 * <p>Substitui o endpoint /v1/global-metrics (economia de ~1.440 créditos/mês):
 * o market cap total sai da dominância de uma moeda conhecida
 * ({@code marketCap ÷ dominância × 100}), que a CoinMarketCap devolve dentro de
 * cada cotação da listagem.
 *
 * @param totalMarketCap    market cap total do mercado, derivado da dominância
 * @param btcDominance      fatia do Bitcoin no mercado, em %
 * @param top100Volume24h   soma do volume 24h das moedas do batch. <b>Não</b> é o volume
 *                          global do mercado — só o das moedas que acompanhamos
 * @param coinsTracked      quantas moedas entraram nesse cálculo
 * @param fetchedAt         quando o batch de origem foi buscado
 */
public record CmcGlobalDTO(
        Double totalMarketCap,
        Double btcDominance,
        Double top100Volume24h,
        int coinsTracked,
        LocalDateTime fetchedAt
) {}