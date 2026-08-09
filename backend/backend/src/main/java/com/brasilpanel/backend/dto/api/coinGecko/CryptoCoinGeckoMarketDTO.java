package com.brasilpanel.backend.dto.api.coinGecko;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.time.LocalDateTime;

/**
 * Moeda do top 100 do CoinGecko.
 *
 * <p>Este record faz dois papéis: desserializa a resposta da API e é o que o painel
 * consome. Por isso {@code fetchedAt} não tem {@code @JsonAlias} — o CoinGecko não
 * manda esse campo, ele chega nulo da API e é carimbado por quem buscou, ou vem do
 * {@code fetchedAt} do snapshot quando a leitura é servida do banco.
 *
 * <p>Expor a data não é enfeite: a leitura é servida do banco e, hoje, sem checagem
 * de idade. Preço sem data deixa o usuário achar que é cotação ao vivo quando pode
 * ser de dias atrás.
 */
public record CryptoCoinGeckoMarketDTO(
        // 100 objetos na requisição
        String id,
        String symbol,
        String name,
        @JsonAlias("current_price") Double currentPrice,
        @JsonAlias("market_cap") Long marketCap,
        @JsonAlias("price_change_percentage_24h") Double priceChange24h,
        @JsonAlias("image") String imageUrl,
        /** Quando o dado foi buscado da fonte — nulo só entre desserializar e carimbar */
        LocalDateTime fetchedAt
) {

    /** Cópia com a data de busca preenchida — o record é imutável, então devolve nova instância. */
    public CryptoCoinGeckoMarketDTO withFetchedAt(LocalDateTime instante) {
        return new CryptoCoinGeckoMarketDTO(
                id, symbol, name, currentPrice, marketCap, priceChange24h, imageUrl, instante);
    }
}