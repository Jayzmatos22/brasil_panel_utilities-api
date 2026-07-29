package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Snapshot de mercado de uma criptomoeda — dados da CoinMarketCap.
 * Um registro por moeda por fetch, todos do mesmo batch compartilhando o fetchedAt.
 *
 * <p>Tabela separada de {@link CryptoSnapshot} de propósito: as duas fontes são
 * expostas lado a lado no painel e não devem se misturar em nenhuma consulta.
 * Além disso a CoinMarketCap devolve campos que o CoinGecko não tem (rank, volume,
 * variações de 1h/7d, supply), que ficariam nulos numa tabela compartilhada.
 *
 * <p>O logo não é persistido: deriva de forma determinística do cmcId pelo CDN público
 * (ver {@code CoinMarketCapService#logoUrl}).
 */
@Entity
@Table(name = "cmc_crypto_snapshots",
       indexes = {
           @Index(name = "idx_cmc_coin_fetched", columnList = "cmc_id, fetched_at"),
           @Index(name = "idx_cmc_symbol_fetched", columnList = "symbol, fetched_at"),
           @Index(name = "idx_cmc_fetched", columnList = "fetched_at")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmcCryptoSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID numérico da CoinMarketCap — ex: 1 (Bitcoin), 1027 (Ethereum) */
    @Column(name = "cmc_id", nullable = false)
    private Integer cmcId;

    /** Símbolo de mercado — ex: "BTC", "ETH" (a CMC devolve em maiúsculas) */
    @Column(nullable = false, length = 20)
    private String symbol;

    /** Nome legível — ex: "Bitcoin" */
    @Column(nullable = false, length = 80)
    private String name;

    /** Slug da CoinMarketCap — ex: "bitcoin"; usado na busca por nome */
    @Column(length = 80)
    private String slug;

    /** Posição no ranking por market cap no momento do fetch */
    @Column(name = "cmc_rank")
    private Integer cmcRank;

    @Column(nullable = false, precision = 30, scale = 10)
    private BigDecimal currentPrice;

    @Column(precision = 30, scale = 2)
    private BigDecimal marketCap;

    /** Volume negociado nas últimas 24h, na moeda de referência */
    @Column(precision = 30, scale = 2)
    private BigDecimal volume24h;

    /** Variação percentual na última hora — ex: 2.35 significa +2,35% */
    @Column(precision = 10, scale = 4)
    private BigDecimal percentChange1h;

    @Column(precision = 10, scale = 4)
    private BigDecimal percentChange24h;

    @Column(precision = 10, scale = 4)
    private BigDecimal percentChange7d;

    /** Fatia no market cap total do mercado, em % — ex: 58.6704 para o BTC */
    @Column(precision = 10, scale = 4)
    private BigDecimal marketCapDominance;

    @Column(precision = 30, scale = 4)
    private BigDecimal circulatingSupply;

    @Column(precision = 30, scale = 4)
    private BigDecimal totalSupply;

    /** Emissão máxima; null para moedas sem teto (ex: Ethereum) */
    @Column(precision = 30, scale = 4)
    private BigDecimal maxSupply;

    /** Moeda de referência dos preços — ex: "BRL" */
    @Column(nullable = false, length = 10)
    private String currency;

    /** Quando buscamos esse snapshot da API */
    @Column(nullable = false)
    private LocalDateTime fetchedAt;

    @PrePersist
    void prePersist() {
        if (fetchedAt == null) fetchedAt = LocalDateTime.now();
    }
}