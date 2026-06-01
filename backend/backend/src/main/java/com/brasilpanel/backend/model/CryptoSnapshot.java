package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Snapshot de mercado de uma criptomoeda — dados do CoinGecko.
 * Um registro por moeda por fetch: preço atual, market cap e variação 24h.
 *
 * A API retorna até 100 moedas por chamada; cada uma vira um registro separado.
 * Preços em USD (padrão CoinGecko vs BRL pode variar — registrar a moeda).
 */
@Entity
@Table(name = "crypto_snapshots",
       indexes = {
           @Index(name = "idx_crypto_coin_fetched", columnList = "coin_id, fetched_at"),
           @Index(name = "idx_crypto_fetched", columnList = "fetched_at")
       })
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CryptoSnapshot {

    // Campos
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID único do CoinGecko — ex: "bitcoin", "ethereum", "solana" */
    @Column(name = "coin_id", nullable = false, length = 60)
    private String coinId;

    /** Símbolo de mercado — ex: "btc", "eth", "sol" */
    @Column(nullable = false, length = 20)
    private String symbol;

    /** Nome legível — ex: "Bitcoin", "Ethereum" */
    @Column(nullable = false, length = 80)
    private String name;

    /** URL da imagem/ícone fornecida pelo CoinGecko */
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    /** Preço atual no momento do fetch */
    @Column(nullable = false, precision = 30, scale = 10)
    private BigDecimal currentPrice;

    /** Market cap em USD */
    @Column(precision = 30, scale = 2)
    private BigDecimal marketCap;

    /** Variação percentual nas últimas 24h — ex: 2.35 significa +2,35% */
    @Column(precision = 10, scale = 4)
    private BigDecimal priceChange24h;

    /** Moeda de referência dos preços — ex: "usd", "brl" */
    @Column(nullable = false, length = 10)
    private String currency;

    /** Quando buscamos esse snapshot da API */
    @Column(nullable = false)
    private LocalDateTime fetchedAt;

    @PrePersist
    void prePersist() {
        if (fetchedAt == null) fetchedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        fetchedAt = LocalDateTime.now();
    }
}
