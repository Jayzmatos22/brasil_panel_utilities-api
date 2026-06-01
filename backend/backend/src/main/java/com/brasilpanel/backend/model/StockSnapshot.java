package com.brasilpanel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Snapshot de cotação de uma ação — dados do Alpha Vantage.
 * Um registro por símbolo por pregão (latestTradingDay).
 *
 * Ex: PETR4 no pregão 2026-05-30 → preço, abertura, máxima, mínima, volume, variação.
 */
@Entity
@Table(name = "stock_snapshots",
       indexes = {
           @Index(name = "idx_stock_symbol_date", columnList = "symbol, trading_day"),
           @Index(name = "idx_stock_trading_day", columnList = "trading_day")
       },
       uniqueConstraints = @UniqueConstraint(
               name = "uq_stock_symbol_day",
               columnNames = {"symbol", "trading_day"}
       ))
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockSnapshot {

    // Campos
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ticker da ação — ex: "PETR4", "VALE3", "AAPL" */
    @Column(nullable = false, length = 12)
    private String symbol;

    /** Último pregão disponível */
    @Column(name = "trading_day", nullable = false)
    private LocalDate tradingDay;

    /** Preço de abertura do pregão */
    @Column(precision = 19, scale = 4)
    private BigDecimal open;

    /** Preço máximo do pregão */
    @Column(precision = 19, scale = 4)
    private BigDecimal high;

    /** Preço mínimo do pregão */
    @Column(precision = 19, scale = 4)
    private BigDecimal low;

    /** Preço de fechamento (último preço disponível) */
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal price;

    /** Preço de fechamento do pregão anterior */
    @Column(precision = 19, scale = 4)
    private BigDecimal previousClose;

    /** Variação absoluta em relação ao fechamento anterior */
    @Column(precision = 19, scale = 4)
    private BigDecimal change;

    /** Variação percentual — ex: "+1.25%" guardado como "1.25" */
    @Column(precision = 10, scale = 4)
    private BigDecimal changePercent;

    /** Volume negociado no pregão */
    private Long volume;

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
